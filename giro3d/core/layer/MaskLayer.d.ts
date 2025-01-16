import { type Feature } from 'ol';
import { type Geometry } from 'ol/geom';
import { type TextureDataType } from 'three';
import ColorLayer from './ColorLayer';
import type { LayerOptions, LayerUserData, Target } from './Layer';
/**
 * Modes of the mask layer.
 */
declare enum MaskMode {
    /**
     * The mask is applied normally: transparents parts of the mask make the map transparent.
     */
    Normal = 1,
    /**
     * The mask is inverted: transparents parts of the mask make the map opaque.
     */
    Inverted = 2
}
export interface MaskLayerOptions extends LayerOptions {
    /**
     * How to interpret the mask.
     */
    maskMode?: MaskMode;
}
/**
 * A {@link ColorLayer} that can be used to mask parts of
 * a map. The source can be any source supported by the color layers.
 *
 */
declare class MaskLayer<UserData extends LayerUserData = LayerUserData> extends ColorLayer<UserData> {
    private _maskMode;
    /**
     * Read-only flag to check if a given object is of type MaskLayer.
     */
    readonly isMaskLayer: boolean;
    /**
     * Creates a mask layer.
     * It should be added in a `Map` to be displayed in the instance.
     * See the example for more information on layer creation.
     *
     * @param options - The layer options.
     */
    constructor(options: MaskLayerOptions);
    /**
     * Gets or set the mask mode.
     */
    get maskMode(): MaskMode;
    set maskMode(v: MaskMode);
    getRenderTargetDataType(): TextureDataType;
    applyEmptyTextureToNode(target: Target): void;
    getVectorFeaturesAtCoordinate(): Feature<Geometry>[];
    getVectorFeaturesInExtent(): Feature<Geometry>[];
}
declare function isMaskLayer(obj: unknown): obj is MaskLayer;
export default MaskLayer;
export { isMaskLayer, MaskMode };
//# sourceMappingURL=MaskLayer.d.ts.map