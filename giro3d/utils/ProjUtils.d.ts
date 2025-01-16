import type { Vector3 } from 'three';
import { Vector2, type TypedArray } from 'three';
/**
 * Transform the position buffer in place, from the source to the destination CRS.
 * The buffer is expected to contain N * stride elements, where N is the number of points.
 * Only the 2 first elements of each point (i.e the X and Y coordinate) are transformed. The other
 * elements are left untouched.
 *
 * @param buf - The buffer to transform.
 * @param params - The transformation parameters.
 */
declare function transformBufferInPlace(buf: TypedArray, params: {
    /** The source CRS code. Must be known to PROJ. */
    srcCrs: string;
    /** The destination CRS code. Must be known to PROJ. */
    dstCrs: string;
    /** The stride of the buffer. */
    stride: number;
    /** The offset to apply after transforming the coordinate. */
    offset?: Vector2;
}): void;
/**
 * Transforms the vector array _in place_, from the source to the destination CRS.
 */
declare function transformVectors<T extends Vector2 | Vector3>(srcCrs: string, dstCrs: string, points: T[]): void;
export type ID = Record<string, number>;
export type Authority = Record<string, number>;
export type ProjCS = {
    AUTHORITY: Authority;
};
export type ProjCRS = {
    ID: ID;
};
export type CompoundCS = {
    PROJCS: ProjCS;
};
declare function getWKTCrsCode(wkt: string): string | undefined;
declare const _default: {
    transformBufferInPlace: typeof transformBufferInPlace;
    transformVectors: typeof transformVectors;
    getWKTCrsCode: typeof getWKTCrsCode;
};
export default _default;
//# sourceMappingURL=ProjUtils.d.ts.map