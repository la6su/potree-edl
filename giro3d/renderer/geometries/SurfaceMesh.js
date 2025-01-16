import { Mesh } from 'three';
export default class SurfaceMesh extends Mesh {
  isSurfaceMesh = true;
  type = 'SurfaceMesh';
  _featureOpacity = 1;
  _styleOpacity = 1;
  userData = {};
  parent = null;
  constructor(params) {
    super(params.geometry, params.material);
    this._styleOpacity = params.opacity;
    this.matrixAutoUpdate = false;
  }
  set opacity(opacity) {
    this._featureOpacity = opacity;
    this.updateOpacity();
  }
  updateOpacity() {
    this.material.opacity = this._featureOpacity * this._styleOpacity;
    this.material.transparent = this.material.opacity < 1;
  }
  update(options) {
    this.material = options.material;
    this._styleOpacity = options.opacity;
    this.renderOrder = options.renderOrder;
    this.visible = true;
    this.updateOpacity();
  }
  dispose() {
    this.geometry.dispose();
    // Don't dispose the material as it is not owned by this mesh.
    this.dispatchEvent({
      type: 'dispose'
    });
  }
}
export function isSurfaceMesh(obj) {
  return obj?.isSurfaceMesh ?? false;
}