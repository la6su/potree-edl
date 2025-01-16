import { Color, EventDispatcher, Vector2, type ColorRepresentation, type Material, type Object3D, type Object3DEventMap, type PixelFormat, type Texture, type TextureDataType, type WebGLRenderTarget } from 'three';
import type RenderingContextHandler from '../../renderer/RenderingContextHandler';
import ImageSource from '../../sources/ImageSource';
import type ColorMap from '../ColorMap';
import type Context from '../Context';
import type Disposable from '../Disposable';
import type ElevationRange from '../ElevationRange';
import type Extent from '../geographic/Extent';
import type Instance from '../Instance';
import type MemoryUsage from '../MemoryUsage';
import { type GetMemoryUsageContext } from '../MemoryUsage';
import type OffsetScale from '../OffsetScale';
import type Progress from '../Progress';
import type RequestQueue from '../RequestQueue';
import type ColorLayer from './ColorLayer';
import Interpretation from './Interpretation';
import LayerComposer from './LayerComposer';
import type NoDataOptions from './NoDataOptions';
export interface TextureAndPitch {
    texture: Texture;
    pitch: OffsetScale;
}
/**
 * Events for nodes.
 */
export interface LayerNodeEventMap extends Object3DEventMap {
    dispose: unknown;
    'visibility-changed': unknown;
}
/**
 * A node material.
 */
export interface LayerNodeMaterial extends Material {
    setColorTextures(layer: ColorLayer, textureAndPitch: TextureAndPitch): void;
    setLayerVisibility(layer: ColorLayer, visible: boolean): void;
    setLayerOpacity(layer: ColorLayer, opacity: number): void;
    setLayerElevationRange(layer: ColorLayer, range: ElevationRange | null): void;
    setColorimetry(layer: ColorLayer, brightness: number, contrast: number, saturation: number): void;
    hasColorLayer(layer: ColorLayer): boolean;
    indexOfColorLayer(layer: ColorLayer): number;
    removeColorLayer(layer: ColorLayer): void;
    pushColorLayer(layer: ColorLayer, extent: Extent): void;
}
/**
 * Represents an object that can be painted by this layer.
 * Nodes might be map tiles or anything else that matches the interface definition.
 */
export interface LayerNode extends Object3D<LayerNodeEventMap> {
    /**
     * Is this node disposed ?
     */
    disposed: boolean;
    /**
     * The node material.
     */
    material: LayerNodeMaterial;
    /**
     * The node texture size, in pixels.
     */
    textureSize: Vector2;
    /**
     * Gets whether this node can accept a color layer texture.
     */
    canProcessColorLayer(): boolean;
    /**
     * The node's extent.
     */
    getExtent(): Extent;
    /**
     * The LOD or depth level of this node in the hierarchy (the root node is level zero).
     */
    level: number;
}
declare enum TargetState {
    Pending = 0,
    Processing = 1,
    Complete = 2
}
export declare class Target implements MemoryUsage {
    readonly isMemoryUsage: true;
    node: LayerNode;
    pitch: OffsetScale;
    extent: Extent;
    width: number;
    height: number;
    renderTarget: WebGLRenderTarget | null;
    imageIds: Set<string>;
    controller: AbortController;
    state: TargetState;
    geometryExtent: Extent;
    paintCount: number;
    private _disposed;
    private _onVisibilityChanged;
    isDisposed(): boolean;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    constructor(options: {
        node: LayerNode;
        extent: Extent;
        geometryExtent: Extent;
        pitch: OffsetScale;
        width: number;
        height: number;
    });
    dispose(): void;
    private onVisibilityChanged;
    reset(): void;
    abort(): void;
    abortAndThrow(): void;
}
export interface LayerEvents {
    /**
     * Fires when layer visibility changes.
     */
    'visible-property-changed': {
        visible: boolean;
    };
}
export interface LayerOptions {
    /**
     * An optional name for this layer.
     */
    name?: string;
    /**
     * The source of the layer.
     */
    source: ImageSource;
    /**
     * The optional extent to use for this layer. If none is provided, then the extent from the
     * source is used instead. The layer will not be visible outside this extent.
     */
    extent?: Extent;
    /**
     * How to interpret the pixel data of the source.
     */
    interpretation?: Interpretation;
    /**
     * Displays the border of source images.
     */
    showTileBorders?: boolean;
    /**
     * Displays empty textures as colored rectangles.
     */
    showEmptyTextures?: boolean;
    /**
     * How to treat no-data values.
     */
    noDataOptions?: NoDataOptions;
    /**
     * Enables min/max computation of source images. Mainly used for elevation data.
     */
    computeMinMax?: boolean;
    /**
     * The optional color map to use.
     */
    colorMap?: ColorMap;
    /**
     * Enables or disable preloading of low resolution fallback images. Those fallback images
     * are used when no data is available yet on a particular region of the layer.
     */
    preloadImages?: boolean;
    /**
     * The optional background color of the layer.
     */
    backgroundColor?: ColorRepresentation;
    /**
     * The resolution factor applied to textures generated by this layer, compared to the pixel size
     * of the targets. Default is `1`. A value greater than one will create textures with a higher
     * resolution than what is asked by the targets. For example, if a map tile has a texture size
     * of 256\*256, and a layer has a resolution factor of 2, the generated textures will have a
     * size of 512\*512 pixels.
     */
    resolutionFactor?: number;
}
export type LayerUserData = Record<string, unknown>;
/**
 * Base class of layers. Layers are components of maps or any compatible entity.
 *
 * The same layer can be added to multiple entities. Don't forget to call {@link dispose} when the
 * layer should be destroyed, as removing a layer from an entity will not release memory associated
 * with the layer (such as textures).
 *
 * ## Layer nodes
 *
 * Layers generate textures to be applied to {@link LayerNode | nodes}. Nodes might be map tiles, point
 * cloud tiles or any object that matches the definition of the interface.
 *
 * ## Types of layers
 *
 * `Layer` is an abstract class. See subclasses for specific information. Main subclasses:
 *
 * - `ColorLayer` for color information, such as satellite imagery, vector data, etc.
 * - `ElevationLayer` for elevation and terrain data.
 * - `MaskLayer`: a special kind of layer that applies a mask on its host map.
 *
 * ## The `userData` property
 *
 * The `userData` property can be used to attach custom data to the layer, in a type safe manner.
 * It is recommended to use this property instead of attaching arbitrary properties to the object:
 *
 * ```ts
 * type MyCustomUserData = {
 *   creationDate: Date;
 *   owner: string;
 * };
 * const newLayer = new ColorLayer<MyCustomUserData>({ ... });
 *
 * newLayer.userData.creationDate = Date.now();
 * newLayer.userData.owner = 'John Doe';
 * ```
 *
 * ## Reprojection capabilities
 *
 * When the {@link source} of the layer has a different coordinate system (CRS) than the instance,
 * the images from the source will be reprojected to the instance CRS.
 *
 * Note that doing so will have a performance cost in both CPU and memory.
 *
 * ```js
 * // Add and create a new Layer to an existing map.
 * const newLayer = new ColorLayer({ ... });
 *
 * await map.addLayer(newLayer);
 *
 * // Change layer's visibilty
 * newLayer.visible = false;
 * instance.notifyChange(); // update instance
 *
 * // Change layer's opacity
 * newLayer.opacity = 0.5;
 * instance.notifyChange(); // update instance
 *
 * // Listen to properties
 * newLayer.addEventListener('visible-property-changed', (event) => console.log(event));
 * ```
 * @typeParam TEvents - The event map of the layer.
 * @typeParam TUserData - The type of the `userData` property.
 */
declare abstract class Layer<TEvents extends LayerEvents = LayerEvents, TUserData extends LayerUserData = LayerUserData> extends EventDispatcher<TEvents & LayerEvents> implements Progress, MemoryUsage, RenderingContextHandler, Disposable {
    readonly isMemoryUsage: true;
    /**
     * Optional name of this layer.
     */
    readonly name: string | undefined;
    /**
     * The unique identifier of this layer.
     */
    readonly id: string;
    /**
     * Read-only flag to check if a given object is of type Layer.
     */
    readonly isLayer: boolean;
    type: string;
    readonly interpretation: Interpretation;
    readonly showTileBorders: boolean;
    readonly showEmptyTextures: boolean;
    readonly noDataOptions: NoDataOptions;
    readonly computeMinMax: boolean;
    private _visible;
    /** The colormap of this layer */
    readonly colorMap: ColorMap | null;
    /** The extent of this layer */
    readonly extent: Extent | null;
    /** The source of this layer */
    readonly source: ImageSource;
    /** @internal */
    protected _composer: LayerComposer | null;
    private readonly _targets;
    private readonly _filter;
    /** @internal */
    protected readonly _queue: RequestQueue;
    private readonly _opCounter;
    private _sortedTargets;
    private _instance;
    private readonly _createReadableTextures;
    private readonly _preloadImages;
    private _fallbackImagesPromise;
    /** The resolution factor applied to the textures generated by this layer. */
    readonly resolutionFactor: number;
    private _preprocessOnce;
    private _onNodeDisposed;
    private _ready;
    backgroundColor: Color;
    /**
     * An object that can be used to store custom data about the {@link Layer}.
     */
    readonly userData: TUserData;
    /**
     * Disables automatic updates of this layer. Useful for debugging purposes.
     */
    frozen: boolean;
    get ready(): boolean;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    /**
     * Creates a layer.
     *
     * @param options - The layer options.
     */
    constructor(options: LayerOptions);
    private shouldCancelRequest;
    private onSourceUpdated;
    onRenderingContextLost(): void;
    onRenderingContextRestored(): void;
    /**
     * Resets all render targets to a blank state and repaint all the targets.
     * @param extent - An optional extent to limit the region to clear.
     */
    clear(extent?: Extent): void;
    /**
     * Gets or sets the visibility of this layer.
     */
    get visible(): boolean;
    set visible(v: boolean);
    get loading(): boolean;
    get progress(): number;
    /**
     * Initializes this layer. Note: this method is automatically called when the layer is added
     * to an entity.
     *
     * @param options - Initialization options.
     * @returns A promise that resolves when the initialization is complete.
     * @internal
     */
    initialize(options: {
        /**
         * The instance to associate this layer.
         * Once set, the layer cannot be used with any other instance.
         */
        instance: Instance;
    }): Promise<this>;
    protected get instance(): Instance;
    /**
     * Perform the initialization. This should be called exactly once in the lifetime of the layer.
     */
    private initializeOnce;
    /**
     * Returns the final extent of this layer. If this layer has its own extent defined,
     * this will be used.
     * Otherwise, will return the source extent (if any).
     * May return undefined if not pre-processed yet.
     *
     * @returns The layer final extent.
     */
    getExtent(): Extent | undefined;
    loadFallbackImagesInternal(): Promise<void>;
    protected onTextureCreated(texture: Texture): void;
    private addToComposer;
    loadFallbackImages(): Promise<void>;
    /**
     * Called when the layer has finished initializing.
     */
    protected onInitialized(): Promise<void>;
    private fetchImagesSync;
    /**
     * @param options - Options.
     * @returns A promise that is settled when all images have been fetched.
     */
    private fetchImages;
    /**
     * Removes the node from this layer.
     *
     * @param node - The disposed node.
     */
    unregisterNode(node: LayerNode): void;
    protected adjustExtent(extent: Extent): Extent;
    /**
     * Adjusts the extent to avoid visual artifacts.
     *
     * @param originalExtent - The original extent.
     * @param originalWidth - The width, in pixels, of the original extent.
     * @param originalHeight - The height, in pixels, of the original extent.
     * @returns And object containing the adjusted extent, as well as adjusted pixel size.
     */
    protected adjustExtentAndPixelSize(originalExtent: Extent, originalWidth: number, originalHeight: number): {
        extent: Extent;
        width: number;
        height: number;
    };
    /**
     * @returns Targets sorted by extent dimension.
     */
    private getSortedTargets;
    /**
     * Returns the first ancestor that is completely loaded, or null if not found.
     * @param target - The target.
     * @returns The smallest target that still contains this extent.
     */
    private getLoadedAncestor;
    /**
     * @param target - The target.
     */
    protected applyDefaultTexture(target: Target): void;
    /**
     * @internal
     */
    getInfo(node: LayerNode): {
        state: string;
        imageCount: number;
        paintCount: number;
    };
    /**
     * Processes the target once, fetching all images relevant for this target,
     * then paints those images to the target's texture.
     *
     * @param target - The target to paint.
     */
    private processTarget;
    private paintTarget;
    /**
     * Updates the provided node with content from this layer.
     *
     * @param context - the context
     * @param node - the node to update
     */
    update(context: Context, node: LayerNode): void;
    protected abstract canFetchImages(target: Target): boolean;
    /**
     * @param extent - The extent to test.
     * @returns `true` if this layer contains the specified extent, `false` otherwise.
     */
    contains(extent: Extent): boolean;
    abstract getRenderTargetPixelFormat(): PixelFormat;
    abstract getRenderTargetDataType(): TextureDataType;
    /**
     * @param target - The render target to release.
     */
    private releaseRenderTarget;
    /**
     * @param width - Width
     * @param height - Height
     * @returns The render target.
     */
    private acquireRenderTarget;
    protected deleteUnusedTargets(): void;
    postUpdate(): void;
    /**
     * @internal
     */
    get composer(): Readonly<LayerComposer | null>;
    protected updateMaterial(material: Material): void;
    protected abstract applyTextureToNode(texture: TextureAndPitch, target: Target, isLastRender: boolean): void;
    protected abstract applyEmptyTextureToNode(target: Target): void;
    /**
     * Disposes the layer. This releases all resources held by this layer.
     */
    dispose(): void;
}
/**
 * Returns `true` if the given object is a {@link Layer}.
 */
export declare function isLayer(obj: unknown): obj is Layer;
export default Layer;
//# sourceMappingURL=Layer.d.ts.map