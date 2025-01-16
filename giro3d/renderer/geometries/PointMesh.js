import { MathUtils, Sprite } from 'three';
import { DEFAULT_POINT_SIZE } from '../../core/FeatureTypes';
export default class PointMesh extends Sprite {
  isSimpleGeometryMesh = true;
  isPointMesh = true;
  type = 'PointMesh';
  _featureOpacity = 1;
  _styleOpacity = 1;
  userData = {};
  constructor(params) {
    super(params.material);
    this._styleOpacity = params.opacity ?? 1;
    this._pointSize = params.pointSize ?? DEFAULT_POINT_SIZE;

    // We initialize the scale at zero and it will be updated with
    // onBeforeRender() whenever the point become visible. This is necessary
    // to avoid intercepting raycasts when the scale is not yet computed.
    this.scale.set(0, 0, 0);
    this.updateMatrix();
    this.updateMatrixWorld(true);
  }
  set opacity(opacity) {
    this._featureOpacity = opacity;
    this.updateOpacity();
  }
  updateOpacity() {
    this.material.opacity = this._featureOpacity * this._styleOpacity;
    // Because of textures, we have to force transparency
    this.material.transparent = true;
    this.matrixAutoUpdate = false;
  }
  onBeforeRender(renderer, _scene, camera) {
    // sprite size stand for sprite height in view

    const resolutionHeight = renderer.getRenderTarget()?.height ?? renderer.domElement?.height;
    const fov = MathUtils.degToRad(camera.fov);
    const spriteSize = resolutionHeight * (1 / (2 * Math.tan(fov / 2))); // this is in pixel
    // so the real height depends on pixel can be calculate as:
    const scale = 0.75 * (this._pointSize / spriteSize);
    if (this.scale.x !== scale) {
      this.scale.set(scale, scale, 1);
      this.updateMatrix();
      this.updateMatrixWorld(true);
    }
  }
  update(options) {
    if (options.material) {
      this.material = options.material;
      this._styleOpacity = options.opacity ?? 1;
      this.updateOpacity();
      this._pointSize = options.pointSize ?? DEFAULT_POINT_SIZE;
    }
    this.renderOrder = options.renderOrder;

    // We can't have no material on a mesh,
    // so setting a material to "null" only hides the mesh.
    this.visible = options.material != null;
  }
  dispose() {
    this.geometry.dispose();
    // Don't dispose the material as it is not owned by this mesh.

    // @ts-expect-error dispose is not known because the types for three.js
    // "forget" to expose event map to subclasses.
    this.dispatchEvent({
      type: 'dispose'
    });
  }
}
export function isPointMesh(obj) {
  return obj?.isPointMesh ?? false;
}