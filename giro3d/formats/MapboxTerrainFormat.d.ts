import { DataTexture } from 'three';
import type { DecodeOptions } from './ImageFormat';
import ImageFormat from './ImageFormat';
/**
 * Decoder for [Mapbox Terrain](https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-dem-v1/) images.
 */
declare class MapboxTerrainFormat extends ImageFormat {
    readonly isMapboxTerrainFormat: boolean;
    readonly type: "MapboxTerrainFormat";
    private readonly _enableWorkers;
    /**
     * @param options - Decoder options.
     */
    constructor(options?: {
        /**
         * Enables processing raster data in web workers.
         * @defaultValue true
         */
        enableWorkers?: boolean;
    });
    /**
     * Decode a Mapbox Terrain blob into a
     * [DataTexture](https://threejs.org/docs/?q=texture#api/en/textures/DataTexture) containing
     * the elevation data.
     *
     * @param blob - the data to decode
     * @param options - the decoding options
     */
    decode(blob: Blob, options?: DecodeOptions): Promise<{
        texture: DataTexture;
        min: number;
        max: number;
    }>;
    private getHeightValuesUsingWorker;
}
export default MapboxTerrainFormat;
//# sourceMappingURL=MapboxTerrainFormat.d.ts.map