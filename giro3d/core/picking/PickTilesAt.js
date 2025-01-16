import { Color, FloatType, Vector2, Vector3 } from 'three';
import RenderingState from '../../renderer/RenderingState';
import Coordinates from '../geographic/Coordinates';
import traversePickingCircle from './PickingCircle';

/** Pick result on tiles (e.g. map) */

/**
 * Tests whether an object implements {@link MapPickResult}.
 *
 * @param obj - Object
 * @returns `true` if the object implements the interface.
 */
export const isMapPickResult = obj => obj.isMapPickResult;
const BLACK = new Color(0, 0, 0);
const tmpCoords = new Coordinates('EPSG:3857', 0, 0, 0);
function renderTileBuffer(instance, map, coords, radius) {
  const dim = instance.engine.getWindowSize();
  coords = coords || new Vector2(Math.floor(dim.x / 2), Math.floor(dim.y / 2));
  const restore = map.setRenderState(RenderingState.PICKING);
  const buffer = instance.engine.renderToBuffer({
    camera: instance.view.camera,
    scene: map.object3d,
    clearColor: BLACK,
    datatype: FloatType,
    zone: {
      x: coords.x - radius,
      y: coords.y - radius,
      width: 1 + radius * 2,
      height: 1 + radius * 2
    }
  });
  restore();
  const ids = [];
  const uvs = [];
  const zs = [];
  traversePickingCircle(radius, (x, y, idx) => {
    const px = idx * 4;
    const id = buffer[px + 0];
    const z = buffer[px + 1];
    const u = buffer[px + 2];
    const v = buffer[px + 3];
    ids.push(id);
    zs.push(z);
    uvs.push(new Vector2(u, v));
    return null;
  });
  return {
    ids,
    uvs,
    zs
  };
}

/**
 * Pick tiles from a map object. This does not do any sorting
 *
 * @param instance - Instance to pick from
 * @param canvasCoords - Coordinates on the rendering canvas
 * @param map - Map object to pick from
 * @param options - Options
 * @returns Target
 */
function pickTilesAt(instance, canvasCoords, map, options = {}) {
  const radius = options.radius ?? 0;
  const limit = options.limit ?? Infinity;
  const filter = options.filter;
  const target = [];
  const {
    ids,
    uvs,
    zs
  } = renderTileBuffer(instance, map, canvasCoords, radius);
  const extent = map.extent;
  const crs = extent.crs;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const uv = uvs[i];
    const z = zs[i];
    const tile = map.tileIndex.getTile(id);
    if (tile != null && tile.isTileMesh) {
      const ex = tile.extent;
      tmpCoords.set(crs, ex.west + uv.x * (ex.east - ex.west), ex.south + uv.y * (ex.north - ex.south), 0);
      const elevation = z;
      if (elevation != null) {
        tmpCoords.values[2] = elevation;
        // convert to instance crs
        // here (and only here) should be the Coordinates instance creation
        const coord = tmpCoords.as(instance.referenceCrs);
        const point = tmpCoords.toVector3(new Vector3());
        const p = {
          isMapPickResult: true,
          object: tile,
          entity: map,
          point,
          coord,
          distance: instance.view.camera.position.distanceTo(point)
        };
        if (!filter || filter(p)) {
          target.push(p);
          if (target.length >= limit) {
            break;
          }
        }
      }
    }
  }
  return target;
}
export default pickTilesAt;