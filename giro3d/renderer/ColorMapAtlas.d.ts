import { type Texture, type WebGLRenderer } from 'three';
import type ColorMap from '../core/ColorMap';
/**
 * Combines color map textures into a single one.
 * This is necessary to avoid consuming too many texture units.
 */
declare class ColorMapAtlas {
    private readonly _renderer;
    private readonly _colorMaps;
    private _texture;
    private _dirty;
    private _disposed;
    /**
     * @param renderer - The renderer
     */
    constructor(renderer: WebGLRenderer);
    /**
     * Adds a color map to the atlas.
     *
     * @param colorMap - The color map.
     */
    add(colorMap: ColorMap): void;
    /**
     * Removes a color map from the atlas.
     *
     * @param colorMap - The color map.
     */
    remove(colorMap: ColorMap): void;
    forceUpdate(): void;
    update(): void;
    private createTexture;
    /**
     * Gets the atlas texture.
     */
    get texture(): Texture | null;
    /**
     * Gets the vertical offset for the specified color map.
     *
     * @param colorMap - The color map.
     * @returns The offset.
     */
    getOffset(colorMap: ColorMap): number | undefined;
    dispose(): void;
}
export default ColorMapAtlas;
//# sourceMappingURL=ColorMapAtlas.d.ts.map