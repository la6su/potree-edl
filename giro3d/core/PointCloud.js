import { Points } from 'three';
import MaterialUtils from '../renderer/MaterialUtils';
import PointCloudMaterial from '../renderer/PointCloudMaterial';
import { nonNull } from '../utils/tsutils';

/** Options for constructing {@link PointCloud} */

function setupMaterial(material, geometry) {
  material.enableClassification = geometry.hasAttribute('classification');
  if (geometry.hasAttribute('intensity')) {
    const intensityType = MaterialUtils.getVertexAttributeType(geometry.getAttribute('intensity'));
    MaterialUtils.setDefine(material, 'INTENSITY', true);
    MaterialUtils.setDefineValue(material, 'INTENSITY_TYPE', intensityType);
  } else {
    MaterialUtils.setDefine(material, 'INTENSITY', false);
  }
}

/**
 * A point cloud object with geospatial properties.
 *
 */
class PointCloud extends Points {
  isPointCloud = true;
  type = 'PointCloud';
  static isPointCloud(obj) {
    return obj?.isPointCloud;
  }
  get level() {
    if (PointCloud.isPointCloud(this.parent)) {
      return this.parent.level + 1;
    } else {
      return 0;
    }
  }
  constructor(opts) {
    super(opts.geometry, opts.material);
    this.extent = opts.extent ?? undefined;
    this.textureSize = opts.textureSize;
    this.disposed = false;
    this.setupMaterial();
  }
  setupMaterial() {
    if (PointCloudMaterial.isPointCloudMaterial(this.material)) {
      setupMaterial(this.material, this.geometry);
    }
  }
  getPointValue(pointIndex, attribute) {
    if (this.geometry.hasAttribute(attribute)) {
      const buffer = this.geometry.getAttribute(attribute).array;
      return buffer[pointIndex];
    }
    return undefined;
  }

  /**
   * Returns the intensity of the specified point.
   *
   * @param pointIndex - The index of the point.
   * @returns The intensity value for the specified point, or `undefined` if this point cloud does not support intensities.
   */
  getIntensity(pointIndex) {
    return this.getPointValue(pointIndex, 'intensity');
  }

  /**
   * Returns the classification number of the specified point.
   *
   * @param pointIndex - The index of the point.
   * @returns The classification number for the specified point, or `undefined` if this point cloud does not support classifications.
   */
  getClassification(pointIndex) {
    return this.getPointValue(pointIndex, 'classification');
  }
  canProcessColorLayer() {
    return true;
  }
  getExtent() {
    return nonNull(this.extent);
  }
  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    // @ts-expect-error Points does not transmit proper event map to parent
    this.dispatchEvent({
      type: 'dispose'
    });
    this.geometry.dispose();
    this.material.dispose();
  }
}
export default PointCloud;