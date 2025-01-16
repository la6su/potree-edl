import { BaseResponse, type GeoTIFFImage } from 'geotiff';
import Extent from '../core/geographic/Extent';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import ImageSource, { ImageResult, type ImageSourceOptions } from './ImageSource';
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
export type ChannelMapping = [number] | [number, number, number] | [number, number, number, number];
export declare class FetcherResponse extends BaseResponse {
    readonly response: Response;
    /**
     * BaseResponse facade for fetch API Response
     *
     * @param response - The response.
     */
    constructor(response: Response);
    get status(): number;
    getHeader(name: string): string;
    getData(): Promise<ArrayBuffer>;
}
export interface GeoTIFFCacheOptions {
    /**
     * The cache size (in number of entries), of the underlying
     * [blocked source](https://geotiffjs.github.io/geotiff.js/BlockedSource_BlockedSource.html).
     * Default is `100`.
     */
    cacheSize?: number;
    /**
     * The block size (in bytes), of the underlying
     * [blocked source](https://geotiffjs.github.io/geotiff.js/BlockedSource_BlockedSource.html).
     * Default is `65536`.
     */
    blockSize?: number;
}
export interface GeoTIFFSourceOptions extends ImageSourceOptions {
    /**
     * The URL to the GeoTIFF image.
     */
    url: string;
    /**
     * The Coordinate Reference System of the image.
     */
    crs: string;
    /**
     * How to map bands in the source GeoTIFF to color channels in Giro3D textures.
     */
    channels?: ChannelMapping;
    /**
     * Advanced caching options.
     */
    cacheOptions?: GeoTIFFCacheOptions;
    /**
     * Enables web workers for CPU-intensive processing.
     * @defaultValue true
     */
    enableWorkers?: boolean;
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
declare class GeoTIFFSource extends ImageSource {
    readonly isGeoTIFFSource: boolean;
    readonly type: "GeoTIFFSource";
    readonly url: string;
    readonly crs: string;
    private readonly _cacheId;
    private readonly _cacheOptions?;
    private readonly _cache;
    private readonly _pool;
    private readonly _enableWorkers;
    private _imageCount;
    private _images;
    private _masks;
    private _channels;
    private _tiffImage?;
    private _extent?;
    private _dimensions?;
    private _sampleCount?;
    private _initialized;
    private _origin?;
    private _nodata?;
    private _initializePromise?;
    /**
     * Creates a {@link GeoTIFFSource} source.
     *
     * @param options - options
     */
    constructor(options: GeoTIFFSourceOptions);
    private getInternalCache;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    getExtent(): Extent;
    getCrs(): string;
    /**
     * Attemps to compute the exact extent of the TIFF image.
     *
     * @param crs - The CRS.
     * @param tiffImage - The TIFF image.
     */
    static computeExtent(crs: string, tiffImage: GeoTIFFImage): Extent;
    /**
     * @param requestExtent - The request extent.
     * @param requestWidth - The width, in pixels, of the request extent.
     * @param requestHeight - The height, in pixels, of the request extent.
     * @param margin - The margin, in pixels.
     * @returns The adjusted parameters.
     */
    adjustExtentAndPixelSize(requestExtent: Extent, requestWidth: number, requestHeight: number, margin?: number): {
        extent: Extent;
        width: number;
        height: number;
    };
    initialize(): Promise<void>;
    private initializeOnce;
    /**
     * Returns a window in the image's coordinates that matches the requested extent.
     *
     * @param extent - The window extent.
     * @param resolution - The spatial resolution of the window.
     * @returns The window.
     */
    private makeWindowFromExtent;
    /**
     * Creates a texture from the pixel buffer(s).
     *
     * @param buffers - The buffers (one buffer per band)
     * @returns The generated texture.
     */
    private createTexture;
    /**
     * Select the best overview level (or the final image) to match the
     * requested extent and pixel width and height.
     *
     * @param requestExtent - The window extent.
     * @param requestWidth - The pixel width of the window.
     * @param requestHeight - The pixel height of the window.
     * @returns The selected zoom level.
     */
    private selectLevel;
    /**
     * Gets or sets the channel mapping.
     */
    get channels(): ChannelMapping;
    set channels(value: ChannelMapping);
    private loadImage;
    private processTransparencyMask;
    private readWindow;
    /**
     * @param image - The image to read.
     * @param window - The image region to read.
     * @param signal - The abort signal.
     * @returns The buffers.
     */
    private fetchBuffer;
    /**
     * Extract a region from the specified image.
     *
     * @param extent - The request extent.
     * @param imageInfo - The image to sample.
     * @param signal - The abort signal.
     * @param id - The request id.
     * @returns The buffer(s).
     */
    private getRegionBuffers;
    getImages(options: {
        id: string;
        extent: Extent;
        width: number;
        height: number;
        signal?: AbortSignal;
    }): {
        id: string;
        request: () => Promise<ImageResult>;
    }[];
    dispose(): void;
}
export default GeoTIFFSource;
//# sourceMappingURL=GeoTIFFSource.d.ts.map