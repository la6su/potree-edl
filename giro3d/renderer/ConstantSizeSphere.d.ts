import { Mesh, Vector3, type Camera, type Intersection, type Material, type Raycaster, type Scene, type WebGLRenderer } from 'three';
/**
 * A 3D sphere that maintains the same apparent radius in screen space pixels.
 */
export default class ConstantSizeSphere extends Mesh {
    /**
     * The radius, in pixels.
     */
    radius: number;
    enableRaycast: boolean;
    readonly isConstantSizeSphere: true;
    readonly type: "ConstantSizeSphere";
    constructor(options?: {
        /**
         * The sphere apparent radius, in pixels.
         * @defaultValue 10
         */
        radius?: number;
        /**
         * The sphere material.
         * @defaultValue a {@link MeshStandardMaterial} with a red color.
         */
        material?: Material;
    });
    raycast(raycaster: Raycaster, intersects: Intersection[]): void;
    onBeforeRender(renderer: WebGLRenderer, _scene: Scene, camera: Camera): void;
}
/**
 * Returns the radius in world units so that a sphere appears to have a given radius in pixels.
 */
export declare function getWorldSpaceRadius(renderer: WebGLRenderer, camera: Camera, worldPosition: Vector3, screenSpaceRadius: number): number;
export declare function isConstantSizeSphere(obj: unknown): obj is ConstantSizeSphere;
//# sourceMappingURL=ConstantSizeSphere.d.ts.map