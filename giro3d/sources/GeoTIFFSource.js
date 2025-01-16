import { FloatType, MathUtils, Texture, UnsignedByteType, Vector2 } from 'three';
import { BaseClient, BaseResponse, fromCustomClient, globals as geotiffGlobals, Pool } from 'geotiff';
import { GlobalCache } from '../core/Cache';
import Extent from '../core/geographic/Extent';
import Fetcher from '../utils/Fetcher';
import PromiseUtils from '../utils/PromiseUtils';
import TextureGenerator from '../utils/TextureGenerator';
import { nonNull } from '../utils/tsutils';
import ConcurrentDownloader from './ConcurrentDownloader';
import ImageSource, { ImageResult } from './ImageSource';
const tmpDim = new Vector2();
let sharedPool = undefined;

/**
 * How the samples in the GeoTIFF files (also
 * known as bands), are mapped to the color channels of an RGB(A) image.
 *
 * Must be an array of either 1, 3 or 4 elements. Each element is the index of a sample in the
 * source file. For example, to map the samples 0, 3, and 2 to the R, G, B colors, you can use
 * `[0, 3, 2]`.
 *
 * - 1 element means the resulting image will be a grayscale image
 * - 3 elements means the resulting image will be a RGB image
 * - 4 elements means the resulting image will be a RGB image with an alpha channel.
 *
 * Note: if the channels is `undefined`, then they will be selected automatically with the
 * following rules: if the image has 3 or more samples, the first 3 samples will be used,
 * (i.e `[0, 1, 2]`). Otherwise, only the first sample will be used (i.e `[0]`). In any case,
 * no transparency channel will be selected automatically, as there is no way to determine
 * if a specific sample represents transparency.
 *
 * ## Examples
 *
 * - I have a color image, but I only want to see the blue channel (sample = 1): `[1]`
 * - I have a grayscale image, with only 1 sample: `[0]`
 * - I have a grayscale image with a transparency channel at index 1: `[0, 0, 0, 1]`
 * - I have a color image without a transparency channel: `[0, 1, 2]`
 * - I have a color image with a transparency channel at index 3: `[0, 1, 2, 3]`
 * - I have a color image with transparency at index 3, but I only want to see the blue channel:
 * `[1, 1, 1, 3]`
 * - I have a color image but in the B, G, R order: `[2, 1, 0]`
 */

function getPool() {
  if (sharedPool == null && window.Worker != null) {
    sharedPool = new Pool();
  }
  return sharedPool;
}
/**
 * Determine if an image type is a mask.
 * See https://www.awaresystems.be/imaging/tiff/tifftags/newsubfiletype.html
 * Note: this function is taken from OpenLayers (GeoTIFF.js)
 * @param image - The image.
 * @returns `true` if the image is a mask.
 */
function isMask(image) {
  const FILETYPE_MASK = 4;
  const fileDirectory = image.fileDirectory;
  const type = fileDirectory.NewSubfileType ?? 0;
  return (type & FILETYPE_MASK) === FILETYPE_MASK;
}

/**
 * Determines if we can safely use the `readRGB()` method from geotiff.js for this image.
 */
function canReadRGB(image) {
  if (image.getSamplesPerPixel() !== 3) {
    return false;
  }
  if (image.getBitsPerSample() > 8) {
    return false;
  }
  const interpretation = image.fileDirectory.PhotometricInterpretation;
  const interpretations = geotiffGlobals.photometricInterpretations;
  return interpretation === interpretations.CMYK || interpretation === interpretations.YCbCr || interpretation === interpretations.CIELab || interpretation === interpretations.ICCLab;
}
export class FetcherResponse extends BaseResponse {
  /**
   * BaseResponse facade for fetch API Response
   *
   * @param response - The response.
   */
  constructor(response) {
    super();
    this.response = response;
  }

  // @ts-expect-error (the base class does not type this getter)
  get status() {
    return this.response.status;
  }
  getHeader(name) {
    return this.response.headers.get(name);
  }

  // @ts-expect-error (incorrectly typed base method, should be a Promise, but is an ArrayBuffer)
  async getData() {
    const data = await this.response.arrayBuffer();
    return data;
  }
}

/**
 * A custom geotiff.js client that uses the Fetcher in order
 * to centralize requests and benefit from the HTTP configuration module.
 */
class FetcherClient extends BaseClient {
  _downloader = new ConcurrentDownloader({
    fetch: Fetcher.fetch,
    retry: 3,
    timeout: 10000
  });
  constructor(url, options) {
    super(url);
    this._priority = options.priority;
  }

  // @ts-expect-error (untyped base method)
  async request({
    headers,
    credentials,
    signal
  } = {}) {
    const response = await this._downloader.fetch(this.url, {
      headers,
      credentials,
      signal,
      priority: this._priority
    });
    return new FetcherResponse(response);
  }
}

/**
 * A level in the GeoTIFF pyramid.
 */

function selectDataType(format, bitsPerSample) {
  switch (format) {
    case 1:
      // unsigned integer data
      if (bitsPerSample <= 8) {
        return UnsignedByteType;
      }
      break;
    default:
      break;
  }
  return FloatType;
}
/**
 * Provides data from a remote GeoTIFF file.
 *
 * Features:
 * - supports tiled and untiled TIFF images
 * - supports [Cloud Optimized GeoTIFF (COG)](https://www.cogeo.org/),
 * - supports various compression (LZW, DEFLATE, JPEG...)
 * - supports RGB and YCbCr color spaces
 * - supports grayscale (e.g elevation data) and color images,
 * - support high-dynamic range colors (8-bit, 16-bit and 32-bit floating point pixels),
 * - dynamic channel mapping,
 *
 * Note: performance might be degraded if the GeoTIFF is not optimized for streaming. We recommend
 * using [Cloud Optimized GeoTIFFs (COGs)](https://www.cogeo.org/) for best performance.
 */
class GeoTIFFSource extends ImageSource {
  isGeoTIFFSource = true;
  type = 'GeoTIFFSource';
  _cacheId = MathUtils.generateUUID();
  _cache = GlobalCache;
  _channels = [0, 1, 2];

  // Fields available after initialization

  _initialized = false;
  /**
   * Creates a {@link GeoTIFFSource} source.
   *
   * @param options - options
   */
  constructor(options) {
    super({
      ...options,
      flipY: options.flipY ?? true
    });
    this.url = options.url;
    this.crs = options.crs;
    this._enableWorkers = options.enableWorkers ?? true;
    this._pool = this._enableWorkers ? getPool() : undefined;
    this._imageCount = 0;
    this._images = [];
    this._masks = [];
    this._channels = options.channels ?? this._channels;
    this._cacheOptions = options.cacheOptions;
  }
  getInternalCache() {
    if (!this._tiffImage) {
      return undefined;
    }
    const source = this._tiffImage.source;
    return source.blockCache;
  }
  getMemoryUsage(context) {
    if (!this._tiffImage) {
      return;
    }
    const cache = this.getInternalCache();
    if (cache) {
      let bytes = 0;
      cache.forEach(block => {
        bytes += block.data.byteLength;
      });
      context.objects.set(`${this.type}-${this._cacheId}`, {
        cpuMemory: bytes,
        gpuMemory: 0
      });
    }
  }
  getExtent() {
    return nonNull(this._extent);
  }
  getCrs() {
    return this.crs;
  }

  /**
   * Attemps to compute the exact extent of the TIFF image.
   *
   * @param crs - The CRS.
   * @param tiffImage - The TIFF image.
   */
  static computeExtent(crs, tiffImage) {
    const [minx, miny, maxx, maxy] = tiffImage.getBoundingBox();
    const extent = new Extent(crs, minx, maxx, miny, maxy);
    return extent;
  }

  /**
   * @param requestExtent - The request extent.
   * @param requestWidth - The width, in pixels, of the request extent.
   * @param requestHeight - The height, in pixels, of the request extent.
   * @param margin - The margin, in pixels.
   * @returns The adjusted parameters.
   */
  adjustExtentAndPixelSize(requestExtent, requestWidth, requestHeight, margin = 0) {
    const {
      image
    } = this.selectLevel(requestExtent, requestWidth, requestHeight);
    const dims = nonNull(this._dimensions);
    const pixelWidth = dims.x / image.width;
    const pixelHeight = dims.y / image.height;
    const marginExtent = requestExtent.withMargin(pixelWidth * margin, pixelHeight * margin);
    const adjustedWidth = Math.floor(marginExtent.dimensions(tmpDim).x / pixelWidth);
    const adjustedHeight = Math.floor(marginExtent.dimensions(tmpDim).y / pixelHeight);
    let width = requestWidth;
    let height = requestHeight;

    // Ensure that we are not returning texture sizes that are too big, which can
    // happen when the source is much smaller than the map that hosts it.
    const threshold = 100; // pixels

    if (adjustedWidth < requestWidth + threshold && adjustedHeight < requestHeight + threshold) {
      width = adjustedWidth;
      height = adjustedHeight;
    }
    return {
      extent: marginExtent,
      width,
      height
    };
  }
  initialize() {
    if (!this._initializePromise) {
      this._initializePromise = this.initializeOnce();
    }
    return this._initializePromise;
  }
  async initializeOnce() {
    if (this._initialized) {
      return;
    }
    const opts = {
      cacheSize: this._cacheOptions?.cacheSize,
      blockSize: this._cacheOptions?.blockSize
    };
    const url = this.url;
    const client = new FetcherClient(url, {
      priority: this.priority
    });
    // We are using a custom client to ensure that outgoing requests are done through
    // the Fetcher so we can benefit from automatic HTTP configuration and control over
    // outgoing requests.
    // @ts-expect-error (typing issue with geotiff.js)
    this._tiffImage = await fromCustomClient(client, opts);

    // Get original image header
    const firstImage = await this._tiffImage.getImage();
    this._extent = GeoTIFFSource.computeExtent(this.crs, firstImage);
    this._dimensions = this._extent.dimensions();
    this._origin = firstImage.getOrigin();
    // Samples are equivalent to GDAL's bands
    this._sampleCount = firstImage.getSamplesPerPixel();

    // Automatic selection of channels, if the user did not specify a mapping.
    if (this._sampleCount < this._channels.length) {
      this._channels = [0];
    }
    this._nodata = firstImage.getGDALNoData();
    const format = firstImage.getSampleFormat();
    const bps = firstImage.getBitsPerSample();
    this.datatype = selectDataType(format, bps);
    function makeLevel(image, resolution) {
      return {
        image,
        width: image.getWidth(),
        height: image.getHeight(),
        resolution
      };
    }
    this._images.push(makeLevel(firstImage, firstImage.getResolution()));
    const rawImageCount = await this._tiffImage.getImageCount();
    let nonMaskImageCount = 0;

    // We want to preserve the order of the overviews so we await them inside
    // the loop not to have the smallest overviews coming before the biggest

    for (let i = 1; i < rawImageCount; i++) {
      const image = await this._tiffImage.getImage(i);
      const level = makeLevel(image, image.getResolution(firstImage));
      if (isMask(image)) {
        this._masks.push(level);
      } else {
        nonMaskImageCount++;
        this._images.push(level);
      }
    }

    // Number of images (original + overviews)
    this._imageCount = nonMaskImageCount;
    this._initialized = true;
  }

  /**
   * Returns a window in the image's coordinates that matches the requested extent.
   *
   * @param extent - The window extent.
   * @param resolution - The spatial resolution of the window.
   * @returns The window.
   */
  makeWindowFromExtent(extent, resolution) {
    const [oX, oY] = nonNull(this._origin);
    const [imageResX, imageResY] = resolution;
    const ext = extent.values;
    const wnd = [Math.round((ext[0] - oX) / imageResX), Math.round((ext[2] - oY) / imageResY), Math.round((ext[1] - oX) / imageResX), Math.round((ext[3] - oY) / imageResY)];
    const xmin = Math.min(wnd[0], wnd[2]);
    let xmax = Math.max(wnd[0], wnd[2]);
    const ymin = Math.min(wnd[1], wnd[3]);
    let ymax = Math.max(wnd[1], wnd[3]);

    // prevent zero-sized requests
    if (Math.abs(xmax - xmin) === 0) {
      xmax += 1;
    }
    if (Math.abs(ymax - ymin) === 0) {
      ymax += 1;
    }
    return [xmin, ymin, xmax, ymax];
  }

  /**
   * Creates a texture from the pixel buffer(s).
   *
   * @param buffers - The buffers (one buffer per band)
   * @returns The generated texture.
   */
  async createTexture(buffers) {
    // Width and height in pixels of the returned data.
    // The geotiff.js patches the arrays with the width and height properties.
    const {
      width,
      height
    } = buffers;
    const dataType = this.datatype;
    const {
      texture,
      min,
      max
    } = await TextureGenerator.createDataTextureAsync({
      width,
      height,
      nodata: this._nodata ?? undefined,
      enableWorkers: this._enableWorkers
    }, dataType, ...buffers);
    return {
      texture,
      min,
      max
    };
  }

  /**
   * Select the best overview level (or the final image) to match the
   * requested extent and pixel width and height.
   *
   * @param requestExtent - The window extent.
   * @param requestWidth - The pixel width of the window.
   * @param requestHeight - The pixel height of the window.
   * @returns The selected zoom level.
   */
  selectLevel(requestExtent, requestWidth, requestHeight) {
    // Number of images  = original + overviews if any
    const imageCount = this._imageCount;
    const cropped = requestExtent.clone().intersect(nonNull(this._extent));
    // Dimensions of the requested extent
    const extentDimension = cropped.dimensions(tmpDim);
    const targetResolution = Math.min(extentDimension.x / requestWidth, extentDimension.y / requestHeight);
    let image = this._images[imageCount - 1];
    let mask = this._masks[imageCount - 1];

    // Select the image with the best resolution for our needs
    for (let i = imageCount - 1; i >= 0; i--) {
      image = this._images[i];
      mask = this._masks[i];
      const dims = nonNull(this._dimensions);
      const sourceResolution = Math.min(dims.x / image.width, dims.y / image.height);
      if (targetResolution >= sourceResolution) {
        break;
      }
    }
    return {
      image,
      mask
    };
  }

  /**
   * Gets or sets the channel mapping.
   */
  get channels() {
    return this._channels;
  }
  set channels(value) {
    if (value == null) {
      throw new Error('expected non-null value');
    }
    const length = value.length;
    if (!(length === 1 || length === 3 || length === 4)) {
      throw new Error(`channels must be either a 1, 3 or 4 element array, got: ${length}`);
    }
    this._channels = value;
    this.update();
  }
  async loadImage(opts) {
    const {
      extent,
      width,
      height,
      id,
      signal
    } = opts;
    const {
      image,
      mask
    } = this.selectLevel(extent, width, height);
    const adjusted = extent.fitToGrid(nonNull(this._extent), image.width, image.height, 8, 8);
    const actualExtent = adjusted.extent;
    const buffers = await this.getRegionBuffers(actualExtent, image, this._channels, signal, id);
    signal?.throwIfAborted();
    let texture;
    let min = undefined;
    let max = undefined;
    if (buffers == null) {
      texture = new Texture();
    } else {
      if (mask != null && buffers.length === 3) {
        const alpha = await this.processTransparencyMask(mask, actualExtent, signal, id);
        if (alpha) {
          buffers.push(alpha);
        }
      }
      const result = await this.createTexture(buffers);
      texture = result.texture;
      min = result.min;
      max = result.max;
    }
    const result = {
      extent: actualExtent,
      texture,
      id,
      min,
      max
    };
    return new ImageResult(result);
  }
  async processTransparencyMask(mask, extent, signal, id) {
    const bufs = await this.getRegionBuffers(extent, mask, [0], signal, id);
    if (!bufs) {
      return null;
    }
    const alpha = bufs[0];
    const is1bit = mask.image.getBitsPerSample() === 1;

    // Peform 8-bit expansion
    if (is1bit) {
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = alpha[i] * 255;
      }
    }
    return alpha;
  }
  async readWindow(image, window, channels, signal) {
    if (canReadRGB(image)) {
      return await image.readRGB({
        pool: this._pool,
        window,
        signal,
        interleave: false
      });
    }

    // TODO possible optimization: instead of letting geotiff.js crop and resample
    // the tiles into the desired region, we could use image.getTileOrStrip() to
    // read individual tiles (aka blocks) and make a texture per block. This way,
    // there would not be multiple concurrent reads for the same block, and we would not
    // waste time resampling the blocks since resampling is already done in the composer.
    // We would create more textures, but it could be worth it.
    const buf = await image.readRasters({
      pool: this._pool,
      fillValue: this._nodata ?? undefined,
      samples: channels,
      window,
      signal
    });
    return buf;
  }

  /**
   * @param image - The image to read.
   * @param window - The image region to read.
   * @param signal - The abort signal.
   * @returns The buffers.
   */
  async fetchBuffer(image, window, channels, signal) {
    signal?.throwIfAborted();
    try {
      return await this.readWindow(image, window, channels, signal);
    } catch (e) {
      if (e instanceof Error) {
        if (e.toString() === 'AggregateError: Request failed') {
          // Problem with the source that is blocked by another fetch
          // (request failed in readRasters). See the conversations in
          // https://github.com/geotiffjs/geotiff.js/issues/218
          // https://github.com/geotiffjs/geotiff.js/issues/221
          // https://github.com/geotiffjs/geotiff.js/pull/224
          // Retry until it is not blocked.
          // TODO retry counter
          await PromiseUtils.delay(100);
          return this.fetchBuffer(image, window, channels, signal);
        }
        if (e.name !== 'AbortError') {
          console.error(e);
        }
      } else {
        console.error(e);
      }
      return null;
    }
  }

  /**
   * Extract a region from the specified image.
   *
   * @param extent - The request extent.
   * @param imageInfo - The image to sample.
   * @param signal - The abort signal.
   * @param id - The request id.
   * @returns The buffer(s).
   */
  async getRegionBuffers(extent, imageInfo, channels, signal, id) {
    const window = this.makeWindowFromExtent(extent, imageInfo.resolution);
    const cacheKey = `${this._cacheId}-${id}-${channels.join(',')}`;
    const cached = this._cache.get(cacheKey);
    if (cached != null) {
      return cached;
    }
    const buf = await this.fetchBuffer(imageInfo.image, window, channels, signal);
    if (buf == null) {
      return null;
    }
    let result;
    let size = 0;
    if (Array.isArray(buf)) {
      size = buf.map(b => b.byteLength).reduce((a, b) => a + b);
      result = buf;
    } else {
      size = buf.byteLength;
      result = [buf];
    }
    this._cache.set(cacheKey, result, {
      size
    });
    return result;
  }
  getImages(options) {
    const {
      signal,
      id
    } = options;
    signal?.throwIfAborted();
    const opts = {
      ...options,
      id
    };
    const request = () => this.loadImage(opts);
    return [{
      id,
      request
    }];
  }
  dispose() {
    this.getInternalCache()?.clear();
  }
}
export default GeoTIFFSource;