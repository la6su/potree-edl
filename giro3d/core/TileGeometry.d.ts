import type { Vector2 } from 'three';
import { BufferGeometry } from 'three';
import type HeightMap from './HeightMap';
import type MemoryUsage from './MemoryUsage';
import { type GetMemoryUsageContext } from './MemoryUsage';
export interface TileGeometryOptions {
    dimensions: Vector2;
    segments: number;
}
interface TileGeometryProperties {
    width: number;
    height: number;
    uvStepX: number;
    uvStepY: number;
    rowStep: number;
    columnStep: number;
    translateX: number;
    translateY: number;
    triangles: number;
    numVertices: number;
}
/**
 * The TileGeometry provides a new buffer geometry for each
 * {@link TileMesh} of a
 * {@link Map} object.
 *
 * It is implemented for performance using a rolling approach.
 * The rolling approach is a special case of the sliding window algorithm with
 * a single value window where we iterate (roll, slide) over the data array to
 * compute everything in a single pass (complexity O(n)).
 * By default it produces square geometries but providing different width and height
 * allows for rectangular tiles creation.
 *
 * ```js
 * // Inspired from Map.requestNewTile
 * const extent = new Extent('EPSG:3857', -1000, -1000, 1000, 1000);
 * const paramsGeometry = { extent, segment: 8 };
 * const geometry = new TileGeometry(paramsGeometry);
 * ```
 */
declare class TileGeometry extends BufferGeometry implements MemoryUsage {
    readonly isMemoryUsage: true;
    dimensions: Vector2;
    private _segments;
    props: TileGeometryProperties;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    /**
     * @param params - Parameters to construct the grid. Should contain an extent
     *  and a size, either a number of segment or a width and an height in pixels.
     */
    constructor(params: TileGeometryOptions);
    private updateProps;
    get segments(): number;
    set segments(v: number);
    /**
     * Resets all elevations to zero.
     */
    resetHeights(): void;
    /**
     * Applies the provided heightmap to vertices' z-coordinate.
     * @param heightMap - The heightmap buffer.
     * @param width - The width of the heightmap, in pixels.
     * @param height - The height of the heightmap, in pixels.
     * @param stride - The stride to use when sampling the heightmap buffer.
     * @param offsetScale - The offset/scale to apply to UV coordinate before sampling the heightmap.
     * @returns The min/max elevation values encountered while updating the mesh.
     */
    applyHeightMap(heightMap: HeightMap): {
        min: number;
        max: number;
    };
    /**
     * Construct a simple grid buffer geometry using a fast rolling approach.
     *
     * @param props - Properties of the TileGeometry grid, as prepared by this.prepare.
     */
    private computeBuffers;
}
export default TileGeometry;
//# sourceMappingURL=TileGeometry.d.ts.map