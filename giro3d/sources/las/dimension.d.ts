import type { Dimension } from 'copc';
import type { Box3 } from 'three';
import type { PointCloudAttribute } from '../PointCloudSource';
import type { DimensionFilter } from './filter';
export type DimensionName = 'X' | 'Y' | 'Z' | 'Intensity' | 'ReturnNumber' | 'NumberOfReturns' | 'ScanDirectionFlag' | 'EdgeOfFlightLine' | 'Classification' | 'ScanAngle' | 'ScanAngleRank' | 'Red' | 'Green' | 'Blue' | 'UserData' | 'ScannerChannel' | 'PointSourceId' | 'Infrared' | 'ScanChannel' | 'ScannerChannel' | 'GpsTime';
/**
 * Default min/max values for various LAS dimensions. Most default values are directly dependent on
 * the data type of the dimension (e.g a `Uint8` dimensions will have a default range of 0-255), but
 * some dimensions have narrower min/max, for example `ScanAngle`:
 *
 * ```js
 * // Get the default min/max for return number
 * const { min, max } = DEFAULT_VALUE_RANGES['ReturnNumber'];
 * // { min: 0, max: 8 }
 * ```
 */
export declare const DEFAULT_VALUE_RANGES: Record<DimensionName, {
    min?: number;
    max?: number;
}>;
/**
 * Extracts attributes from LAS dimensions.
 */
export declare function extractAttributes(dimensions: Dimension.Map, volume: Box3, compressColors: boolean, gpsTimeRange: [number, number] | null): PointCloudAttribute[];
/**
 * Return all the dimensions that we expect to read from a given view. The dimensions are the union
 * of the required dimensions (the X, Y, Z dimension), the optional requested attribute, and all the
 * dimensions that are concerned by filters, if any.
 *
 * For example: if we want to read intensities, but exclude some classifications and GPS time, we
 * have to read dimensions:
 * - `X`, `Y`, `Z` for the point position,
 * - `Intensity` for the requested attribute
 * - `Classification` and `GpsTime` for filtering.
 */
export declare function getDimensionsToRead(attribute: PointCloudAttribute | undefined, readPosition: boolean, filters: DimensionFilter[]): DimensionName[];
//# sourceMappingURL=dimension.d.ts.map