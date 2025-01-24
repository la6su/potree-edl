import { Color, DepthTexture, FloatType, NearestFilter, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js';
import PointCloudRenderer from './PointCloudRenderer';
const BUCKETS = {
  OPAQUE: 0,
  POINT_CLOUD: 1,
  TRANSPARENT: 2
};

/**
 * Can be a Mesh or a PointCloud for instance
 */

const currentClearColor = new Color();
const tmpColor = new Color();

/**
 * @param meshes - The meshes to update.
 * @param visible - The new material visibility.
 */
function setVisibility(meshes, visible) {
  for (let i = 0; i < meshes.length; i++) {
    meshes[i].material.visible = visible;
  }
}
function clear(renderer) {
  // Since our render target is in linear color space, we need to convert
  // the current clear color (that is expected to be in sRGB).
  const current = renderer.getClearColor(currentClearColor);
  const alpha = renderer.getClearAlpha();
  const clearColor = tmpColor.setRGB(current.r, current.g, current.b, 'srgb-linear');
  renderer.setClearColor(clearColor);
  renderer.setClearAlpha(alpha);
  renderer.clear();
  renderer.setClearColor(currentClearColor);
  renderer.setClearAlpha(alpha);
}

/**
 * A render pipeline that supports various effects.
 */
export default class RenderPipeline {
  /**
   * @param renderer - The WebGL renderer.
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.buckets = [[], [], []];
    this.sceneRenderTarget = null;
  }
  prepareRenderTargets(width, height, samples) {
    if (!this.sceneRenderTarget || this.sceneRenderTarget.width !== width || this.sceneRenderTarget.height !== height || this.sceneRenderTarget.samples !== samples) {
      this.sceneRenderTarget?.dispose();
      this.effectComposer?.dispose();
      // This is the render target that the initial rendering of scene will be:
      // opaque, transparent and point cloud buckets render into this.
      this.sceneRenderTarget = new WebGLRenderTarget(width, height, {
        generateMipmaps: false,
        magFilter: NearestFilter,
        minFilter: NearestFilter,
        depthBuffer: true,
        samples,
        depthTexture: new DepthTexture(width, height, FloatType)
      });
      this.effectComposer = new EffectComposer(this.renderer);

      // After the buckets have been rendered into the render target,
      // the effect composer will render this render target to the canvas.
      this.effectComposer.addPass(new TexturePass(this.sceneRenderTarget.texture));

      // Final pass to output to the canvas (including colorspace transformation).
      this.effectComposer.addPass(new OutputPass());
    }
    return {
      composer: this.effectComposer,
      target: this.sceneRenderTarget
    };
  }

  /**
   * @param scene - The scene to render.
   * @param camera - The camera to render.
   * @param width - The width in pixels of the render target.
   * @param height - The height in pixels of the render target.
   * @param options - The options.
   */
  render(scene, camera, width, height, options) {
    const renderer = this.renderer;
    const maxSamples = this.renderer.capabilities.maxSamples;
    // No need for more
    const samples = options.enableMSAA ? Math.min(maxSamples, 4) : 0;
    const {
      composer,
      target
    } = this.prepareRenderTargets(width, height, samples);
    renderer.setRenderTarget(this.sceneRenderTarget);
    this.collectRenderBuckets(scene);

    // Ensure that any background (texture or skybox) is properly handled
    // by rendering it separately first.
    clear(renderer);
    this.renderer.render(scene, camera);
    this.renderMeshes(scene, camera, this.buckets[BUCKETS.OPAQUE]);

    // Point cloud rendering adds special effects. To avoid applying those effects
    // to all objects in the scene, we separate the meshes into buckets, and
    // render those buckets separately.
    this.renderPointClouds(scene, camera, target, this.buckets[BUCKETS.POINT_CLOUD], options);
    this.renderMeshes(scene, camera, this.buckets[BUCKETS.TRANSPARENT]);

    // Finally, render to the canvas via the EffectComposer.
    composer.render();
    this.onAfterRender();
  }

  /**
   * @param scene - The scene to render.
   * @param camera - The camera.
   * @param meshes - The meshes to render.
   * @param opts - The rendering options.
   */
  renderPointClouds(scene, camera, target, meshes, opts) {
    if (meshes.length === 0) {
      return;
    }
    if (!this.pointCloudRenderer) {
      this.pointCloudRenderer = new PointCloudRenderer(this.renderer);
    }
    const pcr = this.pointCloudRenderer;
    pcr.edl.enabled = opts.enableEDL;
    pcr.edl.parameters.radius = opts.EDLRadius;
    pcr.edl.parameters.strength = opts.EDLStrength;
    pcr.inpainting.enabled = opts.enableInpainting;
    pcr.inpainting.parameters.fill_steps = opts.inpaintingSteps;
    pcr.inpainting.parameters.depth_contrib = opts.inpaintingDepthContribution;
    pcr.occlusion.enabled = opts.enablePointCloudOcclusion;
    setVisibility(meshes, true);
    pcr.render(scene, camera, target);
    setVisibility(meshes, false);
  }

  /**
   * @param scene - The scene to render.
   * @param camera - The camera.
   * @param meshes - The meshes to render.
   */
  renderMeshes(scene, camera, meshes) {
    if (meshes.length === 0) {
      return;
    }
    const renderer = this.renderer;
    setVisibility(meshes, true);
    renderer.render(scene, camera);
    setVisibility(meshes, false);
  }
  onAfterRender() {
    // Reset the visibility of all rendered objects
    for (const bucket of this.buckets) {
      setVisibility(bucket, true);
      bucket.length = 0;
    }
  }
  dispose() {
    this.effectComposer?.dispose();
    this.sceneRenderTarget?.dispose();
    this.pointCloudRenderer?.dispose();
  }

  /**
   * @param scene - The root scene.
   */
  collectRenderBuckets(scene) {
    const renderBuckets = this.buckets;
    scene.traverse(obj => {
      const mesh = obj;
      const material = mesh.material;
      if (mesh.visible && material != null && material.visible) {
        material.visible = false;
        if (mesh.isPointCloud) {
          // The point cloud bucket will receive special effects
          renderBuckets[BUCKETS.POINT_CLOUD].push(mesh);
        } else if (mesh.material.transparent) {
          renderBuckets[BUCKETS.TRANSPARENT].push(mesh);
        } else {
          renderBuckets[BUCKETS.OPAQUE].push(mesh);
        }
      }
    });
  }
}