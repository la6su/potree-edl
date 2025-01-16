import type { WebGLRenderTarget } from 'three';
import { DataTexture, Texture, type AnyPixelFormat, type CanvasTexture, type Color, type MagnificationTextureFilter, type MinificationTextureFilter, type PixelFormat, type RenderTarget, type TextureDataType, type TypedArray, type WebGLRenderer } from 'three';
import Interpretation from '../core/layer/Interpretation';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
export declare const OPAQUE_BYTE = 255;
export declare const OPAQUE_FLOAT = 1;
export declare const TRANSPARENT = 0;
export declare const DEFAULT_NODATA = 0;
declare function isDataTexture(texture: Texture): texture is DataTexture;
declare function isCanvasTexture(texture: Texture): texture is CanvasTexture;
/**
 * Returns the number of bytes per channel.
 *
 * @param dataType - The pixel format.
 * @returns The number of bytes per channel.
 */
declare function getBytesPerChannel(dataType: TextureDataType): number;
declare function getDataTypeString(dataType: TextureDataType): string;
/**
 * Returns the number of channels per pixel.
 *
 * @param pixelFormat - The pixel format.
 * @returns The number of channels per pixel.
 */
declare function getChannelCount(pixelFormat: AnyPixelFormat): number;
/**
 * Estimate the size of the texture.
 *
 * @param texture - The texture.
 * @returns The size, in bytes.
 */
declare function estimateSize(texture: Texture): number;
/**
 * Reads back the render target buffer into CPU memory, then attach this buffer to the `data`
 * property of the render target's texture.
 *
 * This is useful because normally the pixels of a render target are not readable.
 *
 * @param target - The render target to read back.
 * @param renderer - The WebGL renderer to perform the operation.
 */
declare function createDataCopy(target: WebGLRenderTarget, renderer: WebGLRenderer): void;
/**
 * Decodes the blob according to its media type, then returns a texture for this blob.
 *
 * @param blob - The buffer to decode.
 * @param options - Options
 * @returns The generated texture.
 * @throws When the media type is unsupported or when the image dimensions are greater than the
 * maximum texture size.
 */
declare function decodeBlob(blob: Blob, options?: {
    /** If true, the texture will be a data texture. */
    createDataTexture?: boolean;
    /** Should the image be flipped vertically ? */
    flipY?: boolean;
    /**
     * Enable web workers.
     * @defaultValue true
     */
    enableWorkers?: boolean;
}): Promise<Texture>;
export type CreateDataTextureResult = {
    texture: DataTexture | Texture;
    min: number;
    max: number;
};
/**
 * Returns a {@link DataTexture} initialized with the specified data.
 *
 * @param options - The creation options.
 * @param sourceDataType - The data type of the input pixel data.
 * @param pixelData - The pixel data
 * for each input channels. Must be either one, three, or four channels.
 */
declare function createDataTexture(options: {
    /** The texture width */
    width: number;
    /** The texture height */
    height: number;
    /**
     * The no-data value. If specified, if a pixel has this value,
     * then the alpha value will be transparent. Otherwise it will be opaque.
     * If unspecified, the alpha will be opaque. This only applies to 1-channel data.
     * Ignored for 3 and 4-channel data.
     */
    nodata?: number;
}, sourceDataType: TextureDataType, ...pixelData: TypedArray[]): CreateDataTextureResult;
/**
 * Returns a {@link DataTexture} initialized with the specified data.
 *
 * @param options - The creation options.
 * @param sourceDataType - The data type of the input pixel data.
 * @param pixelData - The pixel data
 * for each input channels. Must be either one, three, or four channels.
 */
declare function createDataTextureAsync(options: {
    /** The texture width */
    width: number;
    /** The texture height */
    height: number;
    /**
     * The no-data value. If specified, if a pixel has this value,
     * then the alpha value will be transparent. Otherwise it will be opaque.
     * If unspecified, the alpha will be opaque. This only applies to 1-channel data.
     * Ignored for 3 and 4-channel data.
     */
    nodata?: number;
    /**
     * Enable processing in workers.
     * @defaultValue true
     */
    enableWorkers?: boolean;
}, sourceDataType: TextureDataType, ...pixelData: TypedArray[]): Promise<CreateDataTextureResult>;
/**
 * Returns a 1D texture containing a pixel on the horizontal axis for each color in the array.
 *
 * @param colors - The color gradient.
 * @param alpha - The optional alpha gradient. Must be of the same length as the color gradient.
 * @returns The resulting texture.
 */
declare function create1DTexture(colors: Color[], alpha?: number[]): DataTexture;
/**
 * Computes the minimum and maximum value of the buffer, but only taking into account the first
 * channel (R channel). This is typically used for elevation data.
 *
 * @param buffer - The pixel buffer. May be an RGBA or an RG buffer.
 * @param nodata - The no-data value. Pixels with this value will be ignored.
 * @param interpretation - The image interpretation.
 * @param channelCount - The channel count of the buffer
 * @returns The computed min/max.
 */
declare function computeMinMaxFromBuffer(buffer: TypedArray, nodata?: number, interpretation?: Interpretation, channelCount?: number): {
    min: number;
    max: number;
};
declare function getWiderType(left: TextureDataType, right: TextureDataType): TextureDataType;
declare function shouldExpandRGB(src: PixelFormat, dst: PixelFormat): boolean;
/**
 * Computes min/max of the given image.
 *
 * @param image - The image to process.
 * @param interpretation - The interpretation of the image.
 * @returns The min/max.
 */
declare function computeMinMaxFromImage(image: HTMLImageElement | HTMLCanvasElement, interpretation?: Interpretation): {
    min: number;
    max: number;
};
declare function computeMinMax(texture: Texture, noDataValue?: number, interpretation?: Interpretation): {
    min: number;
    max: number;
} | null;
declare function isEmptyTexture(texture: Texture): boolean;
declare function getMemoryUsage(context: GetMemoryUsageContext, texture: Texture | RenderTarget | null): void;
declare function isCanvasEmpty(canvas: HTMLCanvasElement): boolean;
/**
 * Returns a texture filter that is compatible with the texture.
 * @param filter - The requested filter.
 * @param dataType - The texture data type.
 * @param renderer - The WebGLRenderer
 * @returns The requested filter, if compatible, or {@link NearestFilter} if not compatible.
 */
declare function getCompatibleTextureFilter<F extends MagnificationTextureFilter | MinificationTextureFilter>(filter: F, dataType: TextureDataType, renderer: WebGLRenderer): F;
/**
 * Updates the texture to improve compatibility with various platforms.
 */
declare function ensureCompatibility(texture: Texture, renderer: WebGLRenderer): void;
declare const _default: {
    createDataTexture: typeof createDataTexture;
    createDataTextureAsync: typeof createDataTextureAsync;
    isEmptyTexture: typeof isEmptyTexture;
    decodeBlob: typeof decodeBlob;
    getChannelCount: typeof getChannelCount;
    getBytesPerChannel: typeof getBytesPerChannel;
    getWiderType: typeof getWiderType;
    getDataTypeString: typeof getDataTypeString;
    create1DTexture: typeof create1DTexture;
    createDataCopy: typeof createDataCopy;
    computeMinMax: typeof computeMinMax;
    isDataTexture: typeof isDataTexture;
    isCanvasTexture: typeof isCanvasTexture;
    computeMinMaxFromBuffer: typeof computeMinMaxFromBuffer;
    computeMinMaxFromImage: typeof computeMinMaxFromImage;
    estimateSize: typeof estimateSize;
    shouldExpandRGB: typeof shouldExpandRGB;
    isCanvasEmpty: typeof isCanvasEmpty;
    getMemoryUsage: typeof getMemoryUsage;
    getCompatibleTextureFilter: typeof getCompatibleTextureFilter;
    ensureCompatibility: typeof ensureCompatibility;
};
export default _default;
//# sourceMappingURL=TextureGenerator.d.ts.map