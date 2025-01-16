import { Object3D } from 'three';
import { isPolygonMesh } from './PolygonMesh';
export default class MultiPolygonMesh extends Object3D {
  isSimpleGeometryMesh = true;
  isMultiPolygonMesh = true;
  type = 'MultiPolygonMesh';
  userData = {};
  set opacity(opacity) {
    this.traversePolygons(p => p.opacity = opacity);
  }
  constructor(polygons) {
    super();
    this.matrixAutoUpdate = false;
    this.add(...polygons);
  }

  /**
   * Executes the callback on all the {@link PolygonMesh}es of this mesh.
   * @param callback - The callback to execute.
   */
  traversePolygons(callback) {
    this.traverse(obj => {
      if (isPolygonMesh(obj)) {
        callback(obj);
      }
    });
  }
  dispose() {
    this.traversePolygons(p => p.dispose());
    this.dispatchEvent({
      type: 'dispose'
    });
  }
}
export function isMultiPolygonMesh(obj) {
  return obj?.isMultiPolygonMesh ?? false;
}