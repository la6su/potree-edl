import { type TypedArray } from 'three';
import { type DimensionName } from '../las/dimension';
import type { PointCloudAttribute } from '../PointCloudSource';
import type BoundingBox from './BoundingBox';
/**
 * The names of attributes for legacy Potree point clouds (the ones with .bin files in a hierarchy).
 * For LAZ-based potree datasets, the names are the actual LAS dimension names.
 */
export type AttributeName = 'POSITION_CARTESIAN' | 'RGB_PACKED' | 'RGBA_PACKED' | 'COLOR_PACKED' | 'INTENSITY' | 'CLASSIFICATION' | 'RETURN_NUMBER' | 'NUMBER_OF_RETURNS' | 'GPS_TIME' | 'SOURCE_ID' | 'SPACING' | 'INDICES' | 'NORMAL_FLOATS' | 'NORMAL_SPHEREMAPPED' | 'NORMAL_OCT16' | 'NORMAL';
/**
 * A function that reads point at the given index, and fills the array with the point data.
 */
type Reader = (view: DataView, pointIndex: number, target: TypedArray) => void;
declare enum PotreeDataType {
    Uint8 = 0,
    Uint16 = 1,
    Uint32 = 2,
    Float = 3,
    Double = 4
}
export type PotreeAttribute = {
    type: PotreeDataType;
    dimension: 1 | 2 | 3 | 4;
    normalized: boolean;
    interpretation: PointCloudAttribute['interpretation'];
    min?: number;
    max?: number;
};
/**
 * Point cloud attribute for LAZ-based Potree datasets.
 */
export type LazPointCloudAttribute = PointCloudAttribute & {
    name: DimensionName | 'Color';
};
/**
 * Point cloud attribute for BIN-based Potree datasets.
 */
export type PotreePointCloudAttribute = PointCloudAttribute & {
    name: AttributeName;
    normalized: boolean;
    potreeAttribute: PotreeAttribute;
    offset: number;
};
/** The list of attributes that we expose to the API. */
export declare const EXPOSED_ATTRIBUTES: Set<AttributeName | DimensionName | 'Color'>;
export declare function createReader(attribute: PotreePointCloudAttribute, pointByteSize: number): Reader;
export declare function processLazAttributes(boundingBox: BoundingBox): LazPointCloudAttribute[];
/**
 * Given a list of attribute names, returns a list of actual attributes.
 */
export declare function processAttributes(names: Readonly<AttributeName[]>): {
    attributes: PotreePointCloudAttribute[];
    pointByteSize: number;
};
export declare function getTypedArray(type: PotreePointCloudAttribute['type'], size: PotreePointCloudAttribute['size'], dimension: PotreePointCloudAttribute['dimension'], itemCount: number): TypedArray;
export {};
//# sourceMappingURL=attributes.d.ts.map