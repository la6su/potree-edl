import type { Sphere } from 'three';
import { Box3, Matrix4, Vector3 } from 'three';
import type View from '../renderer/View';
export interface SSE {
    origin: Vector3;
    x: Vector3;
    y: Vector3;
    z: Vector3 | null;
    lengths: {
        x: number;
        y: number;
        z: number | null;
    };
    ratio: number;
    area: number;
}
declare enum Mode {
    MODE_2D = 1,
    MODE_3D = 2
}
declare const _default: {
    Mode: typeof Mode;
    /**
     * Compute a "visible" error: project geometricError in meter on screen,
     * based on a bounding box and a transformation matrix.
     *
     * @param view - the current view of the scene
     * @param box3 - the box3 to consider
     * @param matrix - the matrix world of the box
     * @param geometricError - the geometricError
     * @param mode - Whether or not use 3D in the calculus
     */
    computeFromBox3(view: View, box3: Box3, matrix: Matrix4, geometricError: number, mode: Mode): SSE | null;
    computeFromSphere(view: View, sphere: Sphere, geometricError: number): number;
};
export default _default;
//# sourceMappingURL=ScreenSpaceError.d.ts.map