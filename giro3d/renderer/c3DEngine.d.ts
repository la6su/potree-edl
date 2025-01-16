import type { Camera, ColorRepresentation, Object3D, Scene, TextureDataType, WebGLRendererParameters } from 'three';
import { Vector2, WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import RenderingOptions from './RenderingOptions';
export interface RenderToBufferZone {
    /** x (in instance coordinate) */
    x: number;
    /** y (in instance coordinate) */
    y: number;
    /** width of area to render (in pixels) */
    width: number;
    /** height of area to render (in pixels) */
    height: number;
}
export interface RenderToBufferOptions {
    /** The clear color to apply before rendering. */
    clearColor?: ColorRepresentation;
    /** The scene to render. */
    scene: Object3D;
    /** The camera to render. */
    camera: Camera;
    /**
     * The type of pixels in the buffer.
     *
     * @defaultvalue `UnsignedByteType`.
     */
    datatype?: TextureDataType;
    /** partial zone to render. If undefined, the whole viewport is used. */
    zone?: RenderToBufferZone;
}
type EngineOptions = {
    clearColor?: ColorRepresentation | null;
    renderer?: WebGLRenderer | WebGLRendererParameters;
};
declare class C3DEngine {
    private readonly _renderTargets;
    readonly renderer: WebGLRenderer;
    readonly labelRenderer: CSS2DRenderer;
    private _renderPipeline;
    width: number;
    height: number;
    renderingOptions: RenderingOptions;
    clearAlpha: number;
    clearColor: ColorRepresentation;
    /**
     * @param target - The parent div that will contain the canvas.
     * @param options - The options.
     */
    constructor(target: HTMLDivElement, options?: EngineOptions);
    dispose(): void;
    onWindowResize(w: number, h: number): void;
    /**
     * Gets the viewport size, in pixels.
     *
     * @returns The viewport size, in pixels.
     */
    getWindowSize(target?: Vector2): Vector2;
    /**
     * Renders the scene.
     *
     * @param scene - The scene to render.
     * @param camera - The camera.
     */
    render(scene: Scene, camera: Camera): void;
    /**
     * Use a custom pipeline when post-processing is required.
     *
     * @param scene - The scene to render.
     * @param camera - The camera.
     */
    renderUsingCustomPipeline(scene: Object3D, camera: Camera): void;
    private acquireRenderTarget;
    /**
     * Renders the scene into a readable buffer.
     *
     * @param options - Options.
     * @returns The buffer. The first pixel in the buffer is the bottom-left pixel.
     */
    renderToBuffer(options: RenderToBufferOptions): Uint8Array | Float32Array;
    /**
     * Render the scene to a render target.
     *
     * @param scene - The scene root.
     * @param camera - The camera to render.
     * @param target - destination render target. Default value: full size
     * render target owned by C3DEngine.
     * @param zone - partial zone to render (zone x/y uses canvas coordinates)
     * Note: target must contain complete zone
     * @returns the destination render target
     */
    private renderToRenderTarget;
    /**
     * Converts the pixel buffer into an image element.
     *
     * @param pixelBuffer - The 8-bit RGBA buffer.
     * @param width - The width of the buffer, in pixels.
     * @param height - The height of the buffer, in pixels.
     * @returns The image.
     */
    static bufferToImage(pixelBuffer: ArrayLike<number>, width: number, height: number): HTMLImageElement;
}
export default C3DEngine;
//# sourceMappingURL=c3DEngine.d.ts.map