import type { IUniform, Side, Texture, TextureDataType, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';
import { Color, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three';
import type ColorimetryOptions from '../core/ColorimetryOptions';
import type ColorMapMode from '../core/ColorMapMode';
import type ContourLineOptions from '../core/ContourLineOptions';
import type ElevationRange from '../core/ElevationRange';
import type GraticuleOptions from '../core/GraticuleOptions';
import type HillshadingOptions from '../core/HillshadingOptions';
import type BlendingMode from '../core/layer/BlendingMode';
import type ColorLayer from '../core/layer/ColorLayer';
import type ElevationLayer from '../core/layer/ElevationLayer';
import type Layer from '../core/layer/Layer';
import type { TextureAndPitch } from '../core/layer/Layer';
import type { MaskMode } from '../core/layer/MaskLayer';
import type MemoryUsage from '../core/MemoryUsage';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import OffsetScale from '../core/OffsetScale';
import type TerrainOptions from '../core/TerrainOptions';
import type { AtlasInfo } from './AtlasBuilder';
import type ColorMapAtlas from './ColorMapAtlas';
import WebGLComposer from './composition/WebGLComposer';
import RenderingState from './RenderingState';
export declare const DEFAULT_OUTLINE_COLOR = "red";
export declare const DEFAULT_HILLSHADING_INTENSITY = 1;
export declare const DEFAULT_HILLSHADING_ZFACTOR = 1;
export declare const DEFAULT_AZIMUTH = 135;
export declare const DEFAULT_ZENITH = 45;
export declare const DEFAULT_GRATICULE_COLOR: Color;
export declare const DEFAULT_GRATICULE_STEP = 500;
export declare const DEFAULT_GRATICULE_THICKNESS = 1;
export interface MaterialOptions {
    /**
     * Discards no-data pixels.
     */
    discardNoData: boolean;
    /**
     * Geometric terrain options.
     */
    terrain: Required<TerrainOptions>;
    /**
     * Colorimetry options for the entire material.
     */
    colorimetry: Required<ColorimetryOptions>;
    /**
     * The sidedness.
     */
    side: Side;
    /**
     * Contour lines options.
     */
    contourLines: Required<ContourLineOptions>;
    /**
     * Hillshading options.
     */
    hillshading: Required<HillshadingOptions>;
    /**
     * Graticule options.
     */
    graticule: Required<GraticuleOptions>;
    /**
     * The number of subdivision segments per tile.
     */
    segments: number;
    /**
     * The elevation range.
     */
    elevationRange: {
        min: number;
        max: number;
    } | null;
    /**
     * The colormap atlas.
     */
    colorMapAtlas: ColorMapAtlas | null;
    /**
     * The background color.
     */
    backgroundColor: Color;
    /**
     * The background opacity.
     */
    backgroundOpacity: number;
    /**
     * Show the outlines of tile meshes.
     */
    showTileOutlines: boolean;
    /**
     * The tile outline color.
     * @defaultValue {@link DEFAULT_OUTLINE_COLOR}
     */
    tileOutlineColor: Color;
    /**
     * Force using texture atlases even when not required by WebGL limitations.
     */
    forceTextureAtlases: boolean;
    /**
     * Displays the collider meshes used for raycast.
     */
    showColliderMeshes: boolean;
    depthTest: boolean;
}
type HillshadingUniform = {
    intensity: number;
    zFactor: number;
    zenith: number;
    azimuth: number;
};
type ContourLineUniform = {
    thickness: number;
    primaryInterval: number;
    secondaryInterval: number;
    color: Vector4;
};
type GraticuleUniform = {
    thickness: number;
    /** xOffset, yOffset, xStep, yStep */
    position: Vector4;
    color: Vector4;
};
type LayerUniform = {
    offsetScale: Vector4;
    color: Vector4;
    textureSize: Vector2;
    elevationRange: Vector2;
    brightnessContrastSaturation: Vector3;
};
type ColorLayerUniform = LayerUniform & {
    mode: 0 | MaskMode;
    blendingMode: BlendingMode;
};
type NeighbourUniform = {
    offsetScale: Vector4 | null;
    diffLevel: number;
};
type ColorMapUniform = {
    mode: ColorMapMode | 0;
    min: number;
    max: number;
    offset: number;
};
type Defines = {
    ENABLE_CONTOUR_LINES?: 1;
    STITCHING?: 1;
    TERRAIN_DEFORMATION?: 1;
    DISCARD_NODATA_ELEVATION?: 1;
    ENABLE_ELEVATION_RANGE?: 1;
    ELEVATION_LAYER?: 1;
    ENABLE_LAYER_MASKS?: 1;
    ENABLE_OUTLINES?: 1;
    ENABLE_HILLSHADING?: 1;
    APPLY_SHADING_ON_COLORLAYERS?: 1;
    ENABLE_GRATICULE?: 1;
    USE_ATLAS_TEXTURE?: 1;
    /** The number of _visible_ color layers */
    VISIBLE_COLOR_LAYER_COUNT: number;
};
interface Uniforms {
    opacity: IUniform<number>;
    segments: IUniform<number>;
    tileOutlineColor: IUniform<Color>;
    contourLines: IUniform<ContourLineUniform>;
    graticule: IUniform<GraticuleUniform>;
    hillshading: IUniform<HillshadingUniform>;
    elevationRange: IUniform<Vector2>;
    tileDimensions: IUniform<Vector2>;
    elevationTexture: IUniform<Texture | null>;
    atlasTexture: IUniform<Texture | null>;
    colorTextures: IUniform<Texture[]>;
    uuid: IUniform<number>;
    backgroundColor: IUniform<Vector4>;
    layers: IUniform<ColorLayerUniform[]>;
    elevationLayer: IUniform<LayerUniform>;
    brightnessContrastSaturation: IUniform<Vector3>;
    renderingState: IUniform<RenderingState>;
    neighbours: IUniform<NeighbourUniform[]>;
    neighbourTextures: IUniform<(Texture | null)[]>;
    colorMapAtlas: IUniform<Texture | null>;
    layersColorMaps: IUniform<ColorMapUniform[]>;
    elevationColorMap: IUniform<ColorMapUniform>;
    fogDensity: IUniform<number>;
    fogNear: IUniform<number>;
    fogFar: IUniform<number>;
    fogColor: IUniform<Color>;
}
declare class LayeredMaterial extends ShaderMaterial implements MemoryUsage {
    readonly isMemoryUsage: true;
    private readonly _getIndexFn;
    private readonly _renderer;
    private readonly _colorLayers;
    private readonly _atlasInfo;
    private readonly _forceTextureAtlas;
    private readonly _maxTextureImageUnits;
    private readonly _texturesInfo;
    private _elevationLayer;
    private _mustUpdateUniforms;
    private _needsSorting;
    private _needsAtlasRepaint;
    private _composer;
    private _colorMapAtlas;
    private _composerDataType;
    readonly uniforms: Uniforms;
    readonly defines: Defines;
    private _options?;
    private _hasElevationLayer;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    constructor(params: {
        /** the material options. */
        options: MaterialOptions;
        /** the WebGL renderer. */
        renderer: WebGLRenderer;
        /** The number of maximum texture units in fragment shaders */
        maxTextureImageUnits: number;
        /**  the Atlas info */
        atlasInfo: AtlasInfo;
        /** The function to help sorting color layers. */
        getIndexFn: (arg0: Layer) => number;
        /** The texture data type to be used for the atlas texture. */
        textureDataType: TextureDataType;
        hasElevationLayer: boolean;
    });
    /**
     * @param v - The number of segments.
     */
    set segments(v: number);
    updateNeighbour(neighbour: number, diffLevel: number, offsetScale: OffsetScale, texture: Texture | null): void;
    onBeforeCompile(parameters: WebGLProgramParametersWithUniforms): void;
    private updateColorLayerUniforms;
    dispose(): void;
    getColorTexture(layer: ColorLayer): Texture | null;
    private countIndividualTextures;
    onBeforeRender(): void;
    /**
     * Determine if this material should write to the color buffer.
     */
    private updateColorWrite;
    repaintAtlas(): void;
    setColorTextures(layer: ColorLayer, textureAndPitch: TextureAndPitch): void;
    pushElevationLayer(layer: ElevationLayer): void;
    removeElevationLayer(): void;
    setElevationTexture(layer: ElevationLayer, { texture, pitch }: {
        texture: Texture;
        pitch: OffsetScale;
    }, isFinal: boolean): Promise<boolean>;
    pushColorLayer(newLayer: ColorLayer): void;
    private getVisibleColorLayerCount;
    reorderLayers(): void;
    private sortLayersIfNecessary;
    removeColorLayer(layer: ColorLayer): void;
    /**
     * Sets the colormap atlas.
     *
     * @param atlas - The atlas.
     */
    setColorMapAtlas(atlas: ColorMapAtlas | null): void;
    private updateColorMaps;
    update(materialOptions?: MaterialOptions): boolean;
    private updateColorLayerCount;
    customProgramCacheKey(): string;
    createComposer(): WebGLComposer;
    private get composerWidth();
    private get composerHeight();
    rebuildAtlasIfNecessary(): boolean;
    private rebuildAtlasTexture;
    changeState(state: RenderingState): void;
    private updateBlendingMode;
    hasColorLayer(layer: ColorLayer): boolean;
    hasElevationLayer(layer: ElevationLayer): boolean;
    indexOfColorLayer(layer: ColorLayer): number;
    private updateOpacityParameters;
    setLayerOpacity(layer: ColorLayer, opacity: number): void;
    setLayerVisibility(layer: ColorLayer, visible: boolean): void;
    setLayerElevationRange(layer: ColorLayer, range: ElevationRange | null): void;
    setColorimetry(layer: ColorLayer, brightness: number, contrast: number, saturation: number): void;
    canProcessColorLayer(): boolean;
    isElevationLayerTextureLoaded(): boolean;
    getElevationTexture(): Texture | null;
    getElevationOffsetScale(): OffsetScale;
    isColorLayerTextureLoaded(layer: ColorLayer): boolean;
    /**
     * Gets the number of layers on this material.
     *
     * @returns The number of layers present on this material.
     */
    getLayerCount(): number;
    /**
     * Gets the progress of the loading of textures on this material.
     * The progress is the number of currently present textures divided
     * by the number of expected textures.
     */
    get progress(): number;
    get loading(): boolean;
    setUuid(uuid: number): void;
}
export default LayeredMaterial;
//# sourceMappingURL=LayeredMaterial.d.ts.map