import type Projection from 'ol/proj/Projection';
import type UrlTile from 'ol/source/UrlTile';
import type Extent from '../core/geographic/Extent';
import type ImageFormat from '../formats/ImageFormat';
import ImageSource, { ImageResult, type GetImageOptions, type ImageSourceOptions } from './ImageSource';
export interface TiledImageSourceOptions extends ImageSourceOptions {
    /**
     * The underlying OpenLayers source.
     */
    source: UrlTile;
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
    /**
     * The optional HTTP request timeout, in milliseconds.
     *
     * @defaultValue 5000
     */
    httpTimeout?: number;
    /**
     * How many retries to execute when an HTTP request ends up in error.
     * @defaultValue 3
     */
    retries?: number;
    /**
     * Enable web workers.
     * @defaultValue true
     */
    enableWorkers?: boolean;
}
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
    readonly isTiledImageSource: true;
    readonly type: "TiledImageSource";
    readonly source: UrlTile;
    readonly format: ImageFormat | undefined;
    readonly olprojection: Projection;
    readonly noDataValue: number | undefined;
    private readonly _tileGrid;
    private readonly _getTileUrl;
    private readonly _sourceExtent;
    private readonly _downloader;
    private readonly _enableWorkers;
    /** @internal */
    readonly info: {
        requestedTiles: number;
        loadedTiles: number;
    };
    /**
     * @param options - The options.
     */
    constructor(options: TiledImageSourceOptions);
    getExtent(): Extent;
    getCrs(): string;
    adjustExtentAndPixelSize(requestExtent: Extent, requestWidth: number, requestHeight: number, margin?: number): {
        extent: Extent;
        width: number;
        height: number;
    };
    /**
     * Selects the best zoom level given the provided image size and extent.
     *
     * @param extent - The target extent.
     * @param width - The width in pixels of the target texture.
     * @param height - The height in pixels of the target texture.
     * @returns The ideal zoom level for this particular extent.
     */
    private getZoomLevel;
    getImages(options: GetImageOptions): {
        id: string;
        request: () => Promise<ImageResult>;
    }[];
    private fetchData;
    /**
     * Loads the tile once and returns a reusable promise containing the tile texture.
     *
     * @param id - The id of the tile.
     * @param url - The URL of the tile.
     * @param extent - The extent of the tile.
     * @param createDataTexture - Create readable textures.
     * @returns The tile texture, or null if there is no data.
     */
    private loadTile;
    /**
     * Check if the tile actually intersect with the extent.
     *
     * @param extent - The extent to test.
     * @returns `true` if the tile must be processed, `false` otherwise.
     */
    private shouldLoad;
    /**
     * Loads all tiles in the specified tile range.
     *
     * @param tileRange - The tile range.
     * @param crs - The CRS of the extent.
     * @param zoom - The zoom level.
     * @param createDataTexture - Creates readable textures.
     */
    private loadTiles;
}
//# sourceMappingURL=TiledImageSource.d.ts.map