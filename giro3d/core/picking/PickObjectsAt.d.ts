import { Vector2, type Object3D } from 'three';
import type Instance from '../Instance';
import type PickOptions from './PickOptions';
import type PickResult from './PickResult';
/**
 * Default picking object. Uses RayCaster
 *
 * @param instance - Instance to pick from
 * @param canvasCoords - Coordinates on the rendering canvas
 * @param object - Object to pick from
 * @param options - Options
 * @returns Array of picked objects
 */
declare function pickObjectsAt(instance: Instance, canvasCoords: Vector2, object: Object3D, options?: PickOptions): PickResult<unknown>[];
export default pickObjectsAt;
//# sourceMappingURL=PickObjectsAt.d.ts.map