import type Extent from './geographic/Extent';
/**
 * A rectangle.
 */
declare class Rect {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    constructor(xMin: number, xMax: number, yMin: number, yMax: number);
    get left(): number;
    get right(): number;
    get top(): number;
    get bottom(): number;
    get width(): number;
    get height(): number;
    get centerX(): number;
    get centerY(): number;
    static fromExtent(extent: Extent): Rect;
    /**
     * @param other - The other rect.
     * @param epsilon - The comparison epsilon.
     * @returns True if they are equal.
     */
    equals(other: Rect, epsilon?: number): boolean;
    getIntersection(other: Rect): Rect;
    /**
     * Returns the equivalent rectangle of `source` normalized over the dimensions of `dest`.
     *
     * @param source - The source rect.
     * @param dest - The destination rect.
     */
    static getNormalizedRect(source: Rect, dest: Rect): {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}
export default Rect;
//# sourceMappingURL=Rect.d.ts.map