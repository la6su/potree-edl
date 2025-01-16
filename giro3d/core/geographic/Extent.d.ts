import type { TypedArray } from 'three';
import { Box3, Vector2, Vector3 } from 'three';
import OffsetScale from '../OffsetScale';
import Coordinates from './Coordinates';
export declare function reasonnableEpsilonForCRS(crs: string, width: number, height: number): number;
/**
 * Possible values to define an extent.
 *  The following combinations are supported:
 * - 2 coordinates for the min and max corners of the extent
 * - 4 numerical values for the `minx`, `maxx`, `miny`, `maxy`
 * - an object with `west`, `east`, `south`, `north` properties
 */
export type ExtentParameters = [Coordinates, Coordinates] | [number, number, number, number] | [{
    west: number;
    east: number;
    south: number;
    north: number;
}];
/**
 * An object representing a spatial extent. It encapsulates a Coordinate Reference System id (CRS)
 * and coordinates.
 *
 * It leverages [proj4js](https://github.com/proj4js/proj4js) to do the heavy-lifting of defining
 * and transforming coordinates between reference systems. As a consequence, every EPSG code known
 * by proj4js can be used out of the box, as such:
 *
 *     // an extent defined by bottom-left longitude 0 and latitude 0 and top-right longitude 1 and
 *     // latitude 1
 *     const extent = new Extent('EPSG:4326', 0, 0, 1, 1);
 *
 * For other EPSG codes, you must register them with `Instance.registerCRS()` :
 *
 * ```js
 *     Instance.registerCRS('EPSG:3946',
 *         '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 + \
 *         ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
 *
 *     extent = new Extent(
 *                  'EPSG:3946',
 *                  1837816.94334, 1847692.32501,
 *                  5170036.4587, 5178412.82698);
 * ```
 */
declare class Extent {
    private readonly _values;
    private _crs;
    /**
     * Constructs an Extent object.
     *
     * @param crs - The CRS code the coordinates are expressed in. Every EPSG code known by
     * [proj4js](https://github.com/proj4js/proj4js) can be used directly.
     * For others, you must manually register them.
     * Please refer to [proj4js](https://github.com/proj4js/proj4js) doc for more information.
     * @param values - The extent values.
     */
    constructor(crs: string, ...values: ExtentParameters);
    /**
     * Returns an extent centered at the specified coordinate, and with the specified size.
     *
     * @param crs - The CRS identifier.
     * @param center - The center.
     * @param width - The width, in CRS units.
     * @param height - The height, in CRS units.
     * @returns The produced extent.
     */
    static fromCenterAndSize(crs: string, center: {
        x: number;
        y: number;
    }, width: number, height: number): Extent;
    get values(): Float64Array;
    /**
     * Returns `true` if the two extents are equal.
     *
     * @param other - The extent to compare.
     * @param epsilon - The optional comparison epsilon.
     * @returns `true` if the extents are equal, otherwise `false`.
     */
    equals(other: Extent, epsilon?: number): boolean;
    /**
     * Checks the validity of the extent.
     *
     * @returns `true` if the extent is valid, `false` otherwise.
     */
    isValid(): boolean;
    /**
     * Clones this object.
     *
     * @returns a copy of this object.
     */
    clone(): Extent;
    /**
     * Returns an extent with a relative margin added.
     *
     * @param marginRatio - The margin, in normalized value ([0, 1]).
     * A margin of 1 means 100% of the width or height of the extent.
     * @example
     * const extent = new Extent('EPSG:3857', 0, 100, 0, 100);
     * const margin = extent.withRelativeMargin(0.1);
     * //  new Extent('EPSG:3857', -10, 110, -10, 110);
     * @returns a new extent with a specified margin applied.
     */
    withRelativeMargin(marginRatio: number): Extent;
    /**
     * Returns an extent with a margin.
     *
     * @param x - The horizontal margin, in CRS units.
     * @param y - The vertical margin, in CRS units.
     * @example
     * const extent = new Extent('EPSG:3857', 0, 100, 0, 100);
     * const margin = extent.withMargin(10, 15);
     * //  new Extent('EPSG:3857', -10, 110, -15, 115);
     * @returns a new extent with a specified margin applied.
     */
    withMargin(x: number, y: number): Extent;
    /**
     * Converts this extent into another CRS.
     * If `crs` is the same as the current CRS, the original object is returned.
     *
     * @param crs - the new CRS
     * @returns the converted extent.
     */
    as(crs: string): this | Extent;
    offsetToParent(other: Extent, target?: OffsetScale): OffsetScale;
    /**
     * @returns the horizontal coordinate of the westernmost side
     */
    get west(): number;
    /**
     * @returns the horizontal coordinate of the easternmost side
     */
    get east(): number;
    /**
     * @returns the horizontal coordinate of the northernmost side
     */
    get north(): number;
    /**
     * @returns the horizontal coordinate of the southermost side
     */
    get south(): number;
    /**
     * @returns the coordinates of the top left corner
     */
    topLeft(): Coordinates;
    /**
     * @returns the coordinates of the top right corner
     */
    topRight(): Coordinates;
    /**
     * @returns the coordinates of the bottom right corner
     */
    bottomRight(): Coordinates;
    /**
     * @returns the coordinates of the bottom right corner
     */
    bottomLeft(): Coordinates;
    /**
     * Gets the coordinate reference system of this extent.
     */
    get crs(): string;
    /**
     * Sets `target` with the center of this extent.
     *
     * @param target - the coordinate to set with the center's coordinates.
     * If none provided, a new one is created.
     * @returns the modified object passed in argument.
     */
    center(target?: Coordinates): Coordinates;
    /**
     * Sets `target` with the center of this extent.
     *
     * @param target - the vector to set with the center's coordinates.
     * If none provided, a new one is created.
     * @returns the modified object passed in argument.
     */
    centerAsVector2(target?: Vector2): Vector2;
    /**
     * Sets `target` with the center of this extent.
     * Note: The z coordinate of the resulting vector will be set to zero.
     *
     * @param target - the vector to set with the center's coordinates.
     * If none provided, a new one is created.
     * @returns the modified object passed in argument.
     */
    centerAsVector3(target?: Vector3): Vector3;
    /**
     * Sets the target with the width and height of this extent.
     * The `x` property will be set with the width,
     * and the `y` property will be set with the height.
     *
     * @param target - the optional target to set with the result.
     * @returns the modified object passed in argument,
     * or a new object if none was provided.
     */
    dimensions(target?: Vector2): Vector2;
    /**
     * Checks whether the specified coordinate is inside this extent.
     *
     * @param coord - the coordinate to test
     * @param epsilon - the precision delta (+/- epsilon)
     * @returns `true` if the coordinate is inside the bounding box
     */
    isPointInside(coord: Coordinates, epsilon?: number): boolean;
    /**
     * Tests whether this extent is contained in another extent.
     *
     * @param other - the other extent to test
     * @param epsilon - the precision delta (+/- epsilon).
     * If this value is not provided, a reasonable epsilon will be computed.
     * @returns `true` if this extent is contained in the other extent.
     */
    isInside(other: Extent, epsilon?: number | null): boolean;
    /**
     * Returns `true` if this bounding box intersect with the bouding box parameter
     *
     * @param bbox - the bounding box to test
     * @returns `true` if this bounding box intersects with the provided bounding box
     */
    intersectsExtent(bbox: Extent): boolean;
    /**
     * Set this extent to the intersection of itself and other
     *
     * @param other - the bounding box to intersect
     * @returns the modified extent
     */
    intersect(other: Extent): this;
    /**
     * Returns an extent that is adjusted so that its edges land exactly at the border
     * of the grid pixels. Optionally, you can specify the minimum pixel size of the
     * resulting extent.
     *
     * @param gridExtent - The grid extent.
     * @param gridWidth - The grid width, in pixels.
     * @param gridHeight - The grid height, in pixels.
     * @param minPixWidth - The minimum width, in pixels, of the resulting extent.
     * @param minPixHeight - The minimum height, in pixels, of the resulting extent.
     * @returns The adjusted extent and pixel
     * size of the adjusted extent.
     */
    fitToGrid(gridExtent: Extent, gridWidth: number, gridHeight: number, minPixWidth?: number, minPixHeight?: number): {
        extent: Extent;
        width: number;
        height: number;
    };
    /**
     * Set the coordinate reference system and values of this
     * extent.
     *
     * @param crs - the new CRS
     * @param values - the new values
     * @returns this object modified
     */
    set(crs: string, ...values: ExtentParameters): this;
    copy(other: Extent): this;
    /** @internal */
    static unionMany(...extents: Extent[]): Extent | null;
    union(extent: Extent | null | undefined): void;
    /**
     * Expands the extent to contain the specified coordinates.
     *
     * @param coordinates - The coordinates to include
     */
    expandByPoint(coordinates: Coordinates): void;
    /**
     * Moves the extent by the provided `x` and `y` values.
     *
     * @param x - the horizontal shift
     * @param y - the vertical shift
     * @returns the modified extent.
     */
    shift(x: number, y: number): this;
    /**
     * Constructs an extent from the specified box.
     *
     * @param crs - the coordinate reference system of the new extent.
     * @param box - the box to read values from
     * @returns the constructed extent.
     */
    static fromBox3(crs: string, box: Box3): Extent;
    /**
     * Returns a [Box3](https://threejs.org/docs/?q=box3#api/en/math/Box3) that matches this extent.
     *
     * @param minHeight - The min height of the box.
     * @param maxHeight - The max height of the box.
     * @returns The box.
     */
    toBox3(minHeight: number, maxHeight: number): Box3;
    /**
     * Returns the normalized offset from bottom-left in extent of this Coordinates
     *
     * @param coordinate - the coordinate
     * @param target - optional `Vector2` target.
     * If not present a new one will be created.
     * @returns normalized offset in extent
     * @example
     * extent.offsetInExtent(extent.center())
     * // returns `(0.5, 0.5)`.
     */
    offsetInExtent(coordinate: Coordinates, target?: Vector2): Vector2;
    /**
     * Divides this extent into a regular grid.
     * The number of points in each direction is equal to the number of subdivisions + 1.
     * The points are laid out row-wise, from west to east, and north to south:
     *
     * ```
     * 1 -- 2
     * |    |
     * 3 -- 4
     * ```
     *
     * @param xSubdivs - The number of grid subdivisions in the x-axis.
     * @param ySubdivs - The number of grid subdivisions in the y-axis.
     * @param target - The array to fill.
     * @param stride - The number of elements per item (2 for XY, 3 for XYZ).
     * @returns the target.
     */
    toGrid<T extends TypedArray>(xSubdivs: number, ySubdivs: number, target: T, stride: number): T;
    /**
     * Subdivides this extents into x and y subdivisions.
     *
     * Notes:
     * - Subdivisions must be strictly positive.
     * - If both subvisions are `1`, an array of one element is returned,
     *  containing a copy of this extent.
     *
     * @param xSubdivs - The number of subdivisions on the X/longitude axis.
     * @param ySubdivs - The number of subdivisions on the Y/latitude axis.
     * @returns the resulting extents.
     * @example
     * const extent = new Extent('EPSG:3857', 0, 100, 0, 100);
     * extent.split(2, 1);
     * // [0, 50, 0, 50], [50, 100, 50, 100]
     */
    split(xSubdivs: number, ySubdivs: number): Extent[];
    /**
     * The bounds of the Web Mercator (EPSG:3857) projection.
     */
    static get webMercator(): Extent;
    /**
     * The bounds of the whole world in the EPSG:4326 projection.
     */
    static get WGS84(): Extent;
}
export default Extent;
//# sourceMappingURL=Extent.d.ts.map