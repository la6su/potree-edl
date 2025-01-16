import Extent from '../core/geographic/Extent';
import ImageSource from './ImageSource';

/**
 * An image source that produces nothing. Mainly for debugging/testing purposes.
 */
class NullSource extends ImageSource {
  isNullSource = true;
  type = 'NullSource';
  constructor(options = {}) {
    super();
    this._extent = options?.extent ?? new Extent('EPSG:3857', 0, 10, 0, 10);
  }
  getCrs() {
    return this._extent.crs;
  }
  getImages() {
    return [];
  }
  getExtent() {
    return this._extent;
  }
}
export default NullSource;