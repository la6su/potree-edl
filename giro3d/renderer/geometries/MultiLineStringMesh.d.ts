import { Object3D } from 'three';
import type LineStringMesh from './LineStringMesh';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import type { DefaultUserData, SimpleGeometryMeshEventMap } from './SimpleGeometryMesh';
export default class MultiLineStringMesh<UserData extends DefaultUserData = DefaultUserData> extends Object3D<SimpleGeometryMeshEventMap> implements SimpleGeometryMesh<UserData> {
    readonly isSimpleGeometryMesh: true;
    readonly isMultiLineStringMesh: true;
    readonly type: "MultiLineStringMesh";
    userData: Partial<UserData>;
    set opacity(opacity: number);
    constructor(lineStrings: LineStringMesh[]);
    dispose(): void;
    /**
     * Executes the callback on all the {@link LineStringMesh}es of this mesh.
     * @param callback - The callback to execute.
     */
    traverseLineStrings(callback: (obj: LineStringMesh) => void): void;
}
export declare function isMultiLineStringMesh(obj: unknown): obj is MultiLineStringMesh;
//# sourceMappingURL=MultiLineStringMesh.d.ts.map