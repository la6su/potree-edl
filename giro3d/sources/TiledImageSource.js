import { TileRange } from 'ol';
import { UnsignedByteType, Vector2 } from 'three';
import EmptyTexture from '../renderer/EmptyTexture';
import MemoryTracker from '../renderer/MemoryTracker';
import { HttpError } from '../utils/Fetcher';
import OpenLayersUtils from '../utils/OpenLayersUtils';
import PromiseUtils from '../utils/PromiseUtils';
import TextureGenerator from '../utils/TextureGenerator';
import { nonNull } from '../utils/tsutils';
import ConcurrentDownloader from './ConcurrentDownloader';
import ImageSource, { ImageResult } from './ImageSource';
const MIN_LEVEL_THRESHOLD = 2;
const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;
const tmp = {
  dims: new Vector2(),
  tileRange: new TileRange(0, 0, 0, 0)
};
/**
 * An image source powered by OpenLayers to load tiled images.
 * Supports all subclasses of the OpenLayers [TileSource](https://openlayers.org/en/latest/apidoc/module-ol_source_Tile-TileSource.html).
 *
 * If the tiles of the source are in a format that is not supported directly by the browser,
 * i.e not JPG/PNG/WebP, then you must pass a decoder with the `format` constructor option.
 *
 * To filter out no-data pixels, you may pass the `noDataValue` option in the constructor.
 *
 * @example
 *
 * // To create a source based on the Stamen OpenLayers source, with the 'toner' style.
 * const source = new TiledImageSource(\{
 *      source: new Stamen(\{ layer: 'toner' \})
 * \});
 *
 * // To create a WMS source that downloads TIFF images, eliminating all pixels that have the
 * // value -9999 and replacing them with transparent pixels.
 * const source = new TiledImageSource(\{
 *      source: new TileWMS(\{
 *          url: 'http://example.com/wms',
 *          params: \{
 *              LAYERS: 'theLayer',
 *              FORMAT: 'image/tiff',
 *          \},
 *          projection: 'EPSG:3946',
 *          crossOrigin: 'anonymous',
 *          version: '1.3.0',
 *      \}),
 *      format: new GeoTIFFFormat(),
 *      noDataValue: -9999,
 * \});
 */
export default class TiledImageSource extends ImageSource {
  isTiledImageSource = true;
  type = 'TiledImageSource';
  /** @internal */
  info = {
    requestedTiles: 0,
    loadedTiles: 0
  };

  /**
   * @param options - The options.
   */
  constructor(options) {
    super({
      ...options,
      flipY: options.flipY ?? options.format?.flipY ?? false,
      is8bit: options.is8bit ?? (options.format?.dataType ?? UnsignedByteType) === UnsignedByteType
    });
    this.source = options.source;
    this.format = options.format;
    this._enableWorkers = options.enableWorkers ?? true;
    this._downloader = new ConcurrentDownloader({
      retry: options.retries ?? DEFAULT_RETRIES,
      timeout: options.httpTimeout ?? DEFAULT_TIMEOUT
    });
    const projection = nonNull(this.source.getProjection(), 'could not get projection from source');
    this.olprojection = projection;
    const tileGrid = this.source.getTileGridForProjection(projection);
    // Cache the tilegrid because it is constant
    this._tileGrid = tileGrid;
    this._getTileUrl = this.source.getTileUrlFunction();
    this.noDataValue = options.noDataValue;
    this._sourceExtent = options.extent ?? OpenLayersUtils.fromOLExtent(tileGrid.getExtent(), projection.getCode());
  }
  getExtent() {
    return this._sourceExtent;
  }
  getCrs() {
    return this.olprojection.getCode();
  }
  adjustExtentAndPixelSize(requestExtent, requestWidth, requestHeight, margin = 0) {
    const zoom = this.getZoomLevel(requestExtent, requestWidth, requestHeight) ?? this._tileGrid.getMinZoom();
    const resolution = this._tileGrid.getResolution(zoom);
    const pixelWidth = resolution;
    const pixelHeight = resolution;
    const marginExtent = requestExtent.withMargin(pixelWidth * margin, pixelHeight * margin).intersect(this._sourceExtent);
    const dimensions = marginExtent.dimensions(tmp.dims);
    const width = Math.round(dimensions.x / pixelWidth);
    const height = Math.round(dimensions.y / pixelHeight);
    return {
      extent: marginExtent,
      width,
      height
    };
  }

  /**
   * Selects the best zoom level given the provided image size and extent.
   *
   * @param extent - The target extent.
   * @param width - The width in pixels of the target texture.
   * @param height - The height in pixels of the target texture.
   * @returns The ideal zoom level for this particular extent.
   */
  getZoomLevel(extent, width, height) {
    const minZoom = this._tileGrid.getMinZoom();
    const maxZoom = this._tileGrid.getMaxZoom();
    function round1000000(n) {
      return Math.round(n * 1000000) / 1000000;
    }
    const dims = extent.dimensions(tmp.dims);
    const resX = dims.x / width;
    const resY = dims.y / height;
    const targetResolution = round1000000(Math.min(resX, resY));
    const minResolution = this._tileGrid.getResolution(minZoom);
    if (targetResolution / minResolution > MIN_LEVEL_THRESHOLD) {
      // The minimum zoom level has more than twice the resolution
      // than requested. We cannot use this zoom level as it would
      // trigger too many tile requests to fill the extent.
      return null;
    }
    if (minZoom === maxZoom) {
      return minZoom;
    }
    if (targetResolution > minResolution) {
      return minZoom;
    }

    // Let's determine the best zoom level for the target tile.
    let distance = +Infinity;
    let result = minZoom;
    for (let z = minZoom; z <= maxZoom; z++) {
      const sourceResolution = round1000000(this._tileGrid.getResolution(z));
      const thisDistance = Math.abs(sourceResolution - targetResolution);
      if (thisDistance < distance) {
        distance = thisDistance;
        result = z;
      }
    }
    return result;
  }
  getImages(options) {
    const {
      extent,
      width,
      height,
      signal
    } = options;
    signal?.throwIfAborted();
    if (extent.crs !== this.getCrs()) {
      throw new Error('invalid CRS');
    }
    const zoomLevel = this.getZoomLevel(extent, width, height);
    if (zoomLevel == null) {
      return [];
    }
    const tileRange = this._tileGrid.getTileRangeForExtentAndZ(OpenLayersUtils.toOLExtent(extent), zoomLevel);
    const images = this.loadTiles(tileRange, this.getCrs(), zoomLevel, options.createReadableTextures, signal);
    return images;
  }
  async fetchData(url, signal) {
    try {
      const response = await this._downloader.fetch(url, {
        signal,
        priority: this.priority
      });

      // If the response is 204 No Content for example, we have nothing to do.
      // This happens when a tile request is valid, but points to a region with no data.
      // Note: we let the HTTP handler do the logging for us in case of 4XX errors.
      if (response.status !== 200) {
        return null;
      }
      const blob = await response.blob();
      return blob;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw e;
      } else if (!(e instanceof HttpError)) {
        console.error(e);
      } // Do nothing as Fetcher already dispatches events when HTTP errors occur.
      return null;
    }
  }

  /**
   * Loads the tile once and returns a reusable promise containing the tile texture.
   *
   * @param id - The id of the tile.
   * @param url - The URL of the tile.
   * @param extent - The extent of the tile.
   * @param createDataTexture - Create readable textures.
   * @returns The tile texture, or null if there is no data.
   */
  async loadTile(id, url, extent, createDataTexture, signal) {
    this.info.requestedTiles++;
    if (signal != null) {
      // Let's wait a "frame" to check if the request is really necessary
      // This will potentially avoid a lot of unnecessary requests.
      await PromiseUtils.delay(25);
      signal.throwIfAborted();
    }
    const blob = await this.fetchData(url, signal);
    if (!blob) {
      return new ImageResult({
        texture: new EmptyTexture(),
        extent,
        id
      });
    }
    let texture;
    let min;
    let max;
    if (this.format) {
      const tileSize = this._tileGrid.getTileSize(0);
      const decoded = await this.format.decode(blob, {
        noDataValue: this.noDataValue,
        width: tileSize,
        height: tileSize
      });
      texture = decoded.texture;
      min = decoded.min;
      max = decoded.max;
    } else {
      texture = await TextureGenerator.decodeBlob(blob, {
        createDataTexture,
        flipY: true,
        enableWorkers: this._enableWorkers
      });
      texture.flipY = false;
    }
    texture.generateMipmaps = false;
    texture.name = 'TiledImageSource - tile';
    MemoryTracker.track(texture, texture.name);
    this.info.loadedTiles++;
    return new ImageResult({
      texture,
      extent,
      id,
      min,
      max
    });
  }

  /**
   * Check if the tile actually intersect with the extent.
   *
   * @param extent - The extent to test.
   * @returns `true` if the tile must be processed, `false` otherwise.
   */
  shouldLoad(extent) {
    // Use the custom contain function if applicable
    if (this.containsFn) {
      return this.containsFn(extent);
    }
    const convertedExtent = extent.clone().as(this.getCrs());
    return convertedExtent.intersectsExtent(this._sourceExtent);
  }

  /**
   * Loads all tiles in the specified tile range.
   *
   * @param tileRange - The tile range.
   * @param crs - The CRS of the extent.
   * @param zoom - The zoom level.
   * @param createDataTexture - Creates readable textures.
   */
  loadTiles(tileRange, crs, zoom, createDataTexture, signal) {
    const source = this.source;
    const tileGrid = this._tileGrid;
    const fullTileRange = tileGrid.getFullTileRange(zoom);
    if (fullTileRange == null) {
      return [];
    }
    const promises = [];
    for (let i = tileRange.minX; i <= tileRange.maxX; i++) {
      for (let j = tileRange.minY; j <= tileRange.maxY; j++) {
        if (!fullTileRange.containsXY(i, j)) {
          continue;
        }
        const tile = source.getTile(zoom, i, j, 1, this.olprojection);
        const coord = tile.tileCoord;
        const olExtent = tileGrid.getTileCoordExtent(coord);
        const tileExtent = OpenLayersUtils.fromOLExtent(olExtent, crs);
        const id = `${coord[0]}-${coord[1]}-${coord[2]}`;

        // Don't bother loading tiles that are not in the layer
        if (this.shouldLoad(tileExtent)) {
          const url = this._getTileUrl(coord, 1, this.olprojection);
          if (url != null) {
            const request = () => this.loadTile(id, url, tileExtent, createDataTexture, signal);
            promises.push({
              id,
              request
            });
          }
        }
      }
    }
    return promises;
  }
}