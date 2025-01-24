import type { Camera, Material, Object3D, WebGLRenderer } from 'three';
import { WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import PointCloudRenderer from './PointCloudRenderer';
import type RenderingOptions from './RenderingOptions';
/**
 * Can be a Mesh or a PointCloud for instance
 */
type Object3DWithMaterial = Object3D & {
    material: Material;
};
/**
 * A render pipeline that supports various effects.
 */
export default class RenderPipeline {
    renderer: WebGLRenderer;
    buckets: Object3DWithMaterial[][];
    sceneRenderTarget: WebGLRenderTarget | null;
    effectComposer?: EffectComposer;
    pointCloudRenderer?: PointCloudRenderer;
    /**
     * @param renderer - The WebGL renderer.
     */
    constructor(renderer: WebGLRenderer);
    prepareRenderTargets(width: number, height: number, samples: number): {
        composer: EffectComposer;
        target: WebGLRenderTarget;
    };
    /**
     * @param scene - The scene to render.
     * @param camera - The camera to render.
     * @param width - The width in pixels of the render target.
     * @param height - The height in pixels of the render target.
     * @param options - The options.
     */
    render(scene: Object3D, camera: Camera, width: number, height: number, options: RenderingOptions): void;
    /**
     * @param scene - The scene to render.
     * @param camera - The camera.
     * @param meshes - The meshes to render.
     * @param opts - The rendering options.
     */
    renderPointClouds(scene: Object3D, camera: Camera, target: WebGLRenderTarget, meshes: Object3DWithMaterial[], opts: RenderingOptions): void;
    /**
     * @param scene - The scene to render.
     * @param camera - The camera.
     * @param meshes - The meshes to render.
     */
    renderMeshes(scene: Object3D, camera: Camera, meshes: Object3DWithMaterial[]): void;
    onAfterRender(): void;
    dispose(): void;
    /**
     * @param scene - The root scene.
     */
    collectRenderBuckets(scene: Object3D): void;
}
export {};
//# sourceMappingURL=RenderPipeline.d.ts.map