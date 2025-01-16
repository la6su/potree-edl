import { Vector2, Vector4 } from 'three';
/**
 * Describes a transformation of a point in 2D space without rotation.
 * Typically used for to transform texture coordinates.
 */
export default class OffsetScale extends Vector4 {
    readonly isOffsetScale = true;
    get offsetX(): number;
    get offsetY(): number;
    get scaleX(): number;
    get scaleY(): number;
    constructor(offsetX?: number, offsetY?: number, scaleX?: number, scaleY?: number);
    static identity(): OffsetScale;
    /**
     * Transforms the point.
     * @param point - The point to transform.
     * @param target - The target to fill with the transformed point.
     * @returns The transformed point.
     */
    transform(point: Vector2, target?: Vector2): Vector2;
    combine(offsetScale: OffsetScale, target?: OffsetScale): OffsetScale;
}
//# sourceMappingURL=OffsetScale.d.ts.map