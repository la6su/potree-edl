import type { Camera, Scene, SpriteMaterial, WebGLRenderer } from 'three';
import { Sprite } from 'three';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import type { DefaultUserData } from './SimpleGeometryMesh';
export type ConstructorParams = {
    material: SpriteMaterial;
    opacity?: number;
    pointSize?: number;
};
export default class PointMesh<UserData extends DefaultUserData = DefaultUserData> extends Sprite implements SimpleGeometryMesh<UserData> {
    readonly isSimpleGeometryMesh: true;
    readonly isPointMesh: true;
    readonly type: "PointMesh";
    private _featureOpacity;
    private _styleOpacity;
    private _pointSize;
    userData: Partial<UserData>;
    constructor(params: ConstructorParams);
    set opacity(opacity: number);
    private updateOpacity;
    onBeforeRender(renderer: WebGLRenderer, _scene: Scene, camera: Camera): void;
    update(options: Omit<ConstructorParams, 'material'> & {
        material: SpriteMaterial | null;
        renderOrder: number;
    }): void;
    dispose(): void;
}
export declare function isPointMesh<UserData extends DefaultUserData = DefaultUserData>(obj: unknown): obj is PointMesh<UserData>;
//# sourceMappingURL=PointMesh.d.ts.map