import type Extent from '../core/geographic/Extent';
import type ImageFormat from '../formats/ImageFormat';
import type { ImageSourceOptions } from './ImageSource';
import TiledImageSource from './TiledImageSource';
export interface WmtsSourceOptions extends ImageSourceOptions {
    /**
     * The optional no-data value.
     */
    noDataValue?: number;
    /**
     * The optional image decoder.
     */
    format?: ImageFormat;
    /**
     * The optional extent of the source. If not provided, it will be computed from the source.
     */
    extent?: Extent;
}
export interface WmtsFromCapabilitiesOptions extends WmtsSourceOptions {
    /** The name of the layer. */
    layer: string;
    /** The tile matrix set identifier. */
    matrixSet?: string;
    /**
     * The image format (i.e its MIME type, like `image/png`).
     * Note that it is different from the format decoder (that uses the `format` property)
     */
    imageFormat?: string;
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
    private constructor();
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
    static fromCapabilities(url: string, options: WmtsFromCapabilitiesOptions): Promise<WmtsSource>;
}
//# sourceMappingURL=WmtsSource.d.ts.map