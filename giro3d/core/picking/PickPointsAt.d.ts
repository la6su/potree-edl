import { type Points, type Vector2 } from 'three';
import type Entity3D from '../../entities/Entity3D';
import type Instance from '../Instance';
import type PickOptions from './PickOptions';
import type PickResult from './PickResult';
/** Pick result on PointCloud-like objects */
export interface PointsPickResult<TFeature = unknown> extends PickResult<TFeature & unknown> {
    isPointsPickResult: true;
    /** Point cloud picked */
    object: Points;
    /** Index of the point in the `Points` object */
    index: number;
    /** Coordinates of the point picked. */
    coord: {
        x: number;
        y: number;
        z: number;
    };
}
/**
 * Tests whether an object implements {@link PointsPickResult}.
 *
 * @param obj - Object
 * @returns `true` if the object implements the interface.
 */
export declare const isPointsPickResult: (obj: unknown) => obj is PointsPickResult;
/**
 * Pick points from a PointCloud-like entity.
 *
 * @param instance - Instance to pick from
 * @param canvasCoords - Coordinates on the rendering canvas
 * @param entity - Object to pick from
 * @param options - Options
 * @returns Array of picked objects
 */
declare function pickPointsAt(instance: Instance, canvasCoords: Vector2, entity: Entity3D, options?: PickOptions): PointsPickResult<unknown>[];
export default pickPointsAt;
//# sourceMappingURL=PickPointsAt.d.ts.map