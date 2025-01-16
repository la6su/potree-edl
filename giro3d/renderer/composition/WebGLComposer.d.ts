import { Mesh, Texture, WebGLRenderTarget, type ColorRepresentation, type MagnificationTextureFilter, type MinificationTextureFilter, type PixelFormat, type TextureDataType, type WebGLRenderer } from 'three';
import Interpretation from '../../core/layer/Interpretation';
import Rect from '../../core/Rect';
export type DrawableImage = Texture | HTMLImageElement | HTMLCanvasElement;
export interface DrawOptions {
    interpretation?: Interpretation;
    renderOrder?: number;
    flipY?: boolean;
    fillNoData?: boolean;
    fillNoDataRadius?: number;
    fillNoDataAlphaReplacement?: number;
    transparent?: boolean;
    expandRGB?: boolean;
    convertRGFloatToRGBAUnsignedByte?: {
        precision: number;
        offset: number;
    };
}
/**
 * Composes images together using a three.js scene and an orthographic camera.
 */
declare class WebGLComposer {
    private readonly _showImageOutlines;
    private readonly _showEmptyTextures;
    private readonly _extent?;
    private readonly _renderer;
    private readonly _reuseTexture;
    private readonly _clearColor?;
    private readonly _minFilter;
    private readonly _magFilter;
    private readonly _ownedTextures;
    private readonly _scene;
    private readonly _camera;
    private readonly _expandRGB;
    private _renderTarget?;
    readonly dataType: TextureDataType;
    readonly pixelFormat: PixelFormat;
    readonly width?: number;
    readonly height?: number;
    /**
     * Creates an instance of WebGLComposer.
     *
     * @param options - The options.
     */
    constructor(options: {
        /** Optional extent of the canvas. If undefined, then the canvas is an infinite plane. */
        extent?: Rect;
        /** The canvas width, in pixels. Ignored if a canvas is provided. */
        width?: number;
        /** The canvas height, in pixels. Ignored if a canvas is provided. */
        height?: number;
        /** If true, yellow image outlines will be drawn on images. */
        showImageOutlines?: boolean;
        /** Shows empty textures as colored rectangles */
        showEmptyTextures?: boolean;
        /** If true, this composer will try to reuse the same texture accross renders.
         * Note that this may not be always possible if the texture format has to change
         * due to incompatible images to draw. For example, if the current target has 8-bit pixels,
         * and a 32-bit texture must be drawn onto the canvas, the underlying target will have to
         * be recreated in 32-bit format. */
        reuseTexture?: boolean;
        /** The minification filter of the generated texture. Default is `LinearFilter`. */
        minFilter?: MinificationTextureFilter;
        /** The magnification filter of the generated texture. Default is `LinearFilter`. */
        magFilter?: MagnificationTextureFilter;
        /** The WebGL renderer to use. This must be the same renderer as the one used
         * to display the rendered textures, because WebGL contexts are isolated from each other. */
        webGLRenderer: WebGLRenderer;
        /** The clear (background) color. */
        clearColor?: ColorRepresentation;
        /** The pixel format of the output textures. */
        pixelFormat: PixelFormat;
        /** The data type of the output textures. */
        textureDataType: TextureDataType;
        /** If `true`, textures are considered grayscale and will be expanded
         * to RGB by copying the R channel into the G and B channels. */
        expandRGB?: boolean;
    });
    /**
     * Sets the camera frustum to the specified rect.
     *
     * @param rect - The rect.
     */
    private setCameraRect;
    private createRenderTarget;
    /**
     * Draws an image to the composer.
     *
     * @param image - The image to add.
     * @param extent - The extent of this texture in the composition space.
     * @param options - The options.
     */
    draw(image: DrawableImage, extent: Rect, options?: DrawOptions): Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap>;
    /**
     * Draws a texture on a custom mesh to the composer.
     *
     * @param image - The image to add.
     * @param mesh - The custom mesh.
     * @param options - Options.
     */
    drawMesh(image: DrawableImage, mesh: Mesh, options?: DrawOptions): Mesh;
    remove(mesh: Mesh): void;
    /**
     * Resets the composer to a blank state.
     */
    clear(): void;
    private removeObjects;
    private saveState;
    private restoreState;
    /**
     * Renders the composer into a texture.
     *
     * @param opts - The options.
     * @returns The texture of the render target.
     */
    render(opts?: {
        /** A custom rect for the camera. */
        rect?: Rect;
        /** The width, in pixels, of the output texture. */
        width?: number;
        /** The height, in pixels, of the output texture. */
        height?: number;
        /** The render target. */
        target?: WebGLRenderTarget;
    }): Texture;
    private removeTextures;
    /**
     * Disposes all unmanaged resources in this composer.
     */
    dispose(): void;
}
/**
 * Transfers the pixels of a RenderTarget in the RG format and float32 data type into a RGBA / 8bit.
 */
export declare function readRGRenderTargetIntoRGBAU8Buffer(options: {
    renderTarget: WebGLRenderTarget;
    renderer: WebGLRenderer;
    outputWidth: number;
    outputHeight: number;
    precision: number;
    offset: number;
}): Uint8ClampedArray;
export default WebGLComposer;
//# sourceMappingURL=WebGLComposer.d.ts.map