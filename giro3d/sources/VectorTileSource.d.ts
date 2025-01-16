import OLVectorTileSourcce from 'ol/source/VectorTile.js';
import type { Style } from 'ol/style.js';
import type FeatureFormat from 'ol/format/Feature.js';
import type RenderFeature from 'ol/render/Feature';
import type { StyleFunction } from 'ol/style/Style';
import type Extent from '../core/geographic/Extent';
import type { GetImageOptions, ImageResponse, ImageSourceOptions } from './ImageSource';
import ImageSource from './ImageSource';
export interface VectorTileSourceOptions extends ImageSourceOptions {
    /**
     * The URL to the vector tile layer.
     */
    url: string;
    /**
     * The background color of the tiles.
     */
    backgroundColor?: string;
    /**
     * The format of the vector tile. Default is {@link MVT}.
     */
    format?: FeatureFormat<typeof RenderFeature>;
    /**
     * The style or style function.
     */
    style: Style | StyleFunction;
}
/**
 * A Vector Tile source. Uses OpenLayers [styles](https://openlayers.org/en/latest/apidoc/module-ol_style_Style-Style.html).
 *
 * @example
 * const apiKey = 'my api key';
 * const vectorTileSource = new VectorTileSource(\{
 *     url: `${'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token='}${apiKey}`,
 *     style: new Style(...), // Pass an OpenLayers style here
 *     backgroundColor: 'hsl(47, 26%, 88%)',
 * \});
 */
declare class VectorTileSource extends ImageSource {
    readonly isVectorTileSource: boolean;
    readonly type: "VectorTileSource";
    readonly source: OLVectorTileSourcce;
    readonly style: Style | StyleFunction;
    readonly backgroundColor: string | undefined;
    private _sourceProjection;
    private _extent;
    private readonly _tileGrid;
    private readonly _crs;
    private readonly _olUID;
    /**
     * @param options - Options.
     */
    constructor(options: VectorTileSourceOptions);
    getCrs(): string;
    getExtent(): Extent;
    /**
     * @param tile - The tile to render.
     * @returns The canvas.
     */
    private rasterize;
    private rasterizeTile;
    private createBuilderGroup;
    /**
     * @param tile - The tile to load.
     * @returns The promise containing the rasterized tile.
     */
    private loadTile;
    /**
     * Loads all tiles in the specified extent and zoom level.
     *
     * @param extent - The tile extent.
     * @param zoom - The zoom level.
     * @returns The image requests.
     */
    private loadTiles;
    getImages(options: GetImageOptions): Array<ImageResponse>;
}
export default VectorTileSource;
//# sourceMappingURL=VectorTileSource.d.ts.map