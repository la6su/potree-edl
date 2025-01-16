import { Object3D } from 'three';
import type PointMesh from './PointMesh';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import type { DefaultUserData, SimpleGeometryMeshEventMap } from './SimpleGeometryMesh';
export default class MultiPointMesh<UserData extends DefaultUserData = DefaultUserData> extends Object3D<SimpleGeometryMeshEventMap> implements SimpleGeometryMesh<UserData> {
    readonly isSimpleGeometryMesh: true;
    readonly isMultiPointMesh: true;
    readonly type: "MultiPointMesh";
    userData: Partial<UserData>;
    constructor(points: PointMesh[]);
    set opacity(opacity: number);
    /**
     * Executes the callback on all the {@link PointMesh}es of this mesh.
     * @param callback - The callback to execute.
     */
    traversePoints(callback: (polygon: PointMesh) => void): void;
    dispose(): void;
}
export declare function isMultiPointMesh(obj: unknown): obj is MultiPointMesh;
//# sourceMappingURL=MultiPointMesh.d.ts.map