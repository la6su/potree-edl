import { Line2 } from 'three/examples/jsm/lines/Line2.js';
export default class LineStringMesh extends Line2 {
  isSimpleGeometryMesh = true;
  isLineStringMesh = true;
  type = 'LineStringMesh';
  _featureOpacity = 1;
  _styleOpacity = 1;
  userData = {};
  constructor(geometry, material, opacity) {
    super(geometry, material);
    this.matrixAutoUpdate = false;
    this._styleOpacity = opacity;
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
  update(options) {
    if (options.material) {
      this.material = options.material;
      this._styleOpacity = options.opacity;
      this.updateOpacity();
      this.visible = true;
    } else {
      this.visible = false;
    }
    this.renderOrder = options.renderOrder;
  }
  updateOpacity() {
    this.material.opacity = this._styleOpacity * this._featureOpacity;
    this.material.transparent = this.material.opacity < 1;
  }
  onBeforeRender(renderer) {
    // We have to specify the screen size to be able to properly render
    // lines that have a width in pixels. Note that this should be automatically done
    // by three.js in the future, but for now we have to do it manually.
    const {
      width,
      height
    } = renderer.getRenderTarget() ?? renderer.getContext().canvas;
    this.material.resolution.set(width, height);
  }
  set opacity(opacity) {
    this._featureOpacity = opacity;
    this.updateOpacity();
  }
}
export function isLineStringMesh(obj) {
  return obj?.isLineStringMesh ?? false;
}