import { Object3D } from 'three';
import { isPointMesh } from './PointMesh';
export default class MultiPointMesh extends Object3D {
  isSimpleGeometryMesh = true;
  isMultiPointMesh = true;
  type = 'MultiPointMesh';
  userData = {};
  constructor(points) {
    super();
    this.add(...points);
  }
  set opacity(opacity) {
    this.traversePoints(p => p.opacity = opacity);
  }

  /**
   * Executes the callback on all the {@link PointMesh}es of this mesh.
   * @param callback - The callback to execute.
   */
  traversePoints(callback) {
    this.traverse(obj => {
      if (isPointMesh(obj)) {
        callback(obj);
      }
    });
  }
  dispose() {
    this.traversePoints(p => p.dispose());
    this.dispatchEvent({
      type: 'dispose'
    });
  }
}
export function isMultiPointMesh(obj) {
  return obj?.isMultiPointMesh ?? false;
}