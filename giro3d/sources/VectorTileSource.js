import OLVectorTileSourcce from 'ol/source/VectorTile.js';
import VectorTile from 'ol/VectorTile.js';
import { CanvasTexture, MathUtils, Vector2 } from 'three';
import TileState from 'ol/TileState.js';
import { listen, unlistenByKey } from 'ol/events.js';
import { buffer, createEmpty as createEmptyExtent, equals, getIntersection, intersects } from 'ol/extent.js';

// Even if it's not explicited in the changelog
// https://github.com/openlayers/openlayers/blob/main/changelog/upgrade-notes.md
// Around OL6 the replay group mechanism was split into BuilderGroup to create the
// instructions and ExecutorGroup to run them.
// The mechanism was altered following
// https://github.com/openlayers/openlayers/issues/9215
// to make it work

import CanvasBuilderGroup from 'ol/render/canvas/BuilderGroup.js';
import CanvasExecutorGroup from 'ol/render/canvas/ExecutorGroup.js';
import { getSquaredTolerance as getSquaredRenderTolerance, renderFeature as renderVectorFeature } from 'ol/renderer/vector.js';
import { create as createTransform, reset as resetTransform, scale as scaleTransform, translate as translateTransform } from 'ol/transform.js';
import { MVT } from 'ol/format.js';
import EmptyTexture from '../renderer/EmptyTexture';
import Fetcher from '../utils/Fetcher';
import OpenLayersUtils from '../utils/OpenLayersUtils';
import { nonNull } from '../utils/tsutils';
import ImageSource, { ImageResult } from './ImageSource';
const tmpTransform = createTransform();
const MIN_LEVEL_THRESHOLD = 2;
const tmpDims = new Vector2();
function getZoomLevel(tileGrid, width, extent) {
  const minZoom = tileGrid.getMinZoom();
  const maxZoom = tileGrid.getMaxZoom();
  function round1000000(n) {
    return Math.round(n * 100000000) / 100000000;
  }
  const extentWidth = extent.dimensions(tmpDims).x;
  const targetResolution = round1000000(width / extentWidth);
  const minResolution = round1000000(1 / tileGrid.getResolution(minZoom));
  if (minResolution / targetResolution > MIN_LEVEL_THRESHOLD) {
    // The minimum zoom level has more than twice the resolution
    // than requested. We cannot use this zoom level as it would
    // trigger too many tile requests to fill the extent.
    return null;
  }

  // Let's determine the best zoom level for the target tile.
  for (let z = minZoom; z < maxZoom; z++) {
    const sourceResolution = round1000000(1 / tileGrid.getResolution(z));
    if (sourceResolution >= targetResolution) {
      return z;
    }
  }
  return maxZoom;
}
function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function handleStyleImageChange() {
  /** empty */
}
function renderFeature(feature, squaredTolerance, styles, builderGroup) {
  if (styles == null) {
    return false;
  }
  let loading = false;
  if (Array.isArray(styles)) {
    for (let i = 0, ii = styles.length; i < ii; ++i) {
      loading = renderVectorFeature(builderGroup, feature, styles[i], squaredTolerance, handleStyleImageChange, undefined) || loading;
    }
  } else {
    loading = renderVectorFeature(builderGroup, feature, styles, squaredTolerance, handleStyleImageChange, undefined);
  }
  return loading;
}
/**
 * A Vector Tile source. Uses OpenLayers [styles](https://openlayers.org/en/latest/apidoc/module-ol_style_Style-Style.html).
 *
 * @example
 * const apiKey = 'my api key';
 * const vectorTileSource = new VectorTileSource(\{
 *     url: `${'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token='}${apiKey}`,
 *     style: new Style(...), // Pass an OpenLayers style here
 *     backgroundColor: 'hsl(47, 26%, 88%)',
 * \});
 */
class VectorTileSource extends ImageSource {
  isVectorTileSource = true;
  type = 'VectorTileSource';
  _olUID = MathUtils.generateUUID();

  /**
   * @param options - Options.
   */
  constructor(options) {
    super(options);
    if (!options.url) {
      throw new Error('missing parameter: url');
    }
    this.source = new OLVectorTileSourcce({
      url: options.url,
      format: options.format ?? new MVT()
    });
    const priority = this.priority;
    this.source.setTileLoadFunction(async function (image, url) {
      if (image instanceof VectorTile) {
        const response = await Fetcher.fetch(url, {
          priority
        });
        if (response.status === 200) {
          const imageData = await response.arrayBuffer();
          const features = image.getFormat().readFeatures(imageData, {
            extent: image.extent,
            featureProjection: image.projection
          });
          image.setFeatures(features);
        }
      }
    });
    this.style = options.style;
    this.backgroundColor = options.backgroundColor;
    const projection = nonNull(this.source.getProjection(), 'could not get projection from source');
    this._crs = projection.getCode();
    const tileGrid = this.source.getTileGridForProjection(projection);
    this._tileGrid = tileGrid;
    this._sourceProjection = projection;
  }
  getCrs() {
    return this._crs;
  }
  getExtent() {
    if (!this._extent) {
      const tileGrid = this.source.getTileGridForProjection(this._sourceProjection);
      const sourceExtent = tileGrid.getExtent();
      this._extent = OpenLayersUtils.fromOLExtent(sourceExtent, this._crs);
    }
    return this._extent;
  }

  /**
   * @param tile - The tile to render.
   * @returns The canvas.
   */
  rasterize(tile) {
    const tileCoord = tile.getTileCoord();
    const width = 512;
    const height = 512;
    const canvas = createCanvas(width, height);
    // @ts-expect-error this is not assignable to getReplayState()
    const replayState = tile.getReplayState(this);
    replayState.renderedTileRevision = 1;
    const z = tileCoord[0];
    const source = this.source;
    const tileGrid = source.getTileGridForProjection(this._sourceProjection);
    const resolution = tileGrid.getResolution(z);
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true
    });
    if (!ctx) {
      throw new Error('could not acquire 2d context');
    }
    if (this.backgroundColor != null) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    const pixelScale = 1 / resolution;
    const transform = resetTransform(tmpTransform);
    scaleTransform(transform, pixelScale, -pixelScale);
    translateTransform(transform, -tileExtent[0], -tileExtent[3]);
    const executorGroups = tile.executorGroups[this._olUID];
    for (let i = 0, ii = executorGroups.length; i < ii; ++i) {
      const executorGroup = executorGroups[i];
      executorGroup.execute(ctx, [width, height], transform, 0, true);
    }
    ctx.restore();
    return canvas;
  }
  rasterizeTile(tile) {
    const empty = this.createBuilderGroup(tile);
    if (empty) {
      return new EmptyTexture();
    }
    const canvas = this.rasterize(tile);
    const texture = new CanvasTexture(canvas);
    return texture;
  }
  createBuilderGroup(tile) {
    // @ts-expect-error this is not assignable to getReplayState()
    const replayState = tile.getReplayState(this);
    const source = this.source;
    const sourceTileGrid = nonNull(source.getTileGrid(), 'could not get tile grid from source');
    const sourceProjection = this._sourceProjection;
    const tileGrid = source.getTileGridForProjection(sourceProjection);
    const resolution = tileGrid.getResolution(tile.getTileCoord()[0]);
    const tileExtent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);
    const pixelRatio = 1;
    const tmpExtent2 = createEmptyExtent();
    let empty = true;
    tile.executorGroups[this._olUID] = [];
    const sourceTiles = source.getSourceTiles(pixelRatio, sourceProjection, tile);
    for (let t = 0, tt = sourceTiles.length; t < tt; ++t) {
      const sourceTile = sourceTiles[t];
      if (sourceTile.getState() !== TileState.LOADED) {
        console.warn('not loaded !!!', sourceTile);
        continue;
      }
      const sourceTileCoord = sourceTile.getTileCoord();
      const sourceTileExtent = sourceTileGrid.getTileCoordExtent(sourceTileCoord);
      const sharedExtent = getIntersection(tileExtent, sourceTileExtent);
      const renderBuffer = 100;
      const builderExtent = buffer(sharedExtent, renderBuffer * resolution, tmpExtent2);
      const bufferedExtent = equals(sourceTileExtent, sharedExtent) ? null : builderExtent;
      const builderGroup = new CanvasBuilderGroup(0, builderExtent, resolution, pixelRatio);
      const squaredTolerance = getSquaredRenderTolerance(resolution, pixelRatio);
      const defaultStyle = this.style;
      const render = function (feature) {
        let styles;
        const style = feature.getStyleFunction() || defaultStyle;
        if (typeof style === 'function') {
          styles = style(feature, resolution);
        } else {
          styles = defaultStyle;
        }
        if (styles != null) {
          const dirty = renderFeature(feature, squaredTolerance, styles, builderGroup);
          replayState.dirty = replayState.dirty || dirty;
        }
      };
      const features = sourceTile.getFeatures();
      for (let i = 0, ii = features.length; i < ii; ++i) {
        const feature = features[i];
        const geom = feature.getGeometry();
        if (geom && (!bufferedExtent || intersects(bufferedExtent, geom.getExtent()))) {
          render.call(this, feature);
        }
        empty = false;
      }
      if (!empty) {
        const renderingReplayGroup = new CanvasExecutorGroup(builderExtent, resolution, pixelRatio, source.getOverlaps(), builderGroup.finish(), renderBuffer);
        tile.executorGroups[this._olUID].push(renderingReplayGroup);
      }
    }
    replayState.renderedRevision = 1;
    return empty;
  }

  /**
   * @param tile - The tile to load.
   * @returns The promise containing the rasterized tile.
   */
  loadTile(tile) {
    let promise;
    if (tile.getState() === TileState.EMPTY) {
      promise = Promise.resolve(new EmptyTexture());
    } else if (tile.getState() === TileState.LOADED) {
      promise = Promise.resolve(this.rasterizeTile(tile));
    } else {
      promise = new Promise((resolve, reject) => {
        const eventKey = listen(tile, 'change', evt => {
          const tile2 = evt.target;
          const tileState = tile2.getState();
          if (tileState === TileState.ERROR) {
            unlistenByKey(eventKey);
            reject();
          } else if (tileState === TileState.LOADED) {
            unlistenByKey(eventKey);
            resolve(this.rasterizeTile(tile2));
          }
        });
        tile.load();
      });
    }
    return promise;
  }

  /**
   * Loads all tiles in the specified extent and zoom level.
   *
   * @param extent - The tile extent.
   * @param zoom - The zoom level.
   * @returns The image requests.
   */
  loadTiles(extent, zoom) {
    const source = this.source;
    const tileGrid = this._tileGrid;
    const crs = extent.crs;
    const requests = [];
    const sourceExtent = this.getExtent();
    tileGrid.forEachTileCoord(OpenLayersUtils.toOLExtent(extent), zoom, ([z, i, j]) => {
      const tile = source.getTile(z, i, j, 1, this._sourceProjection);
      const coord = tile.getTileCoord();
      const id = `${z}-${i}-${j}`;
      if (coord != null) {
        const tileExtent = OpenLayersUtils.fromOLExtent(tileGrid.getTileCoordExtent(coord), crs);
        // Don't bother loading tiles that are not in the source
        if (tileExtent.intersectsExtent(sourceExtent)) {
          const request = () => this.loadTile(tile).then(texture => new ImageResult({
            texture,
            extent: tileExtent,
            id
          }));
          requests.push({
            id,
            request
          });
        }
      }
    });
    return requests;
  }
  getImages(options) {
    const {
      extent,
      width
    } = options;
    const tileGrid = this.source.getTileGridForProjection(this._sourceProjection);
    const zoomLevel = getZoomLevel(tileGrid, width, extent);
    if (zoomLevel == null) {
      return [];
    }
    return this.loadTiles(extent, zoomLevel);
  }
}
export default VectorTileSource;