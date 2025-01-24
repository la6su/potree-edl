import {BlendFunction, EffectComposer, EffectPass, OutlineEffect, ShaderPass} from 'postprocessing';
import {
    Camera,
    Color,
    DepthTexture,
    FloatType,
    Material,
    NearestFilter,
    Object3D, Raycaster,
    Scene,
    ShaderMaterial, Vector2,
    WebGLRenderer,
    WebGLRenderTarget
} from 'three';

import type PointCloud from '../core/PointCloud';
import PointCloudRenderer from './PointCloudRenderer';
import type RenderingOptions from './RenderingOptions';

const BUCKETS = {
    OPAQUE: 0,
    POINT_CLOUD: 1,
    TRANSPARENT: 2,
};

/**
 * Can be a Mesh or a PointCloud for instance
 */
type Object3DWithMaterial = Object3D & {
    material: Material;
};

const currentClearColor = new Color();
const tmpColor = new Color();

/**
 * @param meshes - The meshes to update.
 * @param visible - The new material visibility.
 */
function setVisibility(meshes: Object3DWithMaterial[], visible: boolean) {
    for (let i = 0; i < meshes.length; i++) {
        meshes[i].material.visible = visible;
    }
}

function clear(renderer: WebGLRenderer) {
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
    renderer: WebGLRenderer;
    buckets: Object3DWithMaterial[][];
    sceneRenderTarget: WebGLRenderTarget | null;
    effectComposer!: EffectComposer;
    outlineEffect?: OutlineEffect;
    pointCloudRenderer?: PointCloudRenderer;
    scene: Scene;
    camera: Camera;
    private selectedObjects: any[];
    private raycaster: Raycaster;
    private readonly mouse: Vector2;

    /**
     * @param renderer - The WebGL renderer.
     * @param scene
     * @param camera
     */
    constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.buckets = [[], [], []];

        this.sceneRenderTarget = null;

        this.selectedObjects = [];
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        this.renderer.domElement.style.touchAction = "none";
        this.renderer.domElement.addEventListener("pointerdown", (event) => {
            if (!event.isPrimary) {
                return;
            }

            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.checkIntersection();
        });

    }

    prepareRenderTargets(width: number, height: number, samples: number) {
        if (
            !this.sceneRenderTarget ||
            this.sceneRenderTarget.width !== width ||
            this.sceneRenderTarget.height !== height ||
            this.sceneRenderTarget.samples !== samples
        ) {
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
                depthTexture: new DepthTexture(width, height, FloatType),
            });

            this.effectComposer = new EffectComposer(this.renderer);

            this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
                blendFunction: BlendFunction.ADD,
                multisampling: Math.min(4, this.renderer.capabilities.maxSamples),
                edgeStrength: 10,
                pulseSpeed: 0.0,
                visibleEdgeColor: 0xffffff,
                hiddenEdgeColor: 0x22090a,
                height: 480,
                blur: false,
                xRay: true
            });

            // After the buckets have been rendered into the render target,
            // the effect composer will render this render target to the canvas.
            this.effectComposer.addPass(new ShaderPass(new ShaderMaterial({
                uniforms: {
                    tDiffuse: {value: this.sceneRenderTarget.texture}
                },
                vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
                fragmentShader: `
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `
            })));

            // Final pass to output to the canvas (including colorspace transformation).
            const outlinePass = new EffectPass(this.camera, this.outlineEffect);
            this.effectComposer.addPass(outlinePass);

        }

        return {
            composer: this.effectComposer as EffectComposer,
            target: this.sceneRenderTarget as WebGLRenderTarget,
        };
    }

    /**
     * @param scene - The scene to render.
     * @param camera - The camera to render.
     * @param width - The width in pixels of the render target.
     * @param height - The height in pixels of the render target.
     * @param options - The options.
     */
    render(
        scene: Object3D,
        camera: Camera,
        width: number,
        height: number,
        options: RenderingOptions,
    ) {
        const renderer = this.renderer;

        const maxSamples = this.renderer.capabilities.maxSamples;
        const requiredSamples = 4; // No need for more
        const samples = options.enableMSAA ? Math.min(maxSamples, requiredSamples) : 0;

        const {composer, target} = this.prepareRenderTargets(width, height, samples);

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
     * @param target - The WebGLRender target.
     * @param meshes - The meshes to render.
     * @param opts - The rendering options.
     */
    renderPointClouds(
        scene: Object3D,
        camera: Camera,
        target: WebGLRenderTarget,
        meshes: Object3DWithMaterial[],
        opts: RenderingOptions,
    ) {
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
    // @ts-ignore
    renderMeshes(scene: Object3D, camera: Camera, meshes: Object3DWithMaterial[]) {
        if (meshes.length === 0) {
            return;
        }

        // const renderer = this.renderer;

        setVisibility(meshes, true);
        this.effectComposer.render();
        // setVisibility(meshes, false);
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
    collectRenderBuckets(scene: Object3D) {
        const renderBuckets = this.buckets;

        scene.traverse(obj => {
            const mesh = obj as Object3DWithMaterial;
            const material = mesh.material;

            if (mesh.visible && material != null && material.visible) {
                material.visible = false;

                if ((mesh as PointCloud).isPointCloud) {
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

    addSelectedObject = (object: Object3D) => {
        this.selectedObjects = [];
        this.selectedObjects.push(object);
        if (this.outlineEffect) {
            this.outlineEffect['selection'].set(this.selectedObjects);
            console.log(this.outlineEffect['selection']);
        }
    };

    checkIntersection = () => {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const myCube = this.scene.getObjectByName("myCube");
        if (!myCube) return;
            const intersects = this.raycaster.intersectObject(myCube, true);
            if (intersects.length > 0) {
                const selectedObject = intersects[0].object;
                if(selectedObject !== undefined) {
                    this.addSelectedObject(selectedObject);
                }
            }
        }
}
