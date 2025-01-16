import { EventDispatcher, FloatType, LinearSRGBColorSpace, SRGBColorSpace, UnsignedByteType } from 'three';
class ImageResult {
  /**
   * @param options - options
   */
  constructor(options) {
    if (!options.id) {
      throw new Error('id cannot be null');
    }
    if (options.texture == null) {
      throw new Error('texture cannot be null');
    }
    if (options.extent == null) {
      throw new Error('extent cannot be null');
    }
    this.id = options.id;
    this.texture = options.texture;
    this.extent = options.extent;
    this.min = options.min;
    this.max = options.max;
  }
}
/**
 * Base class for all image sources. The `ImageSource` produces images to be consumed by clients,
 * such as map layers.
 */
class ImageSource extends EventDispatcher {
  isMemoryUsage = true;
  isImageSource = true;
  priority = 'auto';

  /**
   * Gets whether images generated from this source should be flipped vertically.
   */

  /**
   * Gets the datatype of images generated by this source.
   */

  /**
   * If `true`, this source can immediately generate images without any delay.
   */
  synchronous = false;

  /**
   * @param options - Options.
   */
  constructor(options = {}) {
    super();
    this.isImageSource = true;
    this.type = 'ImageSource';
    this.flipY = options.flipY ?? false;
    this.datatype = options.is8bit ?? true ? UnsignedByteType : FloatType;
    this._customColorSpace = options.colorSpace;
    this.priority = options.requestPriority ?? 'auto';
    this.containsFn = options.containsFn;
    this.synchronous = options?.synchronous ?? false;
  }
  getMemoryUsage() {
    // Implement this in derived classes to compute the memory usage of the source.
  }

  /**
   * Gets the color space of the textures generated by this source.
   */
  get colorSpace() {
    if (this._customColorSpace != null) {
      return this._customColorSpace;
    }

    // Assume that 8-bit images are in the sRGB color space.
    // Also note that the final decision related to color space is the
    // responsibility of the layer rather than the source.
    return this.datatype === UnsignedByteType ? SRGBColorSpace : LinearSRGBColorSpace;
  }

  /**
   * Returns an adjusted extent, width and height so that request pixels are aligned with source
   * pixels, and requests do not oversample the source.
   *
   * @param requestExtent - The request extent.
   * @param requestWidth - The width, in pixels, of the request extent.
   * @param requestHeight - The height, in pixels, of the request extent.
   * @param margin - The margin, in pixels, around the initial extent.
   * @returns The adjusted parameters.
   */

  adjustExtentAndPixelSize(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  margin = 0) {
    // Default implementation.
    return null;
  }

  /**
   * Returns the CRS of this source.
   *
   * @returns The CRS.
   */

  /**
   * Returns the extent of this source expressed in the CRS of the source.
   *
   * @returns The extent of the source.
   */

  /**
   * Raises an event to reload the source.
   */
  update(extent) {
    this.dispatchEvent({
      type: 'updated',
      extent
    });
  }

  /**
   * Gets whether this source contains the specified extent. If a custom contains function
   * is provided, it will be used. Otherwise,
   * {@link intersects} is used.
   *
   * This method is mainly used to discard non-relevant requests (i.e don't process regions
   * that are not relevant to this source).
   *
   * @param extent - The extent to test.
   */
  contains(extent) {
    const convertedExtent = extent.clone().as(this.getCrs());
    if (this.containsFn) {
      return this.containsFn(convertedExtent);
    }
    return this.intersects(convertedExtent);
  }

  /**
   * Test the intersection between the specified extent and this source's extent.
   * This method may be overriden to perform special logic.
   *
   * @param extent - The extent to test.
   * @returns `true` if the extent and this source extent intersects, `false` otherwise.
   */
  intersects(extent) {
    const thisExtent = this.getExtent();
    if (thisExtent != null) {
      return thisExtent.intersectsExtent(extent);
    }
    // We don't have an extent, so we default to true.
    return true;
  }

  /**
   * Initializes the source.
   *
   * @param options - Options.
   * @returns A promise that resolves when the source is initialized.
   */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialize() {
    return Promise.resolve();
  }

  /**
   * Gets the images for the specified extent and pixel size.
   *
   * @param options - The options.
   * @returns An array containing the functions to generate the images asynchronously.
   */

  /**
   * Disposes unmanaged resources of this source.
   */

  dispose() {
    // Implement this in derived classes to cleanup unmanaged resources,
    // such as cached objects.
  }
}
export default ImageSource;
export { ImageResult };