import type { Camera, Object3D, PerspectiveCamera, WebGLRenderer } from 'three';
import { Mesh, OrthographicCamera, Scene, ShaderMaterial, WebGLRenderTarget } from 'three';
interface Stage<TParams = unknown> {
    /** The render passes of this stage. */
    passes: ShaderMaterial[];
    /** The parameters of this stage. */
    parameters: TParams;
    /** Is the stage enabled ? */
    enabled: boolean;
    /** The setup function. */
    setup: (args: {
        input: WebGLRenderTarget;
        targets: WebGLRenderTarget[];
        passIdx: number;
        camera: PerspectiveCamera | OrthographicCamera;
    }) => {
        material?: ShaderMaterial;
        output?: WebGLRenderTarget;
    };
}
interface EdlParams {
    /** distance to neighbours pixels */
    radius: number;
    /** edl value coefficient */
    strength: number;
    /** directions count where neighbours are taken */
    directions: number;
    /** how many neighbours per direction */
    n: number;
}
interface OcclusionParams {
    /** pixel suppression threshold */
    threshold: number;
    /** debug feature to colorize removed pixels */
    showRemoved: boolean;
}
interface InpaintingParams {
    /** how many fill step should be performed */
    fill_steps: number;
    /** depth contribution to the final color (?) */
    depth_contrib: number;
    enableZAttenuation: boolean;
    zAttMin: number;
    zAttMax: number;
}
/**
 * A post-processing renderer that adds effects to point clouds.
 */
declare class PointCloudRenderer {
    scene: Scene;
    mesh: Mesh;
    camera: OrthographicCamera;
    classic: Stage;
    edl: Stage<EdlParams>;
    occlusion: Stage<OcclusionParams>;
    inpainting: Stage<InpaintingParams>;
    renderer: WebGLRenderer;
    renderTargets: WebGLRenderTarget[] | null;
    /**
     * Creates a point cloud renderer.
     *
     * @param webGLRenderer - The WebGL renderer.
     */
    constructor(webGLRenderer: WebGLRenderer);
    updateRenderTargets(renderTarget: WebGLRenderTarget): WebGLRenderTarget<import("three").Texture>[];
    createRenderTarget(width: number, height: number, depthBuffer: boolean): WebGLRenderTarget<import("three").Texture>;
    createRenderTargets(width: number, height: number): WebGLRenderTarget<import("three").Texture>[];
    render(scene: Object3D, camera: Camera, renderTarget: WebGLRenderTarget): void;
    dispose(): void;
}
export default PointCloudRenderer;
//# sourceMappingURL=PointCloudRenderer.d.ts.map