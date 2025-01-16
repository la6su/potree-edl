import { CanvasTexture, MathUtils, Texture } from 'three';
import EmptyTexture from '../renderer/EmptyTexture';
import Fetcher from '../utils/Fetcher';
import ImageSource, { ImageResult } from './ImageSource';

/**
 * Options for the {@link StaticImageSource} constructor.
 */

/**
 * An {@link ImageSource} that displays a single, static image.
 *
 * The image must be either a PNG, JPG or WebP file.
 */
export default class StaticImageSource extends ImageSource {
  isStaticImageSource = true;
  type = 'StaticImageSource';
  _id = MathUtils.generateUUID();
  /**
   * Create a {@link StaticImageSource}.
   * @param options - The options.
   */
  constructor(options) {
    super({
      colorSpace: 'srgb',
      flipY: typeof options.source === 'string' ? false : options.flipY ?? true,
      is8bit: true
    });
    if (options.source == null) {
      throw new Error('invalid source');
    }
    if (options.extent == null) {
      throw new Error('invalid extent');
    }
    this._extent = options.extent;
    this._source = options.source;
  }
  getExtent() {
    return this._extent;
  }
  getCrs() {
    return this._extent.crs;
  }
  async fetchTexture(url) {
    // We directly flip the texture during decoding, which is why we don't need to flip it in the layer itself.
    return Fetcher.texture(url, {
      flipY: true,
      priority: this.priority
    }).then(texture => {
      this.dispatchEvent({
        type: 'loaded'
      });
      return texture;
    }).catch(error => {
      console.error(error);
      this.dispatchEvent({
        type: 'error',
        error
      });
      return new EmptyTexture();
    });
  }
  async loadImageOnce() {
    let texture;
    if (typeof this._source === 'string') {
      texture = await this.fetchTexture(this._source);
    } else if (this._source instanceof HTMLCanvasElement) {
      texture = new CanvasTexture(this._source);
    } else if (this._source instanceof HTMLImageElement) {
      texture = new Texture(this._source);
    } else {
      texture = this._source;
    }
    return new ImageResult({
      id: this._id,
      texture,
      extent: this._extent
    });
  }
  async loadImage() {
    if (this._promise == null) {
      this._promise = this.loadImageOnce();
    }
    return this._promise;
  }
  getImages() {
    const response = {
      id: this._id,
      request: this.loadImage.bind(this)
    };
    return [response];
  }
}