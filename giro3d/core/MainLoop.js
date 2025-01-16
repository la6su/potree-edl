import { Clock, MathUtils, Plane, Sphere, Vector3 } from 'three';
import { isBufferGeometry } from '../utils/predicates';
/** Rendering state */
export let RenderingState = /*#__PURE__*/function (RenderingState) {
  RenderingState[RenderingState["RENDERING_PAUSED"] = 0] = "RENDERING_PAUSED";
  RenderingState[RenderingState["RENDERING_SCHEDULED"] = 1] = "RENDERING_SCHEDULED";
  return RenderingState;
}({});
class ContextImpl {
  constructor(view) {
    this.view = view;
    this.distance = {
      plane: new Plane().setFromNormalAndCoplanarPoint(view.camera.getWorldDirection(new Vector3()), view.camera.position),
      min: Infinity,
      max: 0
    };
  }
}
const tmpSphere = new Sphere();
function updateElements(context, entity, elements) {
  if (!elements) {
    return;
  }
  for (const element of elements) {
    // update element
    const newElementsToUpdate = entity.update(context, element);
    updateElements(context, entity, newElementsToUpdate);
  }
}
class MainLoop {
  get renderingState() {
    return this._renderingState;
  }
  _automaticCameraPlaneComputation = true;
  _clock = new Clock();
  _frame = 0;

  /**
   * The number of frames processed.
   */
  get frameCount() {
    return this._frame;
  }

  /**
   * Toggles automatic camera clipping plane computation.
   * @defaultValue true
   */
  get automaticCameraPlaneComputation() {
    return this._automaticCameraPlaneComputation;
  }
  set automaticCameraPlaneComputation(v) {
    this._automaticCameraPlaneComputation = v;
  }
  constructor() {
    this._renderingState = RenderingState.RENDERING_PAUSED;
    this._needsRedraw = false;
    this._updateLoopRestarted = true;
    this._changeSources = new Set();
  }
  scheduleUpdate(instance, changeSource = undefined, options) {
    if (changeSource != null) {
      if (Array.isArray(changeSource)) {
        changeSource.forEach(s => this._changeSources.add(s));
      } else {
        this._changeSources.add(changeSource);
      }
    }
    const needsRedraw = options?.needsRedraw ?? true;
    const immediate = options?.immediate ?? false;
    this._needsRedraw = this._needsRedraw || needsRedraw;
    if (this._renderingState !== RenderingState.RENDERING_SCHEDULED) {
      this._renderingState = RenderingState.RENDERING_SCHEDULED;
      if (immediate) {
        this.step(instance);
      } else {
        requestAnimationFrame(() => {
          this.step(instance);
        });
      }
    }
  }
  update(instance, updateSources, dt) {
    if (this.automaticCameraPlaneComputation) {
      // Reset near/far to default value to allow update function to test
      // visibility using camera's frustum; without depending on the near/far
      // values which are only used for rendering.
      instance.view.resetPlanes();
    }
    const frame = this._frame;

    // We can't just use camera.updateProjectionMatrix() because part of
    // the update process use camera._viewMatrix, and this matrix depends
    // on near/far values.
    instance.view.update();
    const context = new ContextImpl(instance.view);
    for (const entity of instance.getEntities()) {
      if (entity.shouldCheckForUpdate()) {
        instance.dispatchEvent({
          type: 'before-entity-update',
          frame,
          entity,
          dt,
          updateLoopRestarted: this._updateLoopRestarted
        });

        // Filter updateSources that are relevant for the entity
        const srcs = entity.filterChangeSources(updateSources);
        if (srcs.size > 0) {
          // `preUpdate` returns an array of elements to update
          const elementsToUpdate = entity.preUpdate(context, srcs);
          // `update` is called in `updateElements`.
          updateElements(context, entity, elementsToUpdate);
          // `postUpdate` is called when this geom layer update process is finished
          entity.postUpdate(context, updateSources);
        }
        if ('distance' in entity) {
          const entityDistance = entity.distance;
          context.distance.min = Math.min(context.distance.min, entityDistance.min);
          if (entityDistance.max === Infinity) {
            context.distance.max = instance.view.maxFarPlane;
          } else {
            context.distance.max = Math.max(context.distance.max, entityDistance.max);
          }
        }
        instance.dispatchEvent({
          type: 'after-entity-update',
          frame,
          entity,
          dt,
          updateLoopRestarted: this._updateLoopRestarted
        });
      }
    }

    // TODO document the fact Object3D must be added through threeObjects
    // if they want to influence the near / far planes
    this.updateCameraPlanesFromObjects(context, instance);
    if (this.automaticCameraPlaneComputation) {
      instance.view.near = context.distance.min;
      instance.view.far = context.distance.max;
    }
    instance.view.update();
  }
  updateCameraPlanesFromObjects(context, instance) {
    instance.threeObjects.traverse(o => {
      if (!o.visible) {
        return;
      }
      if ('geometry' in o && isBufferGeometry(o.geometry)) {
        const boundingSphere = o.geometry.boundingSphere;
        if (boundingSphere && !boundingSphere.isEmpty()) {
          tmpSphere.copy(boundingSphere);
          tmpSphere.applyMatrix4(o.matrixWorld);
          const d = tmpSphere.distanceToPoint(context.view.camera.position);
          context.distance.min = MathUtils.clamp(d, 0.01, context.distance.min);
          context.distance.max = Math.max(context.distance.max, d + 2 * tmpSphere.radius);
        }
      }
    });
  }
  step(instance) {
    const dt = this._clock.getDelta() * 1000;
    const frame = this._frame++;
    instance.dispatchEvent({
      type: 'update-start',
      frame,
      dt,
      updateLoopRestarted: this._updateLoopRestarted
    });
    const willRedraw = this._needsRedraw;

    // Reset internal state before calling _update (so future calls to Instance.notifyChange()
    // can properly change it)
    this._needsRedraw = false;
    this._renderingState = RenderingState.RENDERING_PAUSED;
    const updateSources = new Set(this._changeSources);
    this._changeSources.clear();
    instance.dispatchEvent({
      type: 'before-camera-update',
      frame,
      camera: instance.view,
      dt,
      updateLoopRestarted: this._updateLoopRestarted
    });
    const dim = instance.engine.getWindowSize();
    instance.view.update(dim.x, dim.y);
    instance.dispatchEvent({
      type: 'after-camera-update',
      frame,
      camera: instance.view,
      dt,
      updateLoopRestarted: this._updateLoopRestarted
    });

    // Disable camera's matrix auto update to make sure the camera's
    // world matrix is never updated mid-update.
    // Otherwise inconsistencies can appear because object visibility
    // testing and object drawing could be performed using different
    // camera matrixWorld.
    // Note: this is required at least because WEBGLRenderer calls
    // camera.updateMatrixWorld()
    const oldAutoUpdate = instance.view.camera.matrixAutoUpdate;
    instance.view.camera.matrixAutoUpdate = false;

    // update data-structure
    this.update(instance, updateSources, dt);

    // Redraw *only* if needed.
    // (redraws only happen when this.needsRedraw is true, which in turn only happens when
    // instance.notifyChange() is called with redraw=true)
    // As such there's no continuous update-loop, instead we use a ad-hoc update/render
    // mechanism.
    if (willRedraw) {
      instance.dispatchEvent({
        type: 'before-render',
        frame,
        dt,
        updateLoopRestarted: this._updateLoopRestarted
      });
      instance.render();
      instance.dispatchEvent({
        type: 'after-render',
        frame,
        dt,
        updateLoopRestarted: this._updateLoopRestarted
      });
    }

    // next time, we'll consider that we've just started the loop if we are still PAUSED now
    this._updateLoopRestarted = this._renderingState === RenderingState.RENDERING_PAUSED;
    instance.view.camera.matrixAutoUpdate = oldAutoUpdate;
    instance.dispatchEvent({
      type: 'update-end',
      frame,
      dt,
      updateLoopRestarted: this._updateLoopRestarted
    });
  }
}
export default MainLoop;