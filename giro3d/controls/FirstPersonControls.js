import { Euler, MathUtils, Quaternion, Vector2, Vector3 } from 'three';
import { isPerspectiveCamera } from '../utils/predicates';

// Note: we could use existing js controls (like
// https://github.com/mrdoob/js/blob/dev/examples/js/controls/FirstPersonControls.js) but
// including these controls in Giro3D allows use to integrate them tightly with Giro3D.  Especially
// the existing controls are expecting a continuous update loop while we have a pausable one (so our
// controls use .notifyChange when needed)

const tmpVec2 = new Vector2();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function limitRotation(camera, rot) {
  // Limit vertical rotation (look up/down) to make sure the user cannot see
  // outside of the cone defined by verticalFOV
  // const limit = MathUtils.degToRad(verticalFOV - camera.fov * 0.5) * 0.5;
  const limit = Math.PI * 0.5 - 0.01;
  return MathUtils.clamp(rot, -limit, limit);
}
function applyRotation(instance, camera, state) {
  camera.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), camera.up);
  camera.rotateY(state.rotateY);
  camera.rotateX(state.rotateX);
  instance.notifyChange(instance.view.camera);
}
const MOVEMENTS = {
  38: {
    method: 'translateZ',
    sign: -1
  },
  // FORWARD: up key
  40: {
    method: 'translateZ',
    sign: 1
  },
  // BACKWARD: down key
  37: {
    method: 'translateX',
    sign: -1
  },
  // STRAFE_LEFT: left key
  39: {
    method: 'translateX',
    sign: 1
  },
  // STRAFE_RIGHT: right key
  33: {
    method: 'translateY',
    sign: 1
  },
  // UP: PageUp key
  34: {
    method: 'translateY',
    sign: -1
  } // DOWN: PageDown key
};
class FirstPersonControls {
  options = {
    moveSpeed: 10,
    verticalFOV: 180,
    focusOnClick: false,
    focusOnMouseOver: false,
    disableEventListeners: false
  };
  _mouseDown = new Vector2();
  /**
   * @param instance - the Giro3D instance to control
   * @param options - additional options
   */
  constructor(instance, options = {}) {
    if (!isPerspectiveCamera(instance.view.camera)) {
      throw new Error('this control only supports perspective cameras');
    }
    this._camera = instance.view.camera;
    this._instance = instance;
    this.enabled = true;
    this._moves = new Set();
    if (options.panoramaRatio != null) {
      const radius = options.panoramaRatio * 200 / (2 * Math.PI);
      options.verticalFOV = options.panoramaRatio === 2 ? 180 : MathUtils.radToDeg(2 * Math.atan(200 / (2 * radius)));
    }
    this.options.verticalFOV = options.verticalFOV ?? this.options.verticalFOV;
    this.options.minHeight = options.minHeight ?? this.options.minHeight;
    this.options.maxHeight = options.maxHeight ?? this.options.maxHeight;

    // backward or forward move speed in m/s
    this.options.moveSpeed = options.moveSpeed ?? this.options.moveSpeed;
    this._isMouseDown = false;
    this._state = {
      rotateX: 0,
      rotateY: 0
    };
    this.reset();
    const domElement = instance.domElement;
    if (options.disableEventListeners !== true) {
      domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
      domElement.addEventListener('touchstart', this.onTouchStart.bind(this), false);
      domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
      domElement.addEventListener('touchmove', this.onTouchMove.bind(this), false);
      domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
      domElement.addEventListener('touchend', this.onTouchEnd.bind(this), false);
      domElement.addEventListener('keyup', this.onKeyUp.bind(this), true);
      domElement.addEventListener('keydown', this.onKeyDown.bind(this), true);
      domElement.addEventListener('wheel', this.onMouseWheel.bind(this), false);
    }
    this._instance.addEventListener('after-camera-update', this.update.bind(this));

    // focus policy
    if (options.focusOnMouseOver === true) {
      domElement.addEventListener('mouseover', () => domElement.focus());
    }
    if (options.focusOnClick === true) {
      domElement.addEventListener('click', () => domElement.focus());
    }
  }
  isUserInteracting() {
    return this._moves.size !== 0 || this._isMouseDown;
  }

  /**
   * Resets the controls internal state to match the camera' state.
   * This must be called when manually modifying the camera's position or rotation.
   *
   * @param preserveRotationOnX - if true, the look up/down rotation will
   * not be copied from the camera
   */
  reset(preserveRotationOnX = false) {
    // Compute the correct init state, given the calculus in applyRotation:
    // cam.quaternion = q * r
    // => r = invert(q) * cam.quaterion
    // q is the quaternion derived from the up vector
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this._camera.up);
    q.invert();
    // compute r
    const r = this._camera.quaternion.clone().premultiply(q);
    // tranform it to euler
    const e = new Euler(0, 0, 0, 'YXZ').setFromQuaternion(r);
    if (!preserveRotationOnX) {
      this._state.rotateX = e.x;
    }
    this._state.rotateY = e.y;
  }

  /**
   * Updates the camera position / rotation based on occured input events.
   * This is done automatically when needed but can also be done if needed.
   *
   * @param event - Event
   * @param force - set to true if you want to force the update, even if it
   * appears unneeded.
   */
  update(event, force = false) {
    if (!this.enabled) {
      return;
    }
    // dt will not be relevant when we just started rendering, we consider a 1-frame move in
    // this case
    const dt = event.updateLoopRestarted ? 16 : event.dt;
    for (const move of this._moves) {
      if (move.method === 'translateY') {
        this._camera.position.z += move.sign * this.options.moveSpeed * dt / 1000;
      } else {
        this._camera[move.method](move.sign * this.options.moveSpeed * dt / 1000);
      }
    }
    if (this.options.minHeight != null && this._camera.position.z < this.options.minHeight) {
      this._camera.position.z = this.options.minHeight;
    } else if (this.options.maxHeight != null && this._camera.position.z > this.options.maxHeight) {
      this._camera.position.z = this.options.maxHeight;
    }
    if (this._isMouseDown === true || force === true) {
      applyRotation(this._instance, this._camera, this._state);
    }
    if (this._moves.size > 0) {
      this._instance.notifyChange(this._instance.view.camera);
    }
  }
  onInteractionStart(event) {
    if (!this.enabled) {
      return;
    }
    event.preventDefault();
    this._isMouseDown = true;
    const coords = this._instance.eventToCanvasCoords(event, tmpVec2);
    this._mouseDown.copy(coords);
    this._stateOnMouseDown = this.snapshot();
  }
  onMouseDown(event) {
    if (event.button !== 0) {
      return;
    }
    this.onInteractionStart(event);
  }
  onTouchStart(event) {
    this.onInteractionStart(event);
  }
  snapshot() {
    return {
      ...this._state
    };
  }
  onMouseUp(event) {
    if (!this.enabled || event.button !== 0) {
      return;
    }
    this._isMouseDown = false;
  }
  onTouchEnd() {
    if (!this.enabled) {
      return;
    }
    this._isMouseDown = false;
  }
  onInteractionMove(event) {
    if (!this.enabled) {
      return;
    }
    if (this._isMouseDown === true) {
      const cam = this._camera;

      // in rigor we have tan(theta) = tan(cameraFOV) * deltaH / H
      // (where deltaH is the vertical amount we moved, and H the renderer height)
      // we loosely approximate tan(x) by x
      const pxToAngleRatio = MathUtils.degToRad(cam.fov) / this._instance.engine.height;
      const {
        x,
        y
      } = this._instance.eventToCanvasCoords(event, tmpVec2);
      const {
        rotateX,
        rotateY
      } = this._stateOnMouseDown ?? {
        rotateX: 0,
        rotateY: 0
      };
      const fov = this.options.verticalFOV;
      const mouse = this._mouseDown;

      // update state based on pointer movement
      this._state.rotateX = limitRotation(cam, (y - mouse.y) * pxToAngleRatio + rotateX, fov);
      this._state.rotateY = (x - mouse.x) * pxToAngleRatio + rotateY;
      applyRotation(this._instance, cam, this._state);
    }
  }
  onMouseMove(event) {
    if (event.button !== 0) {
      return;
    }
    this.onInteractionMove(event);
  }
  onTouchMove(event) {
    this.onInteractionMove(event);
  }
  onMouseWheel(event) {
    if (!this.enabled) {
      return;
    }
    let delta = 0;
    if ('wheelDelta' in event && event.wheelDelta != null) {
      delta = -event.wheelDelta;
      // Firefox
    } else if (event.detail !== undefined) {
      delta = event.detail;
    }
    this._camera.fov = MathUtils.clamp(this._camera.fov + Math.sign(delta), 10, Math.min(100, this.options.verticalFOV));
    this._camera.updateProjectionMatrix();
    this._state.rotateX = limitRotation(this._camera, this._state.rotateX, this.options.verticalFOV);
    applyRotation(this._instance, this._camera, this._state);
  }

  // Keyboard handling
  onKeyUp(e) {
    if (!this.enabled) {
      return;
    }
    const move = MOVEMENTS[e.keyCode];
    if (move != null) {
      this._moves.delete(move);
      this._instance.notifyChange(undefined);
      e.preventDefault();
    }
  }
  onKeyDown(e) {
    if (!this.enabled) {
      return;
    }
    const move = MOVEMENTS[e.keyCode];
    if (move != null) {
      this._moves.add(move);
      this._instance.notifyChange(undefined);
      e.preventDefault();
    }
  }
}
export default FirstPersonControls;