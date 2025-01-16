import PointCloud from '../../core/PointCloud';
import PointCloudMaterial from '../../renderer/PointCloudMaterial';
import type Tiles3D from '../Tiles3D';
import type { $3dTilesTileset } from './types';
declare function b3dmToMesh(data: ArrayBuffer, entity: Tiles3D, url: string): Promise<{
    batchTable: import("../../parser/BatchTableParser").BatchTable;
    object3d: import("three").Object3D<import("three").Object3DEventMap>;
}>;
declare function pntsParse(data: ArrayBuffer, entity: Tiles3D): Promise<{
    object3d: PointCloud<PointCloudMaterial>;
}>;
declare function jsonParse(data: ArrayBuffer, entity: Tiles3D, url: string): Promise<{
    newTileset: $3dTilesTileset;
    newPrefix: string;
}>;
declare const _default: {
    b3dmToMesh: typeof b3dmToMesh;
    pntsParse: typeof pntsParse;
    jsonParse: typeof jsonParse;
};
export default _default;
//# sourceMappingURL=3dTilesLoader.d.ts.map