import { BufferGeometry, LineBasicMaterial, LineSegments, type Color } from 'three';
import type OBB from '../core/OBB';
/**
 * Displays an Oriented Bounding Box (OBB).
 *
 */
declare class OBBHelper extends LineSegments<BufferGeometry, LineBasicMaterial> {
    readonly type: "OBBHelper";
    readonly isHelper: true;
    constructor(OBB: OBB | undefined, color: Color);
    dispose(): void;
    setMaterialVisibility(show: boolean): void;
    update(OBB: OBB, color: Color): void;
}
export default OBBHelper;
//# sourceMappingURL=OBBHelper.d.ts.map