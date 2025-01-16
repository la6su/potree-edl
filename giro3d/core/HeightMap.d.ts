import type { FloatType, RedFormat, RGFormat, TypedArray, UnsignedShortType } from 'three';
import { RGBAFormat, UnsignedByteType } from 'three';
import type ElevationRange from './ElevationRange';
import type OffsetScale from './OffsetScale';
import type Rect from './Rect';
export type HeightMapPixelFormat = typeof RGBAFormat | typeof RGFormat | typeof RedFormat;
export type HeightMapTextureDataType = typeof UnsignedByteType | typeof UnsignedShortType | typeof FloatType;
/**
 * Utility class to sample an elevation raster.
 */
export default class HeightMap {
    /**
     * The heightmap data.
     */
    readonly buffer: TypedArray;
    /**
     * The width, in pixels, of the heightmap buffer.
     */
    readonly width: number;
    /**
     * The height, in pixels, of the heightmap buffer.
     */
    readonly height: number;
    /**
     * The transformation to apply to UV coordinates before sampling the buffer.
     */
    readonly offsetScale: OffsetScale;
    /**
     * The distance between each elevation value in the buffer.
     * e.g If the buffer is an RGBA buffer, stride is 4.
     */
    readonly stride: number;
    /**
     * The format of the underlying buffer pixels.
     */
    readonly format: HeightMapPixelFormat;
    /**
     * The data type of the underlying buffer pixels.
     */
    readonly type: HeightMapTextureDataType;
    /**
     * The vertical precision of the height values to apply during decoding.
     */
    readonly precision: number;
    /**
     * The offset to apply to height values during decoding.
     */
    readonly offset: number;
    constructor(buffer: TypedArray, width: number, height: number, offsetScale: OffsetScale, format: HeightMapPixelFormat, type: HeightMapTextureDataType, precision?: number, offset?: number);
    private readRGBA;
    private readRG;
    clone(): HeightMap;
    /**
     * Returns the elevation of the pixel that contains the UV coordinate.
     * No interpolation is performed.
     * @param u - The normalized U coordinate (along the horizontal axis).
     * @param v - The normalized V coordinate (along the vertical axis).
     * @param ignoreTransparentPixels - If `true`, then transparent pixels are returned. Otherwise
     * values that match transparent pixels return `null`. Default is `false`.
     */
    getValue(u: number, v: number, ignoreTransparentPixels?: boolean): number | null;
    /**
     * Computes the min/max elevation from the given normalized region.
     * @param uvRect - The normalized region to process.
     * @returns The min/max, if any, otherwise `null`.
     */
    getMinMax(uvRect: Rect): ElevationRange | null;
    private getPixelCoordinates;
    private getValueRaw;
}
//# sourceMappingURL=HeightMap.d.ts.map