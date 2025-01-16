import { Object3D } from 'three';
import { isLineStringMesh } from './LineStringMesh';
export default class MultiLineStringMesh extends Object3D {
  isSimpleGeometryMesh = true;
  isMultiLineStringMesh = true;
  type = 'MultiLineStringMesh';
  userData = {};
  set opacity(opacity) {
    this.traverseLineStrings(ls => ls.opacity = opacity);
  }
  constructor(lineStrings) {
    super();
    this.matrixAutoUpdate = false;
    this.add(...lineStrings);
  }
  dispose() {
    this.traverseLineStrings(ls => ls.dispose());
    this.dispatchEvent({
      type: 'dispose'
    });
  }

  /**
   * Executes the callback on all the {@link LineStringMesh}es of this mesh.
   * @param callback - The callback to execute.
   */
  traverseLineStrings(callback) {
    this.traverse(obj => {
      if (isLineStringMesh(obj)) {
        callback(obj);
      }
    });
  }
}
export function isMultiLineStringMesh(obj) {
  return obj?.isMultiLineStringMesh ?? false;
}