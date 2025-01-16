import { Box3, Sphere, type Matrix4 } from 'three';
import Extent from '../../core/geographic/Extent';
import type OBB from '../../core/OBB';
import type View from '../../renderer/View';
import { type ProcessedTile } from './3dTilesIndex';
import Tile from './Tile';
export interface BoundingVolume {
    region?: OBB;
    box?: Box3;
    sphere?: Sphere;
}
/**
 * Returns the best fit extent from the volume of the tile.
 *
 * @param crs - The CRS of the target extent.
 * @param volume - The volume of the tile.
 * @param transform - The world matrix of the object.
 * @returns The extent.
 */
export declare function boundingVolumeToExtent(crs: string, volume: BoundingVolume, transform: Matrix4): Extent;
/**
 * Returns the Box3 equivalent of the bounding volume.
 *
 * @param volume - The bounding volume of the tile.
 * @param transform - The world matrix of the object.
 */
export declare function boundingVolumeToBox3(volume: BoundingVolume, transform: Matrix4): Box3;
export declare function cullingTestViewer(boundingVolume: BoundingVolume, camera: View, tileMatrixWorld: Matrix4): boolean;
export declare function cullingTestBoundingVolume(boundingVolume: BoundingVolume, camera: View, tileMatrixWorld: Matrix4): boolean;
export declare function cullingTest(camera: View, node: ProcessedTile | Tile, tileMatrixWorld: Matrix4): boolean;
//# sourceMappingURL=BoundingVolume.d.ts.map