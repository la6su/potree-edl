import { Box3, Object3D, Vector3 } from 'three';
declare class OBB extends Object3D {
    readonly isHelper: true;
    readonly type: "OBB";
    readonly box3D: Box3;
    readonly natBox: Box3;
    z: {
        min: number;
        max: number;
    };
    topPointsWorld: Vector3[];
    constructor(min: Vector3, max: Vector3);
    clone(): this;
    updateMinMax(min: Vector3, max: Vector3): void;
    update(): void;
    updateZ(min: number, max: number): void;
    _points(points: Vector3[]): Vector3[];
    _cPointsWorld(points: Vector3[]): Vector3[];
}
export default OBB;
//# sourceMappingURL=OBB.d.ts.map