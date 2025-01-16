import type { WebGLRenderer } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import type { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import { type DefaultUserData } from './SimpleGeometryMesh';
export default class LineStringMesh<UserData extends DefaultUserData = DefaultUserData> extends Line2 implements SimpleGeometryMesh<UserData> {
    readonly isSimpleGeometryMesh: true;
    readonly isLineStringMesh: true;
    readonly type: "LineStringMesh";
    private _featureOpacity;
    private _styleOpacity;
    userData: Partial<UserData>;
    constructor(geometry: LineGeometry, material: LineMaterial, opacity: number);
    dispose(): void;
    update(options: {
        material: LineMaterial | null;
        opacity: number;
        renderOrder: number;
    }): void;
    private updateOpacity;
    onBeforeRender(renderer: WebGLRenderer): void;
    set opacity(opacity: number);
}
export declare function isLineStringMesh<UserData extends DefaultUserData = DefaultUserData>(obj: unknown): obj is LineStringMesh<UserData>;
//# sourceMappingURL=LineStringMesh.d.ts.map