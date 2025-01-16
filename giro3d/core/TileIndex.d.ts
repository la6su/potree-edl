declare const TOP = 0;
declare const TOP_RIGHT = 1;
declare const RIGHT = 2;
declare const BOTTOM_RIGHT = 3;
declare const BOTTOM = 4;
declare const BOTTOM_LEFT = 5;
declare const LEFT = 6;
declare const TOP_LEFT = 7;
export interface Tile {
    /**
     * The unique ID of the tile.
     */
    id: number;
    /**
     * The tile's X coordinate in the grid.
     */
    x: number;
    /**
     * The tile's Y coordinate in the grid.
     */
    y: number;
    /**
     * The tile's Z coordinate (LOD) in the grid.
     */
    z: number;
}
export type NeighbourList<T extends Tile> = [
    T | null,
    T | null,
    T | null,
    T | null,
    T | null,
    T | null,
    T | null,
    T | null
];
export type Predicate<T extends Tile> = (tile: T) => boolean;
declare class TileIndex<T extends Tile> {
    tiles: Map<string, WeakRef<T>>;
    tilesById: Map<number, WeakRef<T>>;
    constructor();
    /**
     * Adds a tile to the index.
     *
     * @param tile - the tile to add.
     */
    addTile(tile: T): void;
    /**
     * Gets a tile by its ID.
     *
     * @param id - The ID.
     * @returns The found tile, otherwise undefined.
     */
    getTile(id: number): T | undefined;
    static getKey(x: number, y: number, z: number): string;
    /**
     * Returns an array containing the 8 possible neighbours of a tile.
     * A neighbor is a tile at the same level or higher level located according to the clock order
     * from north:
     *
     * ```
     * 7 : north west -- 0 : north -- 1 : north east
     * 6 : west       -- THE  TILE -- 2 : east
     * 5 : south west -- 4 : south -- 3 : south east
     * ```
     *
     * If there is no neighbor, if it isn't visible or if it is a smaller level one, return null.
     *
     * @param tile - the tile to query
     * @returns neighbors : Array of found neighbors
     */
    getNeighbours(tile: T, result: NeighbourList<T>, predicate?: Predicate<T>): NeighbourList<T>;
    static getParent(x: number, y: number, z: number): {
        x: number;
        y: number;
        z: number;
    } | null;
    update(): void;
    /**
     * Search for the specific tile by coordinates if any, or any valid ancestor.
     *
     * @param x - The tile X coordinate.
     * @param y - The tile Y coordinate.
     * @param z - The tile Z coordinate (zoom level).
     * @returns The matching tile if found, null otherwise.
     */
    searchTileOrAncestor(x: number, y: number, z: number, predicate?: Predicate<T>): T | null;
}
export default TileIndex;
export { BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, LEFT, RIGHT, TOP, TOP_LEFT, TOP_RIGHT };
//# sourceMappingURL=TileIndex.d.ts.map