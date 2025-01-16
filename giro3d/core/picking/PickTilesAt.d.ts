import { Vector2 } from 'three';
import type Map from '../../entities/Map';
import Coordinates from '../geographic/Coordinates';
import type Instance from '../Instance';
import type TileMesh from '../TileMesh';
import type PickOptions from './PickOptions';
import type PickResult from './PickResult';
/** Pick result on tiles (e.g. map) */
export interface MapPickResult<TFeature = unknown> extends PickResult<TFeature & unknown> {
    isMapPickResult: true;
    entity: Map;
    /** Tile containing the picked result. */
    object: TileMesh;
    /** Coordinates of the point picked. */
    coord: Coordinates;
}
/**
 * Tests whether an object implements {@link MapPickResult}.
 *
 * @param obj - Object
 * @returns `true` if the object implements the interface.
 */
export declare const isMapPickResult: (obj: unknown) => obj is MapPickResult;
/**
 * Pick tiles from a map object. This does not do any sorting
 *
 * @param instance - Instance to pick from
 * @param canvasCoords - Coordinates on the rendering canvas
 * @param map - Map object to pick from
 * @param options - Options
 * @returns Target
 */
declare function pickTilesAt(instance: Instance, canvasCoords: Vector2, map: Map, options?: PickOptions): MapPickResult<unknown>[];
export default pickTilesAt;
//# sourceMappingURL=PickTilesAt.d.ts.map