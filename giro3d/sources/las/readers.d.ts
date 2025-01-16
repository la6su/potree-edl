import type { View } from 'copc';
import type { BufferAttribute } from 'three';
import { Box3 } from 'three';
import type { PointCloudAttribute } from '../PointCloudSource';
import type { FilterByIndex } from './filter';
/**
 * Reads the color in the provided LAS view.
 *
 * Note: the color is the aggregate of the `Red`, `Green` and `Blue` dimensions.
 *
 * @param view - The view to read.
 * @param stride - The stride (take every Nth point). A stride of 3 means we take every 3rd point
 * and discard the others.
 * @param compress - Compress colors to 8-bit.
 * @param filters - The optional dimension filters to use.
 * @returns An object containing the color buffer.
 */
export declare function readColor(view: View, stride: number, compress: boolean, filters: FilterByIndex[] | null): ArrayBuffer;
/**
 * Reads the point position in the provided LAS view.
 * @param view - The view to read.
 * @param origin - The origin to use for relative point coordinates.
 * @param stride - The stride (take every Nth point). A stride of 3 means we take every 3rd point
 * and discard the others.
 * @param filters - The optional dimension filters to use.
 * @returns An object containing the relative position buffer, and a local (tight) bounding box of
 * the position buffer.
 */
export declare function readPosition(view: View, origin: {
    x: number;
    y: number;
    z: number;
}, stride: number, filters: FilterByIndex[] | null): {
    buffer: ArrayBuffer;
    localBoundingBox: Box3;
};
export declare function readScalarAttribute(view: Readonly<View>, attribute: PointCloudAttribute, stride: number, filters: FilterByIndex[] | null): ArrayBuffer;
export declare function createBufferAttribute(buffer: ArrayBuffer, attribute: PointCloudAttribute, compressColors: boolean): BufferAttribute;
//# sourceMappingURL=readers.d.ts.map