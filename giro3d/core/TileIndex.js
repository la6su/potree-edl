const TOP = 0;
const TOP_RIGHT = 1;
const RIGHT = 2;
const BOTTOM_RIGHT = 3;
const BOTTOM = 4;
const BOTTOM_LEFT = 5;
const LEFT = 6;
const TOP_LEFT = 7;
class TileIndex {
  constructor() {
    this.tiles = new Map();
    this.tilesById = new Map();
  }

  /**
   * Adds a tile to the index.
   *
   * @param tile - the tile to add.
   */
  addTile(tile) {
    const key = TileIndex.getKey(tile.x, tile.y, tile.z);
    const wr = new WeakRef(tile);
    this.tiles.set(key, wr);
    this.tilesById.set(tile.id, wr);
  }

  /**
   * Gets a tile by its ID.
   *
   * @param id - The ID.
   * @returns The found tile, otherwise undefined.
   */
  getTile(id) {
    const entry = this.tilesById.get(id);
    if (entry) {
      const value = entry.deref();
      if (value) {
        return value;
      }
    }
    return undefined;
  }
  static getKey(x, y, z) {
    return `${x},${y},${z}`;
  }

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
  getNeighbours(tile, result, predicate) {
    const {
      x,
      y,
      z
    } = tile;
    result[TOP] = this.searchTileOrAncestor(x, y + 1, z, predicate);
    result[TOP_RIGHT] = this.searchTileOrAncestor(x + 1, y + 1, z, predicate);
    result[RIGHT] = this.searchTileOrAncestor(x + 1, y, z, predicate);
    result[BOTTOM_RIGHT] = this.searchTileOrAncestor(x + 1, y - 1, z, predicate);
    result[BOTTOM] = this.searchTileOrAncestor(x, y - 1, z, predicate);
    result[BOTTOM_LEFT] = this.searchTileOrAncestor(x - 1, y - 1, z, predicate);
    result[LEFT] = this.searchTileOrAncestor(x - 1, y, z, predicate);
    result[TOP_LEFT] = this.searchTileOrAncestor(x - 1, y + 1, z, predicate);
    return result;
  }
  static getParent(x, y, z) {
    if (z === 0) {
      return null;
    }
    const newX = Math.floor(x / 2);
    const newY = Math.floor(y / 2);
    return {
      x: newX,
      y: newY,
      z: z - 1
    };
  }
  update() {
    // Remove obsolete entries
    const keys = [...this.tiles.keys()];
    for (const key of keys) {
      const entry = this.tiles.get(key);
      if (entry && !entry.deref()) {
        this.tiles.delete(key);
      }
    }
    const ids = [...this.tilesById.keys()];
    for (const key of ids) {
      const entry = this.tilesById.get(key);
      if (entry && !entry.deref()) {
        this.tilesById.delete(key);
      }
    }
  }

  /**
   * Search for the specific tile by coordinates if any, or any valid ancestor.
   *
   * @param x - The tile X coordinate.
   * @param y - The tile Y coordinate.
   * @param z - The tile Z coordinate (zoom level).
   * @returns The matching tile if found, null otherwise.
   */
  searchTileOrAncestor(x, y, z, predicate) {
    const key = TileIndex.getKey(x, y, z);
    const entry = this.tiles.get(key);
    if (entry) {
      const n = entry.deref();
      if (n && (typeof predicate !== 'function' || predicate(n))) {
        return n;
      }
    }
    const parent = TileIndex.getParent(x, y, z);
    if (!parent) {
      return null;
    }
    return this.searchTileOrAncestor(parent.x, parent.y, parent.z, predicate);
  }
}
export default TileIndex;
export { BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, LEFT, RIGHT, TOP, TOP_LEFT, TOP_RIGHT };