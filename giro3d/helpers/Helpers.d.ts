import { ArrowHelper, AxesHelper, Box3, Box3Helper, BufferGeometry, Color, GridHelper, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Vector3, type Object3D } from 'three';
import type { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import type OBB from '../core/OBB.js';
import type { ProcessedTile } from '../entities/3dtiles/3dTilesIndex';
import type Tiles3D from '../entities/Tiles3D';
import OBBHelper from './OBBHelper';
export declare class VolumeHelper extends OBBHelper {
    readonly isvolumeHelper = true;
}
export declare class SphereHelper extends Mesh<BufferGeometry, MeshBasicMaterial> {
    readonly isHelper = true;
}
export declare class BoundingBoxHelper extends Box3Helper {
    readonly isHelper = true;
    readonly isvolumeHelper = true;
}
interface HasVolumeHelper extends Object3D {
    volumeHelper: VolumeHelper;
}
export declare function hasVolumeHelper(obj: unknown): obj is HasVolumeHelper;
interface HasBoundingVolumeHelper extends Object3D {
    boundingVolumeHelper: {
        object3d: SphereHelper | VolumeHelper | LineSegments<LineSegmentsGeometry | BufferGeometry, LineBasicMaterial> | Mesh<BufferGeometry, MeshBasicMaterial>;
        absolute: boolean;
    };
}
export declare function hasBoundingVolumeHelper(obj: unknown): obj is HasBoundingVolumeHelper;
/**
 * Provides utility functions to create scene helpers, such as bounding boxes, grids, axes...
 *
 */
declare class Helpers {
    /**
     * Adds a bounding box helper to the object.
     * If a bounding box is already present, it is updated instead.
     *
     * @param obj - The object to decorate.
     * @param color - The color.
     * @example
     * // add a bounding box to 'obj'
     * Helpers.addBoundingBox(obj, 'green');
     */
    static addBoundingBox(obj: Object3D, color: Color | string): void;
    static createBoxHelper(box: Box3, color: Color): BoundingBoxHelper;
    static set axisSize(v: number);
    static get axisSize(): number;
    /**
     * Creates a selection bounding box helper around the specified object.
     *
     * @param obj - The object to decorate.
     * @param color - The color.
     * @returns the created box helper.
     * @example
     * // add a bounding box to 'obj'
     * Helpers.createSelectionBox(obj, 'green');
     */
    static createSelectionBox(obj: Object3D, color: Color): BoundingBoxHelper;
    /**
     * Adds an oriented bounding box (OBB) helper to the object.
     * If a bounding box is already present, it is updated instead.
     *
     * @param obj - The object to decorate.
     * @param obb - The OBB.
     * @param color - The color.
     * @example
     * // add an OBB to 'obj'
     * Helpers.addOBB(obj, obj.OBB, 'green');
     */
    static addOBB(obj: Object3D, obb: OBB, color: Color): void;
    static removeOBB(obj: Object3D): void;
    /**
     * Creates a bounding volume helper to the 3D Tile object and returns it.
     * The bounding volume can contain a sphere, a region, or a box.
     *
     * @param entity - The entity.
     * @param obj - The object to decorate.
     * @param metadata - The tile metadata
     * @param color - The color.
     * @returns The helper object, or null if it could not be created.
     * @example
     * // add a bounding box to 'obj'
     * Helpers.create3DTileBoundingVolume(entity, obj, volume, 'green');
     */
    static create3DTileBoundingVolume(entity: Tiles3D, obj: Object3D, metadata: ProcessedTile, color: Color | string): {
        object3d: SphereHelper | VolumeHelper | LineSegments<LineSegmentsGeometry | BufferGeometry, LineBasicMaterial> | Mesh<BufferGeometry, MeshBasicMaterial>;
        absolute: boolean;
    } | null;
    /**
     * Create a grid on the XZ plane.
     *
     * @param origin - The grid origin.
     * @param size - The size of the grid.
     * @param subdivs - The number of grid subdivisions.
     */
    static createGrid(origin: Vector3, size: number, subdivs: number): GridHelper;
    /**
     * Create an axis helper.
     *
     * @param size - The size of the helper.
     */
    static createAxes(size: number): AxesHelper;
    static remove3DTileBoundingVolume(obj: Object3D): void;
    static update3DTileBoundingVolume(obj: Object3D, properties: {
        color: Color;
    }): void;
    /**
     * Creates an arrow between the two points.
     *
     * @param start - The starting point.
     * @param end - The end point.
     */
    static createArrow(start: Vector3, end: Vector3): ArrowHelper;
    /**
     * Removes an existing bounding box from the object, if any.
     *
     * @param obj - The object to update.
     * @example
     * Helpers.removeBoundingBox(obj);
     */
    static removeBoundingBox(obj: Object3D): void;
}
export default Helpers;
//# sourceMappingURL=Helpers.d.ts.map