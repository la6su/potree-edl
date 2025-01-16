import { Object3D, type Camera as ThreeCamera } from 'three';
import type { BatchTable } from '../../parser/BatchTableParser';
import type View from '../../renderer/View';
import { type ProcessedTile } from './3dTilesIndex';
import { type BoundingVolume } from './BoundingVolume';
/**
 * Represents a tile from a {@link Tiles3D} object.
 */
declare class Tile extends Object3D {
    /** Read-only flag to check if a given object is of type Tile. */
    readonly isTile: boolean;
    /** Parent tile */
    parent: Tile | null;
    geometricError: number;
    tileId: number;
    additiveRefinement: boolean;
    viewerRequestVolume?: BoundingVolume;
    boundingVolume: BoundingVolume;
    distance: {
        min: number;
        max: number;
    };
    content?: Object3D;
    batchTable?: BatchTable;
    children: Tile[];
    pendingSubdivision?: boolean;
    deleted?: number;
    cleanableSince?: number;
    sse?: number;
    constructor(metadata: ProcessedTile, parent?: Tile);
    getChildTiles(): Tile[];
    computeNodeSSE(view: View): number;
    setDisplayed(display: boolean): void;
    calculateCameraDistance(camera: ThreeCamera): void;
    markForDeletion(): void;
    unmarkForDeletion(): void;
}
export default Tile;
//# sourceMappingURL=Tile.d.ts.map