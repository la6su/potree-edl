import { MathUtils, Mesh, MeshStandardMaterial, SphereGeometry, Vector2, Vector3 } from 'three';
const DEFAULT_SCALE = new Vector3(1, 1, 1);
const tmpOrigin = new Vector3();
const tmpPosition = new Vector3();
const tmpScale = new Vector3();
const tmpSize = new Vector2();
const DEFAULT_MATERIAL = new MeshStandardMaterial({
  color: 'red'
});
function isPerspectiveCamera(cam) {
  return cam.isPerspectiveCamera;
}
function isOrthographicCamera(cam) {
  return cam.isOrthographicCamera;
}
const SHARED_GEOMETRY = new SphereGeometry(1);
const DEFAULT_RADIUS = 10;

/**
 * A 3D sphere that maintains the same apparent radius in screen space pixels.
 */
export default class ConstantSizeSphere extends Mesh {
  /**
   * The radius, in pixels.
   */

  enableRaycast = true;
  isConstantSizeSphere = true;
  type = 'ConstantSizeSphere';
  constructor(options) {
    super(SHARED_GEOMETRY, options?.material ?? DEFAULT_MATERIAL);
    this.radius = options?.radius ?? DEFAULT_RADIUS;
  }
  raycast(raycaster, intersects) {
    if (this.enableRaycast) {
      super.raycast(raycaster, intersects);
    }
  }
  onBeforeRender(renderer, _scene, camera) {
    this.updateWorldMatrix(true, false);
    const scale = getWorldSpaceRadius(renderer, camera, this.getWorldPosition(tmpPosition), this.radius);
    const parentScale = this.parent?.getWorldScale(tmpScale) ?? DEFAULT_SCALE;

    // We want the sphere to ignore the world scale,
    // as it should have a constant size on screen.
    this.scale.set(1 / parentScale.x * scale, 1 / parentScale.y * scale, 1 / parentScale.z * scale);
    this.updateMatrixWorld();
  }
}

/**
 * Returns the radius in world units so that a sphere appears to have a given radius in pixels.
 */
export function getWorldSpaceRadius(renderer, camera, worldPosition, screenSpaceRadius) {
  const origin = camera.getWorldPosition(tmpOrigin);
  const dist = origin.distanceTo(worldPosition);
  let fieldOfViewHeight;
  if (isPerspectiveCamera(camera)) {
    const fovRads = MathUtils.degToRad(camera.fov) / 2;
    fieldOfViewHeight = 2 * Math.tan(fovRads) * dist;
  } else if (isOrthographicCamera(camera)) {
    fieldOfViewHeight = Math.abs(camera.top - camera.bottom) / camera.zoom;
  } else {
    throw new Error('unsupported camera type');
  }
  const size = renderer.getSize(tmpSize);
  const pixelRatio = screenSpaceRadius / size.height;
  const worldSpaceRadius = fieldOfViewHeight * pixelRatio;
  return worldSpaceRadius;
}
export function isConstantSizeSphere(obj) {
  if (obj == null) {
    return false;
  }
  return obj.isConstantSizeSphere;
}