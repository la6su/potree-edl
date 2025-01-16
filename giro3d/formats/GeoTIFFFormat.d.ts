import type { DecodeOptions } from './ImageFormat';
import ImageFormat from './ImageFormat';
/**
 * Decoder for TIFF images.
 *
 */
declare class GeoTIFFFormat extends ImageFormat {
    readonly isGeoTIFFFormat: boolean;
    readonly type = "GeoTIFFFormat";
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
     * Decode a tiff blob into a
     * [DataTexture](https://threejs.org/docs/?q=texture#api/en/textures/DataTexture) containing
     * the elevation data.
     *
     * @param blob - the data to decode
     * @param options - the decoding options
     */
    decode(blob: Blob, options?: DecodeOptions): Promise<{
        texture: import("three").Texture | import("three").DataTexture;
        min: number;
        max: number;
    }>;
}
export default GeoTIFFFormat;
//# sourceMappingURL=GeoTIFFFormat.d.ts.map