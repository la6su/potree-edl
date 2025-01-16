/**
 * The source to feed a `Tiles3D` entity.
 */
class Tiles3DSource {
  isTiles3DSource = true;
  type = 'Tiles3DSource';
  /**
   * @param url - The URL to the root tileset.
   * @param networkOptions - the network options.
   */
  constructor(url, networkOptions) {
    this.url = url;
    this.networkOptions = networkOptions;
  }
}
export default Tiles3DSource;