import { Object3D } from 'three';
/**
 * Represents a single polygon geometry, including the surface and the rings.
 */
export default class PolygonMesh extends Object3D {
  isSimpleGeometryMesh = true;
  isPolygonMesh = true;
  type = 'PolygonMesh';
  isExtruded = false;
  _featureOpacity = 1;
  _surface = null;
  _linearRings = null;
  userData = {};
  get surface() {
    return this._surface;
  }
  set surface(newSurface) {
    this._surface?.dispose();
    this._surface?.removeFromParent();
    this._surface = newSurface;
    if (newSurface) {
      newSurface.opacity = this._featureOpacity;
      this.add(newSurface);
      this.updateMatrixWorld(true);
    }
  }
  get linearRings() {
    return this._linearRings;
  }
  set linearRings(newRings) {
    this._linearRings?.forEach(ring => {
      ring.removeFromParent();
      ring.dispose();
    });
    this._linearRings = newRings;
    if (newRings) {
      newRings.forEach(ring => ring.opacity = this._featureOpacity);
      this.add(...newRings);
      this.updateMatrixWorld(true);
    }
  }
  set opacity(opacity) {
    this._featureOpacity = opacity;
    if (this._surface) {
      this._surface.opacity = opacity;
    }
    if (this.linearRings) {
      this.linearRings.forEach(ring => ring.opacity = opacity);
    }
  }
  constructor(options) {
    super();
    this.matrixAutoUpdate = false;
    this.source = options.source;
    this._surface = options.surface ?? null;
    this._linearRings = options.linearRings ?? null;
    this.isExtruded = options.isExtruded ?? false;
    if (this._surface) {
      this.add(this._surface);
    }
    if (this._linearRings) {
      this.add(...this._linearRings);
    }
  }
  dispose() {
    this._surface?.dispose();
    this._linearRings?.forEach(ring => ring.dispose());
    this.dispatchEvent({
      type: 'dispose'
    });
  }
}
export function isPolygonMesh(obj) {
  return obj?.isPolygonMesh ?? false;
}