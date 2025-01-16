import { Box3 } from 'three';
import pickObjectsAt from '../core/picking/PickObjectsAt';
import { isMaterial } from '../utils/predicates';
import Entity from './Entity';
/**
 * Base class for any {@link Entity} that displays 3D objects.
 *
 * Subclasses *must* call `onObjectCreated` when creating new Object3D, before adding them to the
 * scene
 */
class Entity3D extends Entity {
  isMemoryUsage = true;
  type = 'Entity3D';
  isPickable = true;
  /**
   * Read-only flag to check if a given object is of type Entity3D.
   */
  isEntity3D = true;
  get distance() {
    return {
      min: this._distance.min,
      max: this._distance.max
    };
  }
  /**
   * Creates a Entity3D with the specified parameters.
   *
   * @param object3d - the root Three.js of this entity
   */
  constructor(object3d) {
    super();
    if (object3d == null || !object3d.isObject3D) {
      throw new Error('Missing/Invalid object3d parameter (must be a three.js Object3D instance)');
    }
    if (object3d.type === 'Group' && object3d.name === '') {
      object3d.name = this.id;
    }
    this._visible = true;
    this._opacity = 1;
    this._object3d = object3d;

    // processing can overwrite that with values calculating from this layer's Object3D
    this._distance = {
      min: Infinity,
      max: 0
    };
    this._clippingPlanes = null;
    this._renderOrder = 0;
    this.onObjectCreated(object3d);
  }
  getMemoryUsage() {
    // Do nothing
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRenderingContextLost() {
    /* Do nothing */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRenderingContextRestored() {
    /* Do nothing */
  }

  /**
   * Returns the root object of this entity.
   */
  get object3d() {
    return this._object3d;
  }

  /**
   * Gets or sets the visibility of this entity.
   * A non-visible entity will not be automatically updated.
   */
  get visible() {
    return this._visible;
  }
  set visible(v) {
    if (this._visible !== v) {
      this._visible = v;
      this.updateVisibility();
      this.dispatchEvent({
        type: 'visible-property-changed',
        visible: v
      });
    }
  }

  /**
   * Gets or sets the render order of this entity.
   */
  get renderOrder() {
    return this._renderOrder;
  }
  set renderOrder(v) {
    if (v !== this._renderOrder) {
      this._renderOrder = v;
      this.updateRenderOrder();
      this.dispatchEvent({
        type: 'renderOrder-property-changed',
        renderOrder: v
      });
    }
  }

  /**
   * Gets or sets the opacity of this entity.
   */
  get opacity() {
    return this._opacity;
  }
  set opacity(v) {
    if (this._opacity !== v) {
      this._opacity = v;
      this.updateOpacity();
      this.dispatchEvent({
        type: 'opacity-property-changed',
        opacity: v
      });
    }
  }

  /**
   * Gets or sets the clipping planes set on this entity. Default is `null` (no clipping planes).
   *
   * Note: custom entities must ensure that the materials and shaders used do support
   * the [clipping plane feature](https://threejs.org/docs/index.html?q=materi#api/en/materials/Material.clippingPlanes) of three.js.
   * Refer to the three.js documentation for more information.
   */
  get clippingPlanes() {
    return this._clippingPlanes;
  }
  set clippingPlanes(planes) {
    this._clippingPlanes = planes;
    this.updateClippingPlanes();
    this.dispatchEvent({
      type: 'clippingPlanes-property-changed',
      clippingPlanes: planes
    });
  }

  /**
   * Updates the visibility of the entity.
   * Note: this method can be overriden for custom implementations.
   *
   */
  updateVisibility() {
    // Default implementation
    this.object3d.visible = this.visible;
  }

  /**
   * Updates the opacity of the entity.
   * Note: this method can be overriden for custom implementations.
   */
  updateOpacity() {
    // Default implementation
    this.traverseMaterials(material => {
      if (material.opacity != null) {
        // != null: we want the test to pass if opacity is 0
        const currentTransparent = material.transparent;
        material.transparent = this.opacity < 1.0;
        material.needsUpdate = currentTransparent !== material.transparent;
        material.opacity = this.opacity;
      }
    });
  }

  /**
   * Updates the render order of the entity.
   * Note: this method can be overriden for custom implementations.
   */
  updateRenderOrder() {
    // Default implementation
    this.traverse(o => {
      o.renderOrder = this.renderOrder;
    });
  }

  /**
   * Updates the clipping planes of all objects under this entity.
   */
  updateClippingPlanes() {
    this.traverseMaterials(mat => {
      mat.clippingPlanes = this._clippingPlanes;
    });
  }
  shouldCheckForUpdate() {
    return super.shouldCheckForUpdate() && this._visible;
  }
  shouldFullUpdate(updateSource) {
    return super.shouldFullUpdate(updateSource) || this.contains(updateSource);
  }
  shouldUpdate(updateSource) {
    return super.shouldUpdate(updateSource) || this.isOwned(updateSource);
  }

  /**
   * Returns true if this object belongs to this entity.
   *
   * @param obj - The object to test.
   */
  isOwned(obj) {
    if (obj.isObject3D) {
      if (obj.userData?.parentEntity === this) {
        return true;
      }
    }
    return false;
  }
  preUpdate(context, changeSources) {
    if (changeSources.size > 0) {
      // if we don't have any element in srcs, it means we don't need to update
      // our layer to display it correctly.  but in this case we still need to
      // use layer._distance to calculate near / far hence the reset is here,
      // and the update of context.distance is outside of this if
      this._distance.min = Infinity;
      this._distance.max = 0;
    }
    return null;
  }

  /**
   * Returns an approximated bounding box of this entity in the scene.
   *
   * @returns the resulting bounding box, or `null` if it could not be computed.
   */
  getBoundingBox() {
    const box = new Box3().setFromObject(this.object3d);
    return box;
  }

  /**
   * Applies entity-level setup on new object's material.
   *
   * Subclasses can override this to setup custom logic, for instance if the entity can produce
   * objects that are naturally transparent.
   *
   * @param material - the material of the newly created object
   */
  setupMaterial(material) {
    material.clippingPlanes = this._clippingPlanes;
    material.opacity = this._opacity;
    if (material.opacity < 1.0) {
      material.transparent = true;
    }
  }

  /**
   * Applies entity-level setup on a new object.
   *
   * Note: this method should be called from the subclassed entity to notify the parent
   * class that a new 3D object has just been created, so that it can be setup with entity-wide
   * parameters.
   *
   * @example
   * // In the subclass
   * const obj = new Object3D();
   *
   * // Notify the parent class
   * this.onObjectCreated(obj);
   * @param obj - The object to prepare.
   */
  onObjectCreated(obj) {
    // note: we use traverse() because the object might have its own sub-hierarchy as well.

    this.traverse(o => {
      // To be able to link an object to its parent entity (e.g for picking purposes)
      o.userData.parentEntity = this;
      this.assignRenderOrder(obj);
    }, obj);

    // Setup materials
    this.traverseMaterials(m => this.setupMaterial(m), obj);
    // dispatch event
    this.dispatchEvent({
      type: 'object-created',
      obj
    });
  }

  /**
   * Assigns the render order of this object.
   *
   * This may be overriden to perform custom logic.
   */
  assignRenderOrder(obj) {
    obj.renderOrder = this.renderOrder;
  }

  /**
   * Test whether this entity contains the given object.
   *
   * The object may be a component of the entity, or a 3D object.
   *
   * @param obj - The object to test.
   * @returns true if the entity contains the object.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contains() {
    return false;
  }

  /**
   * Traverses all materials in the hierarchy of this entity.
   *
   * @param callback - The callback.
   * @param root - The traversal root. If undefined, the traversal starts at the root
   * object of this entity.
   */
  traverseMaterials(callback, root = undefined) {
    this.traverse(o => {
      if ('material' in o) {
        if (Array.isArray(o.material)) {
          o.material.forEach(m => {
            if (isMaterial(m)) {
              callback(m);
            }
          });
        } else if (isMaterial(o.material)) {
          callback(o.material);
        }
      }
    }, root);
  }

  /**
   * Traverses all meshes in the hierarchy of this entity.
   *
   * @param callback - The callback.
   * @param root - The raversal root. If undefined, the traversal starts at the root
   * object of this entity.
   */
  traverseMeshes(callback, root = undefined) {
    const origin = root ?? this.object3d;
    origin.traverse(o => {
      if (o.isMesh) {
        callback(o);
      }
    });
  }

  /**
   * Traverses all objects in the hierarchy of this entity.
   *
   * @param callback - The callback.
   * @param root - The traversal root. If undefined, the traversal starts at the root
   * object of this entity.
   */
  traverse(callback, root = undefined) {
    const origin = root ?? this.object3d;
    origin.traverse(callback);
  }
  pick(canvasCoords, options) {
    return pickObjectsAt(this.instance, canvasCoords, this.object3d, options);
  }
}
export function isEntity3D(o) {
  return o.isEntity3D;
}
export default Entity3D;