import type { ColorRepresentation, IUniform, Texture } from 'three';
import { Color, Matrix4, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three';
import ColorMap from '../core/ColorMap';
import type Extent from '../core/geographic/Extent';
import type ColorLayer from '../core/layer/ColorLayer';
import type { TextureAndPitch } from '../core/layer/Layer';
import OffsetScale from '../core/OffsetScale';
import { type VertexAttributeType } from './MaterialUtils';
/**
 * Specifies the way points are colored.
 */
export declare enum MODE {
    /** The points are colored using their own color */
    COLOR = 0,
    /** The points are colored using their intensity */
    INTENSITY = 1,
    /** The points are colored using their classification */
    CLASSIFICATION = 2,
    /** The points are colored using their normal */
    NORMAL = 3,
    /** The points are colored using an external texture, such as a color layer */
    TEXTURE = 4,
    /** The points are colored using their elevation */
    ELEVATION = 5
}
export type Mode = (typeof MODE)[keyof typeof MODE];
/**
 * Paremeters for a point cloud classification.
 */
export declare class Classification {
    /**
     * The color of this classification.
     */
    color: Color;
    /**
     * Toggles the visibility of points with this classification.
     */
    visible: boolean;
    constructor(color: ColorRepresentation, visible?: boolean);
    /**
     * Clones this classification.
     * @returns The cloned object.
     */
    clone(): Classification;
}
/**
 * A set of 256 pre-defined classifications following the ASPRS scheme, with pre-defined colors for
 * classifications 0 to 18. The remaining classifications have the default color (#FF8100)
 *
 * See https://www.asprs.org/wp-content/uploads/2010/12/LAS_Specification.pdf
 */
export declare const ASPRS_CLASSIFICATIONS: Classification[];
export interface PointCloudMaterialOptions {
    /**
     * The point size.
     *
     * @defaultValue 0
     */
    size?: number;
    /**
     * The point decimation.
     *
     * @defaultValue 1
     */
    decimation?: number;
    /**
     * An additional color to use.
     *
     * @defaultValue `new Vector4(0, 0, 0, 0)`
     */
    overlayColor?: Vector4;
    /**
     * Specifies the criterion to colorize points.
     *
     * @defaultValue MODE.COLOR
     */
    mode?: Mode;
}
type Deformation = {
    transformation: Matrix4;
    origin: Vector2;
    influence: Vector2;
    color: Color;
    vec: Vector3;
};
type ColorMapUniform = {
    min: number;
    max: number;
    lut: Texture;
};
interface Uniforms {
    opacity: IUniform<number>;
    brightnessContrastSaturation: IUniform<Vector3>;
    size: IUniform<number>;
    decimation: IUniform<number>;
    mode: IUniform<MODE>;
    pickingId: IUniform<number>;
    overlayColor: IUniform<Vector4>;
    hasOverlayTexture: IUniform<number>;
    overlayTexture: IUniform<Texture | null>;
    offsetScale: IUniform<OffsetScale>;
    extentBottomLeft: IUniform<Vector2>;
    extentSize: IUniform<Vector2>;
    colorMap: IUniform<ColorMapUniform>;
    classifications: IUniform<Classification[]>;
    enableDeformations: IUniform<boolean>;
    deformations: IUniform<Deformation[]>;
    fogDensity: IUniform<number>;
    fogNear: IUniform<number>;
    fogFar: IUniform<number>;
    fogColor: IUniform<Color>;
}
export type Defines = {
    NORMAL?: 1;
    CLASSIFICATION?: 1;
    DEFORMATION_SUPPORT?: 1;
    NUM_TRANSFO?: number;
    USE_LOGDEPTHBUF?: 1;
    NORMAL_OCT16?: 1;
    NORMAL_SPHEREMAPPED?: 1;
    INTENSITY?: 1;
    INTENSITY_TYPE: VertexAttributeType;
};
/**
 * Material used for point clouds.
 */
declare class PointCloudMaterial extends ShaderMaterial {
    readonly isPointCloudMaterial = true;
    colorLayer: ColorLayer | null;
    disposed: boolean;
    private _colorMap;
    /**
     * @internal
     */
    readonly uniforms: Uniforms;
    /**
     * @internal
     */
    readonly defines: Defines;
    /**
     * Gets or sets the point size.
     */
    get size(): number;
    set size(value: number);
    /**
     * Gets or sets the point decimation value.
     * A decimation value of N means that we take every Nth point and discard the rest.
     */
    get decimation(): number;
    set decimation(value: number);
    /**
     * Gets or sets the display mode (color, classification...)
     */
    get mode(): Mode;
    set mode(mode: Mode);
    /**
     * @internal
     */
    get pickingId(): number;
    /**
     * @internal
     */
    set pickingId(id: number);
    /**
     * Gets or sets the overlay color (default color).
     */
    get overlayColor(): Vector4;
    set overlayColor(color: Vector4);
    /**
     * Gets or sets the brightness of the points.
     */
    get brightness(): number;
    set brightness(v: number);
    /**
     * Gets or sets the contrast of the points.
     */
    get contrast(): number;
    set contrast(v: number);
    /**
     * Gets or sets the saturation of the points.
     */
    get saturation(): number;
    set saturation(v: number);
    /**
     * Gets or sets the classifications of the points.
     * Up to 256 values are supported (i.e classifications in the range 0-255).
     * @defaultValue {@link ASPRS_CLASSIFICATIONS} (see https://www.asprs.org/wp-content/uploads/2010/12/LAS_Specification.pdf)
     */
    get classifications(): Classification[];
    set classifications(classifications: Classification[]);
    /**
     * @internal
     */
    get enableClassification(): boolean;
    /**
     * @internal
     */
    set enableClassification(enable: boolean);
    get colorMap(): ColorMap;
    set colorMap(colorMap: ColorMap);
    /**
     * Creates a PointsMaterial using the specified options.
     *
     * @param options - The options.
     */
    constructor(options?: PointCloudMaterialOptions);
    dispose(): void;
    clone(): this;
    /**
     * Internally used for picking.
     * @internal
     */
    enablePicking(picking: number): void;
    hasColorLayer(layer: ColorLayer): boolean;
    updateUniforms(): void;
    onBeforeRender(): void;
    update(source?: PointCloudMaterial): this;
    removeColorLayer(): void;
    pushColorLayer(layer: ColorLayer, extent: Extent): void;
    indexOfColorLayer(layer: ColorLayer): 0 | -1;
    getColorTexture(layer: ColorLayer): Texture | null;
    setColorTextures(layer: ColorLayer, textureAndPitch: TextureAndPitch): void;
    setLayerVisibility(): void;
    setLayerOpacity(): void;
    setLayerElevationRange(): void;
    setColorimetry(layer: ColorLayer, brightness: number, contrast: number, saturation: number): void;
    /**
     * Unused for now.
     * @internal
     */
    enableTransfo(v: boolean): void;
    static isPointCloudMaterial: (obj: unknown) => obj is PointCloudMaterial;
}
export default PointCloudMaterial;
//# sourceMappingURL=PointCloudMaterial.d.ts.map