import { EventDispatcher, type Color, type DataTexture } from 'three';
import ColorMapMode from './ColorMapMode';
export type ColorMapEvents = {
    updated: unknown;
};
/**
 * Represents a 1D color gradient bounded by a `min` and `max` values.
 *
 * Whenever a color map is associated with a grayscale texture, the color intensity of the texture
 * is used a a parameter to sample the color gradient.
 *
 * **Important**: since this color map owns a texture, it is disposable. Don't forget to call
 * `dispose()` to free texture memory, when you're finished using the colormap.
 *
 * The `mode` property describes how the intensity of the pixel is interpreted:
 *
 * `Elevation` simply takes the intensity value of the pixel, `Slope` gets the slope of the
 * pixel (assuming it is an elevation texture), and `Aspect` gets the aspect (orientation from
 * the north) of the pixel (assuming it is an elevation texture).
 *
 * The `min` and `max` properties describe how the colormap is applied relative to the intensity of
 * the sampled pixel.
 *
 * Pixel intensities outside of those bounds will take the color of the bound that is the closest
 * (i.e if the intensity is greater than `max`, the color will be the rightmost color of the color
 * ramp).
 *
 * The `colors` property takes an array of colors. To create this array, you can use libraries such
 * as [`colormap`](https://www.npmjs.com/package/colormap) or [`chroma-js`](https://www.npmjs.com/package/chroma-js)
 * to generate the color ramp.
 *
 * To obtain a "discrete" color map, you should use a small number of colors in the ramp.
 * Conversely, to obtain a "linear", continuous color map, you should use a high number of colors,
 * typically 256 values.
 *
 * @example
 * // Create a color map for elevations between 0 and 2500 meters.
 * const colors = makeColorRamp(); // Use whatever library to generate the ramp.
 * const colorMap = new ColorMap(\{ colors, min: 0, max: 2500, mode: ColorMapMode.Elevation \});
 *
 * const texture = colorMap.getTexture();
 *
 * // Disable the color map.
 * colorMap.active = false;
 *
 * // When finished with this color map, dispose it.
 * colorMap.dispose();
 */
declare class ColorMap extends EventDispatcher<ColorMapEvents> {
    private _min;
    private _max;
    private _mode;
    private _colors;
    private _opacity;
    private _shouldRecreateTexture;
    private _cachedTexture;
    private _active;
    /**
     * Creates an instance of ColorMap.
     *
     * @param colors - The colors of this color map.
     * @param min - The lower bound of the color map range.
     * @param max - The upper bound of the color map range.
     * @param mode - The mode of the color map.
     */
    constructor(options: {
        /**
         * The colors of this color map.
         */
        colors: Color[];
        /**
         * The lower bound of the color map range.
         */
        min: number;
        /**
         * The upper bound of the color map range.
         */
        max: number;
        /**
         * The mode of the color map
         */
        mode?: ColorMapMode;
        /**
         * The opacity values of the color map. If defined, must have the same number of
         * values as the colors array.
         */
        opacities?: number[];
    });
    /**
     * Gets or sets the color map mode.
     *
     * @example
     * // Start with an elevation gradient, ranging from 100 to 1500 meters.
     * const colorMap = new ColorMap(\{ colors, min: 100, max: 1500, mode: ColorMapMode.Elevation \});
     *
     * // Change mode to slope, and set min and max to 0-90 degrees.
     * colorMap.mode = ColorMapMode.Slope;
     * colorMap.min = 0;
     * colorMap.max = 90;
     */
    get mode(): ColorMapMode;
    set mode(v: ColorMapMode);
    private notifyChange;
    /**
     * Enables or disables the color map.
     */
    get active(): boolean;
    set active(v: boolean);
    /**
     * Gets or sets the lower bound of the color map range.
     */
    get min(): number;
    set min(v: number);
    /**
     * Gets or sets the upper bound of the color map range.
     */
    get max(): number;
    set max(v: number);
    /**
     * Gets or sets the colors of the color map.
     *
     * Note: if there is already an array defined in the {@link opacity} property, and this array
     * does not have the same length as the new color array, then it will be removed.
     */
    get colors(): Color[];
    set colors(v: Color[]);
    /**
     * Gets or sets the opacity values of the color map.
     *
     * Note: if the provided array does not have the same length as the {@link colors} array,
     * an exception is raised.
     *
     * @defaultValue null
     */
    get opacity(): number[] | null;
    set opacity(v: number[] | null);
    /**
     * Samples the colormap for the given value.
     * @param value - The value to sample.
     * @returns The color at the specified value.
     */
    sample(value: number): Color;
    /**
     * Samples the transparency for the given value.
     * @param value - The value to sample.
     * @returns The color at the specified value.
     */
    sampleOpacity(value: number): number;
    /**
     * Returns a 1D texture containing the colors of this color map.
     *
     * @returns The resulting texture.
     */
    getTexture(): DataTexture;
    /**
     * Disposes the texture owned by this color map.
     */
    dispose(): void;
}
export { ColorMapMode };
export default ColorMap;
//# sourceMappingURL=ColorMap.d.ts.map