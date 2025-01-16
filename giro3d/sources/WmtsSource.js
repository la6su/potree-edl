import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
import { GlobalCache } from '../core/Cache';
import { DefaultQueue } from '../core/RequestQueue';
import Fetcher from '../utils/Fetcher';
import TiledImageSource from './TiledImageSource';
async function getCapabilities(url) {
  const cached = GlobalCache.get(url);
  if (cached != null) {
    return cached;
  }
  const parser = new WMTSCapabilities();
  const res = await Fetcher.fetch(url);
  const text = await res.text();
  const capabilities = parser.read(text);
  GlobalCache.set(url, capabilities);
  return capabilities;
}

/**
 * A {@link TiledImageSource} backed by a single [WMTS](https://en.wikipedia.org/wiki/Web_Map_Tile_Service) layer.
 * Note: this is a convenient class that simplifies the usage of {@link TiledImageSource}.
 *
 * Currently, it is not possible to directly create a {@link WmtsSource} from its constructor. Use the
 * {@link fromCapabilities} static method to build a source from a WMTS capabilities document.
 * ```js
 * WmtsSource.fromCapabilities('http://example.com/wmts?SERVICE=WMTS&REQUEST=GetCapabilities', {
 *     layer: 'MyLayerName',
 * })
 * .then(wmtsSource => {
 *   // Do something with the source.
 * });
 * ```
 */
export default class WmtsSource extends TiledImageSource {
  // Note: constructor is private because currently the only way to build a WMTS layer
  // is from the capabilities.
  constructor(options) {
    super(options);
  }

  /**
   * Constructs a {@link WmtsSource} from a WMTS capabilities document.
   *
   * @param url - The URL to the WMTS capabilities document.
   * @param options - Source options.
   * @returns A promise that resolve with the created {@link WmtsSource}.
   * ```js
   * const url = 'http://example.com/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities';
   *
   * // Creates the source with layer 'MyLayer' in the 'PM' tile matrix set.
   * const wmtsSource = await WmtsSource.fromCapabilities(url, {
   *   layer: 'MyLayer',
   *   matrixSet: 'PM',
   *   imageFormat: 'image/png',
   * });
   * ```
   */
  static async fromCapabilities(url, options) {
    // We use the queue to deduplicate download to the same document.
    const capabilities = await DefaultQueue.enqueue({
      id: url,
      request: () => getCapabilities(url)
    });

    // Warning: optionsFromCapabilities() is very sensitive to properties being undefined,
    // so we must define an additional config object that does not contain undefined properties.
    const config = {
      layer: options.layer
    };
    if (options.matrixSet != null) {
      config.matrixSet = options.matrixSet;
    }
    if (options.imageFormat != null) {
      config.format = options.imageFormat;
      delete options.imageFormat;
    }
    const olOptions = optionsFromCapabilities(capabilities, config);
    if (!olOptions) {
      throw new Error('layer was not found');
    }
    return new WmtsSource({
      source: new WMTS(olOptions),
      ...options
    });
  }
}