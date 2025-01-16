import type { PixelFormat, Texture, TextureDataType } from 'three';
import type ElevationRange from '../ElevationRange';
import type Extent from '../geographic/Extent';
import type TileMesh from '../TileMesh';
import type { LayerEvents, LayerOptions, LayerUserData, Target, TextureAndPitch } from './Layer';
import Layer from './Layer';
export interface ElevationLayerOptions extends LayerOptions {
    /**
     * The minimal/maximal elevation values of this layer.
     * If unspecified, the layer will attempt to compute an approximation using downsampled data.
     */
    minmax?: ElevationRange;
}
/**
 * A layer that provides elevation data to display terrains.
 */
declare class ElevationLayer<UserData extends LayerUserData = LayerUserData> extends Layer<LayerEvents, UserData> {
    minmax: {
        min: number;
        max: number;
        isDefault?: boolean;
    };
    /**
     * Read-only flag to check if a given object is of type ElevationLayer.
     */
    readonly isElevationLayer: boolean;
    /**
     * Creates an elevation layer.
     * See the example for more information on layer creation.
     *
     * @param options - The layer options.
     */
    constructor(options: ElevationLayerOptions);
    getRenderTargetDataType(): TextureDataType;
    getRenderTargetPixelFormat(): PixelFormat;
    protected adjustExtent(extent: Extent): Extent;
    protected onInitialized(): Promise<void>;
    protected canFetchImages(): boolean;
    unregisterNode(node: TileMesh): void;
    private getMinMax;
    protected applyTextureToNode(textureAndPitch: TextureAndPitch, target: Target, isLastRender: boolean): void;
    protected applyEmptyTextureToNode(target: Target): void;
    protected onTextureCreated(texture: Texture): void;
}
/**
 * Returns `true` if the given object is a {@link ElevationLayer}.
 */
export declare function isElevationLayer(obj: unknown): obj is ElevationLayer;
export default ElevationLayer;
//# sourceMappingURL=ElevationLayer.d.ts.map