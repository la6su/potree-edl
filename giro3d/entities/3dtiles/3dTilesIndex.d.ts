import { Matrix4 } from 'three';
import { type BoundingVolume } from './BoundingVolume';
import type Tile from './Tile';
import type { $3dTilesTile, $3dTilesTileset } from './types';
/** Processed tile metadata */
export interface ProcessedTile extends $3dTilesTile {
    isProcessedTile: boolean;
    transformMatrix: Matrix4;
    worldFromLocalTransform: Matrix4;
    viewerRequestVolumeObject?: BoundingVolume;
    boundingVolumeObject: BoundingVolume;
    promise?: Promise<void>;
    tileId: number;
    magic?: string;
    obj: Tile | undefined;
    children?: ProcessedTile[];
}
/** Tile index */
declare class $3dTilesIndex {
    private _counter;
    /** Map by tileId */
    readonly index: Record<number, ProcessedTile>;
    private _inverseTileTransform;
    constructor(tileset: $3dTilesTileset, baseURL: string);
    get(tile: Tile): ProcessedTile;
    private _recurse;
    extendTileset(tileset: $3dTilesTileset, nodeId: number, baseURL: string): void;
}
export default $3dTilesIndex;
//# sourceMappingURL=3dTilesIndex.d.ts.map