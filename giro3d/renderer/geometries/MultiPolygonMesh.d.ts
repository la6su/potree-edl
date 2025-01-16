import { Object3D } from 'three';
import type PolygonMesh from './PolygonMesh';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import type { DefaultUserData, SimpleGeometryMeshEventMap } from './SimpleGeometryMesh';
export default class MultiPolygonMesh<UserData extends DefaultUserData = DefaultUserData> extends Object3D<SimpleGeometryMeshEventMap> implements SimpleGeometryMesh<UserData> {
    readonly isSimpleGeometryMesh: true;
    readonly isMultiPolygonMesh: true;
    readonly type: "MultiPolygonMesh";
    userData: Partial<UserData>;
    set opacity(opacity: number);
    constructor(polygons: PolygonMesh[]);
    /**
     * Executes the callback on all the {@link PolygonMesh}es of this mesh.
     * @param callback - The callback to execute.
     */
    traversePolygons(callback: (polygon: PolygonMesh) => void): void;
    dispose(): void;
}
export declare function isMultiPolygonMesh(obj: unknown): obj is MultiPolygonMesh;
//# sourceMappingURL=MultiPolygonMesh.d.ts.map