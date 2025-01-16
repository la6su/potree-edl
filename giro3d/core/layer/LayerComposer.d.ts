import { Mesh, Vector2, type Material, type PixelFormat, type Texture, type TextureDataType, type WebGLRenderer, type WebGLRenderTarget } from 'three';
import WebGLComposer from '../../renderer/composition/WebGLComposer';
import type Extent from '../geographic/Extent';
import type MemoryUsage from '../MemoryUsage';
import { type GetMemoryUsageContext } from '../MemoryUsage';
import Interpretation from './Interpretation';
interface TextureWithMinMax extends Texture {
    min?: number;
    max?: number;
}
declare class Image implements MemoryUsage {
    readonly isMemoryUsage: true;
    readonly id: string;
    readonly mesh: Mesh;
    readonly extent: Extent;
    readonly texture: Texture;
    readonly alwaysVisible: boolean;
    readonly material: Material;
    readonly min?: number;
    readonly max?: number;
    disposed: boolean;
    readonly owners: Set<number>;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    constructor(options: {
        id: string;
        mesh: Mesh;
        texture: Texture;
        extent: Extent;
        alwaysVisible: boolean;
        min?: number;
        max?: number;
    });
    canBeDeleted(): boolean;
    set visible(v: boolean);
    get visible(): boolean;
    set opacity(v: number);
    get opacity(): number;
    dispose(): void;
}
declare class LayerComposer implements MemoryUsage {
    readonly isMemoryUsage: true;
    readonly computeMinMax: boolean;
    readonly extent?: Extent;
    readonly dimensions: Vector2 | null;
    readonly images: Map<string, Image>;
    readonly webGLRenderer: WebGLRenderer;
    readonly transparent: boolean;
    readonly noDataValue: number;
    readonly sourceCrs: string;
    readonly targetCrs: string;
    readonly needsReprojection: boolean;
    readonly interpretation: Interpretation;
    readonly composer: WebGLComposer;
    readonly fillNoData: boolean;
    readonly fillNoDataAlphaReplacement?: number;
    readonly fillNoDataRadius?: number;
    readonly pixelFormat: PixelFormat;
    readonly textureDataType: TextureDataType;
    private _needsCleanup;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    /**
     * @param options - The options.
     */
    constructor(options: {
        /** The WebGLRenderer. */
        renderer: WebGLRenderer;
        /** Compute min/max on generated images. */
        computeMinMax: boolean;
        /** Enables transparency. */
        transparent?: boolean;
        /** The no-data value. */
        noDataValue?: number;
        /** The CRS of the source. */
        sourceCrs: string;
        /** The extent. */
        extent?: Extent;
        /** Show image outlines. */
        showImageOutlines: boolean;
        /** The target CRS of this composer. */
        targetCrs: string;
        /** The interpretation of the layer. */
        interpretation: Interpretation;
        /** Fill no-data values of the image. */
        fillNoData: boolean;
        /** Alpha value for no-data pixels (after replacement) */
        fillNoDataAlphaReplacement?: number;
        /** Fill no-data maximum radius. */
        fillNoDataRadius?: number;
        /**  The pixel format of the output textures. */
        pixelFormat: PixelFormat;
        /** The type of the output textures. */
        textureDataType: TextureDataType;
        /** Shows empty textures as colored rectangles */
        showEmptyTextures: boolean;
    });
    /**
     * Prevents the specified image from being removed during the cleanup step.
     *
     * @param id - The image ID to lock.
     * @param nodeId - The node id.
     */
    lock(id: string, nodeId: number): void;
    /**
     * Allows the specified images to be removed during the cleanup step.
     *
     * @param ids - The image id to unlock.
     * @param nodeId - The node id.
     */
    unlock(ids: Set<string>, nodeId: number): void;
    /**
     * Computes the render order for an image that has the specified extent.
     *
     * Smaller images will be rendered on top of bigger images.
     *
     * @param extent - The extent.
     * @returns The render order to use for the specified extent.
     */
    private computeRenderOrder;
    private preprocessImage;
    /**
     * Creates a lattice mesh whose each vertex has been warped to the target CRS.
     *
     * @param sourceExtent - The source extent of the mesh to reproject, in the CRS of the source.
     * @param segments - The number of subdivisions of the lattice.
     * A high value will create more faithful reprojections, at the cost of performance.
     */
    private createWarpedMesh;
    /**
     * Adds a texture into the composer space.
     *
     * @param options - opts
     */
    add(options: {
        /** The image ID. */
        id: string;
        /** The texture. */
        texture: Texture;
        /** The geographic extent of the texture. */
        extent: Extent;
        /** Flip the image vertically. */
        flipY?: boolean;
        /** The min value of the texture. */
        min?: number;
        /** The max value of the texture. */
        max?: number;
        /** Force constant visibility of this image. */
        alwaysVisible?: boolean;
    }): void;
    /**
     * Gets whether this composer contains the specified image.
     *
     * @param imageId - The image ID.
     * @returns True if the composer contains the image.
     */
    has(imageId: string): boolean;
    /**
     * Copies the source texture into the destination texture, taking into account the extent
     * of both textures.
     *
     * @param options - Options.
     */
    copy(options: {
        /** The extent of the destination texture. */
        targetExtent: Extent;
        /** The source render targets. */
        source: {
            texture: TextureWithMinMax;
            extent: Extent;
        }[];
        /** The destination render target. */
        dest: WebGLRenderTarget;
    }): void;
    /**
     * Clears the target texture.
     *
     * @param options - The options.
     */
    clearTexture(options: {
        /** The geographic extent of the region. */
        extent: Extent;
        /** The width, in pixels of the target texture. */
        width: number;
        /** The height, in pixels of the target texture. */
        height: number;
        /** Clears the target texture. */
        clear: boolean;
        /** The optional render target. */
        target: WebGLRenderTarget;
    }): void;
    /**
     * Returns the min/max values for images that overlap the specified extent.
     *
     * @param extent - The extent.
     */
    getMinMax(extent: Extent): {
        min: number;
        max: number;
    };
    /**
     * Renders a region of the composer space into a texture.
     *
     * @param options - The options.
     */
    render(options: {
        /** The geographic extent of the region. */
        extent: Extent;
        /** The width, in pixels of the target texture. */
        width: number;
        /** The height, in pixels of the target texture. */
        height: number;
        /** Clears the target texture. */
        clear?: boolean;
        /** The image ids to render. */
        imageIds: Set<string>;
        /** Fallback mode. */
        isFallbackMode?: boolean;
        /** The optional render target. */
        target: WebGLRenderTarget;
    }): {
        texture: TextureWithMinMax;
        isLastRender: boolean;
    };
    private processFillNoData;
    postUpdate(): boolean;
    private disposeImage;
    cleanup(): void;
    /**
     * Clears the composer.
     */
    clear(extent?: Extent): void;
    /**
     * Disposes the composer.
     */
    dispose(): void;
}
export default LayerComposer;
//# sourceMappingURL=LayerComposer.d.ts.map