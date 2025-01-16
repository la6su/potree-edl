import { type ColorSpace } from 'three';
/**
 * Describes how an image pixel should be interpreted.
 *
 * Note: this is unrelated to the file format / encoding (like JPG and PNG). This interpretation
 * occurs after the image was decoded into a pixel buffer.
 */
declare enum Mode {
    Raw = 0,
    ScaleToMinMax = 2,
    CompressTo8Bit = 3
}
/**
 * The interpretation options.
 */
interface InterpretationOptions {
    negateValues?: boolean;
    min?: number;
    max?: number;
}
export type InterpretationUniform = {
    mode?: number;
    negateValues?: boolean;
    min?: number;
    max?: number;
};
/**
 * Describes how an image pixel should be interpreted. Any interpretation other than `Raw` will
 * apply a specific processing to every pixel of an image.
 *
 * Note: this is unrelated to the file format / encoding (like JPG and PNG). This interpretation
 * occurs after the image was decoded into a pixel buffer.
 *
 * ```js
 * // Use the raw interpretation
 * const raw = Interpretation.Raw;
 *
 * // Use the min/max scaling interpretation
 * const min = 234.22;
 * const max = 994.1;
 * const minmax = Interpretation.ScaleToMinMax(min, max);
 *
 * // Negates the sign of all pixel values, without any interpretation.
 * // This is useful if your dataset expressed depths (positive values going down) rather than
 * // heights (positive values going up).
 * const custom = new Interpretation(Mode.Raw, {
 *     negateValues: true,
 * })
 * ```
 */
declare class Interpretation {
    private readonly _mode;
    private readonly _opts;
    get options(): InterpretationOptions;
    /**
     * Creates a new interpretation.
     *
     * @param mode - The mode.
     * @param opts - The options.
     */
    constructor(mode: Mode, opts?: InterpretationOptions);
    /**
     * Gets the interpretation mode.
     */
    get mode(): Mode;
    /**
     * The min value (only for `MinMax` mode).
     */
    get min(): number | undefined;
    /**
     * The max value (only for `MinMax` mode).
     */
    get max(): number | undefined;
    /**
     * Gets or set the sign negation of elevation values. If `true`, reverses the sign of elevation
     * values, such that positive values are going downward, rather than updwards.
     * In other words, interpret values as depths rather than heights.
     */
    get negateValues(): boolean | undefined;
    set negateValues(v: boolean | undefined);
    /**
     * Returns `true` if this interpretation does not perform any transformation to source pixels.
     */
    isDefault(): boolean;
    /**
     * Reverses the sign of elevation values, such that positive values are going downward, rather
     * than updwards. In other words, interpret values as depths rather than heights.
     */
    withNegatedValues(): this;
    /**
     * Preset for raw. The pixel is used as is, without transformation.
     * Compatible with both grayscale and color images. This is the default.
     */
    static get Raw(): Interpretation;
    /**
     * Gets the color space required for a correct decoding of textures in this interpretation.
     * If color space cannot be determined, returns `undefined`.
     */
    get colorSpace(): ColorSpace | undefined;
    /**
     * Preset for scaling interpretation.
     *
     * Applies a scaling processing to pixels with the provided min/max values with the following
     * formula : `output = min + input * (max - min)`.
     *
     * Input can be either color or grayscale, and output will be either color or grayscale,
     * depending on input.
     *
     * Note: this is typically used to encode elevation data into a 8-bit grayscale image.
     *
     * @example
     * // We have a grayscale image that represents elevation data ranging from 130 to 1500 meters.
     * // Pixels with color 0 will map to 130 meters, and the pixels with color
     * // 255 will map to 1500 meters, and so on.
     * const interp = Interpretation.ScaleToMinMax(130, 1500);
     * @param min - The minimum value of the dataset, that maps to 0.
     * @param max - The maximum value of the dataset, that maps to 255.
     * @returns The scaling values.
     */
    static ScaleToMinMax(min: number, max: number): Interpretation;
    /**
     * Preset for compression.
     *
     * Compresses the input range into the 8-bit range. This is the inverse of
     * {@link Interpretation.ScaleToMinMax}.
     *
     * Note: this is typically used to visualize high dynamic range images, such as 32-bit data,
     * into the 8-bit range suitable for display.
     *
     * @example
     * // We have a 16-bit satellite image with min = 200, and max = 4000. We wish to visualize it
     * // without saturation.
     * const interp = Interpretation.CompressTo8Bit(200, 4000);
     * @param min - The minimum value of the dataset.
     * @param max - The maximum value of the dataset.
     * @returns The interpretation.
     */
    static CompressTo8Bit(min: number, max: number): Interpretation;
    /**
     * Returns a user-friendly string representation of this interpretation.
     */
    toString(): string;
    /**
     * @internal
     */
    setUniform(uniform: InterpretationUniform): InterpretationUniform;
}
export { InterpretationOptions, Mode };
export default Interpretation;
//# sourceMappingURL=Interpretation.d.ts.map