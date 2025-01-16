import Helpers from '../helpers/Helpers';
import EntityInspector from './EntityInspector';
function hasMaterial(obj) {
  if (obj == null) {
    return false;
  }
  if (obj.material != null) {
    return true;
  }
  return false;
}
function applyToMaterial(root, entity, callback) {
  root.traverse(object => {
    if (hasMaterial(object) && object.userData.parentEntity === entity) {
      callback(object.material);
    }
  });
}
class FeatureCollectionInspector extends EntityInspector {
  /** Toggle the wireframe rendering of the features. */

  /** Toggle the frozen property of the features. */

  /** Store the CRS code of this.featureCollection */

  /**
   * Creates an instance of FeatureCollectionInspector.
   *
   * @param parentGui - The parent GUI.
   * @param instance - The Giro3D instance.
   * @param featureCollection - The inspected Features.
   */
  constructor(parentGui, instance, featureCollection) {
    super(parentGui, instance, featureCollection, {
      visibility: true,
      boundingBoxColor: true,
      boundingBoxes: true,
      opacity: true
    });
    this.wireframe = false;
    this.frozen = this.entity.frozen ?? false;
    this.dataProjection = this.entity.dataProjection ?? '';
    this.showGrid = false;
    this.addController(this, 'dataProjection').name('Data projection');
    this.addController(this, 'wireframe').name('Wireframe').onChange(v => this.toggleWireframe(v));
    this.addController(this.entity, 'materialCount').name('Materials');
  }

  /**
   * @param tile - The tile to decorate.
   * @param add - If true, bounding box is added, otherwise it is removed.
   * @param color - The bounding box color.
   */

  addOrRemoveBoundingBox(tile, add, color) {
    if (add && 'boundingBox' in tile && tile.visible) {
      Helpers.addBoundingBox(tile, color);
    } else {
      Helpers.removeBoundingBox(tile);
    }
  }
  toggleWireframe(value) {
    applyToMaterial(this.rootObject, this.entity, material => {
      if ('wireframe' in material) {
        material.wireframe = value;
      }
    });
    this.notify(this.entity);
  }
}
export default FeatureCollectionInspector;