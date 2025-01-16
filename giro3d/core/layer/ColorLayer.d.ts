import { type Feature } from 'ol';
import { type PixelFormat, type TextureDataType } from 'three';
import type ColorimetryOptions from '../ColorimetryOptions';
import type ElevationRange from '../ElevationRange';
import type Coordinates from '../geographic/Coordinates';
import Extent from '../geographic/Extent';
import type PickableFeatures from '../picking/PickableFeatures';
import type PickOptions from '../picking/PickOptions';
import { type VectorPickFeature } from '../picking/PickResult';
import { type MapPickResult } from '../picking/PickTilesAt';
import BlendingMode from './BlendingMode';
import Layer, { type LayerEvents, type LayerNode, type LayerNodeMaterial, type LayerOptions, type LayerUserData, type Target, type TextureAndPitch } from './Layer';
export interface ColorLayerEvents extends LayerEvents {
    /** When the layer opacity changes */
    'opacity-property-changed': {
        opacity: number;
    };
    /** When the layer brightness changes */
    'brightness-property-changed': {
        brightness: number;
    };
    /** When the layer contrast changes */
    'contrast-property-changed': {
        contrast: number;
    };
    /** When the layer saturation changes */
    'saturation-property-changed': {
        saturation: number;
    };
    /** When the layer elevationRange property changes */
    'elevationRange-property-changed': {
        range: ElevationRange | null;
    };
    /** When the layer blendingMode property changes */
    'blendingMode-property-changed': {
        blendingMode: BlendingMode;
    };
}
export interface ColorLayerOptions extends LayerOptions {
    /**
     * An optional elevation range to limit the display of this layer.
     * This is only useful if there is also an elevation layer on the map.
     */
    elevationRange?: ElevationRange;
    /**
     * The opacity of the layer. Default is 1 (opaque).
     */
    opacity?: number;
    /**
     * The blending mode.
     * @defaultValue {@link BlendingMode.Normal}
     */
    blendingMode?: BlendingMode;
}
/**
 * A layer that produces color images, such as vector data, or satellite imagery.
 */
declare class ColorLayer<UserData extends LayerUserData = LayerUserData> extends Layer<ColorLayerEvents, UserData> implements PickableFeatures<VectorPickFeature, MapPickResult<VectorPickFeature>> {
    private _opacity;
    private _blendingMode;
    /**
     * Read-only flag to check if a given object is of type ColorLayer.
     */
    readonly isColorLayer: boolean;
    readonly isPickableFeatures = true;
    private _elevationRange;
    private _colorimetry;
    /**
     * Creates a color layer.
     * See the example for more information on layer creation.
     *
     * @param options - The layer options.
     */
    constructor(options: ColorLayerOptions);
    /**
     * Gets the elevation range of this layer, if any.
     */
    get elevationRange(): ElevationRange | null;
    /**
     * Sets the elevation range of this layer. Setting it to null removes the elevation range.
     */
    set elevationRange(range: ElevationRange | null);
    /**
     * Gets or sets the blending mode of this layer.
     */
    get blendingMode(): BlendingMode;
    set blendingMode(v: BlendingMode);
    /**
     * Gets or sets the opacity of this layer.
     */
    get opacity(): number;
    set opacity(v: number);
    /**
     * Gets the colorimetry parameters of this layer.
     */
    get colorimetry(): ColorimetryOptions;
    /**
     * Gets or sets the brightness of this layer.
     */
    get brightness(): number;
    set brightness(v: number);
    /**
     * Gets or sets the contrast of this layer.
     */
    get contrast(): number;
    set contrast(v: number);
    /**
     * Gets or sets the saturation of this layer.
     */
    get saturation(): number;
    set saturation(v: number);
    protected updateMaterial(material: LayerNodeMaterial): void;
    getRenderTargetDataType(): TextureDataType;
    getRenderTargetPixelFormat(): PixelFormat;
    protected canFetchImages(target: Target): boolean;
    unregisterNode(node: LayerNode): void;
    protected applyTextureToNode(result: TextureAndPitch, target: Target): void;
    protected applyEmptyTextureToNode(target: Target): void;
    pickFeaturesFrom(pickedResult: MapPickResult, options?: PickOptions): VectorPickFeature[];
    /**
     * Returns all features at some coordinates, with an optional hit tolerance radius.
     *
     * @param coordinate - Coordinates
     * @param options - Options
     * @returns Array of features at coordinates (can be empty)
     */
    getVectorFeaturesAtCoordinate(coordinate: Coordinates, options?: {
        /**
         * Radius in pixels.
         * Pixels inside the radius around the given coordinates will be checked for features.
         */
        radius?: number;
        /** Tile resolution (m/px) - only required if radius is greater than 0 */
        xTileRes?: number;
        /** Tile resolution (m/px) - only required if radius is greater than 0 */
        yTileRes?: number;
    }): Feature[];
    /**
     * Get all features whose bounding box intersects the provided extent.
     * Note that this returns an array of all features intersecting the given extent in random order
     * (so it may include features whose geometries do not intersect the extent).
     *
     * @param extent - Extent
     * @returns Array of features intersecting the extent (can be empty)
     */
    getVectorFeaturesInExtent(extent: Extent): Feature[];
}
/**
 * Returns `true` if the given object is a {@link ColorLayer}.
 */
export declare function isColorLayer(obj: unknown): obj is ColorLayer;
export default ColorLayer;
//# sourceMappingURL=ColorLayer.d.ts.map