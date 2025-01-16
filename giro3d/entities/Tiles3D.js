import { Group, MathUtils, Matrix4, Vector2, Vector3 } from 'three';
import { GlobalCache } from '../core/Cache';
import { isDisposable } from '../core/Disposable';
import { getGeometryMemoryUsage } from '../core/MemoryUsage';
import OperationCounter from '../core/OperationCounter';
import pickObjectsAt from '../core/picking/PickObjectsAt';
import pickPointsAt from '../core/picking/PickPointsAt';
import PointCloud from '../core/PointCloud';
import { DefaultQueue } from '../core/RequestQueue';
import PointCloudMaterial from '../renderer/PointCloudMaterial';
import Fetcher from '../utils/Fetcher';
import { isBufferGeometry } from '../utils/predicates';
import { nonNull } from '../utils/tsutils';
import utf8Decoder from '../utils/Utf8Decoder';
import $3dTilesIndex from './3dtiles/3dTilesIndex';
import $3dTilesLoader from './3dtiles/3dTilesLoader';
import { boundingVolumeToBox3, boundingVolumeToExtent, cullingTest } from './3dtiles/BoundingVolume';
import Tile from './3dtiles/Tile';
import Entity3D from './Entity3D';

/** Options to create a Tiles3D object. */

const tmpVector = new Vector3();
const tmpMatrix = new Matrix4();

// This function is used to cleanup a Object3D hierarchy.
// (no 3dtiles spectific code here because this is managed by cleanup3dTileset)
function _cleanupObject3D(n) {
  // all children of 'n' are raw Object3D
  for (const child of n.children) {
    _cleanupObject3D(child);
  }
  if ('dispose' in n && typeof n.dispose === 'function') {
    n.dispose();
  } else {
    // free resources
    if ('material' in n && isDisposable(n.material)) {
      n.material.dispose();
    }
    if ('geometry' in n && isDisposable(n.geometry)) {
      n.geometry.dispose();
    }
  }
  n.remove(...n.children);
}
function isTilesetContentReady(tileset, node) {
  return tileset != null && node != null &&
  // is tileset loaded ?
  node.children.length === 1 &&
  // is tileset root loaded ?
  node.children[0].children.length > 0;
}

/**
 * Types of results for picking on {@link Tiles3D}.
 *
 * If Tiles3D uses {@link PointCloudMaterial}, then results will be of {@link PointsPickResult}.
 * Otherwise, they will be of {@link PickResult}.
 */

/**
 * A [3D Tiles](https://www.ogc.org/standards/3DTiles) dataset.
 *
 */
class Tiles3D extends Entity3D {
  type = 'Tiles3D';
  hasLayers = true;
  isMemoryUsage = true;
  /** Read-only flag to check if a given object is of type Tiles3D. */
  isTiles3D = true;
  get url() {
    return this._url;
  }

  /** The Screen Space Error (SSE) threshold to use for this tileset. */

  /** The delay, in milliseconds, to cleanup unused objects. */

  /** The material to use */

  imageSize = new Vector2(128, 128);
  get asset() {
    return nonNull(this._asset);
  }
  get root() {
    return nonNull(this._root);
  }
  /**
   * Constructs a Tiles3D object.
   *
   * @param source - The data source.
   * @param options - Optional properties.
   */
  constructor(source, options = {}) {
    super(options.object3d || new Group());
    if (source == null) {
      throw new Error('missing source');
    }
    if (source.url == null) {
      throw new Error('missing source.url');
    }
    this.type = 'Tiles3D';
    this._url = source.url;
    this._networkOptions = source.networkOptions;
    this.sseThreshold = options.sseThreshold ?? 16;
    this.cleanupDelay = options.cleanupDelay ?? 1000;
    this.material = options.material ?? undefined;
    this._cleanableTiles = [];
    this._opCounter = new OperationCounter();
    this._queue = DefaultQueue;
  }
  onRenderingContextRestored() {
    this.forEachLayer(layer => layer.onRenderingContextRestored());
    this.instance.notifyChange(this);
  }
  getBoundingBox() {
    if (this._root != null) {
      return boundingVolumeToBox3(this._root.boundingVolume, this._root.matrixWorld);
    }
    return super.getBoundingBox();
  }
  getMemoryUsage(context) {
    this.traverse(obj => {
      if ('geometry' in obj && isBufferGeometry(obj.geometry)) {
        getGeometryMemoryUsage(context, obj.geometry);
      }
    });
    if (this.layerCount > 0) {
      this.forEachLayer(layer => {
        layer.getMemoryUsage(context);
      });
    }
  }
  async attach(colorLayer) {
    this._colorLayer = colorLayer;
    await colorLayer.initialize({
      instance: this.instance
    });
  }
  get loading() {
    return this._opCounter.loading || (this._colorLayer?.loading ?? false);
  }
  get progress() {
    let sum = this._opCounter.progress;
    let count = 1;
    if (this._colorLayer) {
      sum += this._colorLayer.progress;
      count = 2;
    }
    return sum / count;
  }
  getLayers(predicate) {
    if (this._colorLayer) {
      if (typeof predicate != 'function' || predicate(this._colorLayer)) {
        return [this._colorLayer];
      }
    }
    return [];
  }
  forEachLayer(callback) {
    if (this._colorLayer) {
      callback(this._colorLayer);
    }
  }
  get layerCount() {
    if (this._colorLayer) {
      return 1;
    }
    return 0;
  }
  updateOpacity() {
    if (this.material) {
      // This is necessary because update() does copy the material's properties
      // to the tile's material, and we are losing any custom opacity.
      this.material.opacity = this.opacity;
      this.material.transparent = this.opacity < 1;
      // in the case we have a material for the whole entity, we can ignore the object's
      // original opacity and the Entity3D implementation is fine
      super.updateOpacity();
    } else {
      // if we *don't* have an entity-wise material, we need to be a bit more subtle and take
      // the original opacity into account
      this.traverseMaterials(material => {
        this.setMaterialOpacity(material);
      });
    }
  }
  async preprocess() {
    // Download the root tileset to complete the preparation.
    const tileset = await Fetcher.json(this._url, this._networkOptions);
    if (!tileset.root.refine) {
      tileset.root.refine = tileset.refine;
    }

    // Add a tile which acts as root of the tileset but has no content.
    // This way we can safely cleanup the root of the tileset in the processing
    // code, and keep a valid layer.root tile.
    const fakeroot = {
      boundingVolume: tileset.root.boundingVolume,
      geometricError: tileset.geometricError * 10,
      refine: tileset.root.refine,
      transform: tileset.root.transform,
      children: [tileset.root]
    };
    // Remove transform which has been moved up to fakeroot
    tileset.root.transform = undefined;
    // Replace root
    tileset.root = fakeroot;
    const urlPrefix = this._url.slice(0, this._url.lastIndexOf('/') + 1);
    // Note: Constructing $3dTilesIndex makes tileset.root become a Tileset object !
    this._tileIndex = new $3dTilesIndex(tileset, urlPrefix);
    this._asset = tileset.asset;
    const tile = await this.requestNewTile(tileset.root);
    if (tile == null) {
      throw new Error('Could not load root tile');
    }
    this.object3d.add(tile);
    tile.updateMatrixWorld();
    nonNull(this._tileIndex).get(tile).obj = tile;
    this._root = tile;
    this._extent = boundingVolumeToExtent(this.instance.referenceCrs, tile.boundingVolume, tile.matrixWorld);
  }
  async requestNewTile(metadata, parent) {
    if (metadata.obj) {
      const tileset = metadata;
      this.unmarkTileForDeletion(tileset.obj);
      this.instance.notifyChange(parent);
      return tileset.obj;
    }
    this._opCounter.increment();
    let priority;
    if (!parent || parent.additiveRefinement) {
      // Additive refinement can be done independently for each child,
      // so we can compute a per child priority
      const box = nonNull(metadata.boundingVolumeObject.box);
      const size = box.clone().applyMatrix4(metadata.worldFromLocalTransform).getSize(tmpVector);
      priority = size.x * size.y;
    } else {
      // But the 'replace' refinement needs to download all children at
      // the same time.
      // If one of the children is very small, its priority will be low,
      // and it will delay the display of its siblings.
      // So we compute a priority based on the size of the parent
      // TODO cache the computation of world bounding volume ?
      const box = nonNull(parent.boundingVolume.box);
      const size = box.clone().applyMatrix4(parent.matrixWorld).getSize(tmpVector);
      priority = size.x * size.y; // / this.tileIndex.index[parent.tileId].children.length;
    }
    const request = {
      id: MathUtils.generateUUID(),
      priority,
      shouldExecute: () => this.shouldExecute(parent),
      request: () => this.executeCommand(metadata, parent)
    };
    try {
      const node = await this._queue.enqueue(request);
      metadata.obj = node;
      this.notifyChange(this);
      return node;
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        throw e;
      }
    } finally {
      this._opCounter.decrement();
    }
  }
  preUpdate() {
    if (!this.visible) {
      return [];
    }

    // Elements removed are added in the this._cleanableTiles list.
    // Since we simply push in this array, the first item is always
    // the oldest one.
    const now = Date.now();
    const cleanable = this._cleanableTiles;
    const first = cleanable[0];
    if (first != null && now - first.cleanableSince > this.cleanupDelay) {
      while (cleanable.length > 0) {
        const elt = this._cleanableTiles[0];
        if (now - elt.cleanableSince > this.cleanupDelay) {
          this.cleanup3dTileset(elt);
        } else {
          // later entries are younger
          break;
        }
      }
    }
    return [nonNull(this._root)];
  }
  update(context, node) {
    // Remove deleted children (?)
    node.remove(...node.children.filter(c => c.deleted));
    const parent = nonNull(node.parent);

    // early exit if parent's subdivision is in progress
    if (parent.pendingSubdivision === true && !parent.additiveRefinement) {
      node.visible = false;
      return undefined;
    }
    let returnValue;

    // do proper culling
    const isVisible = !cullingTest(context.view, node, node.matrixWorld);
    node.visible = isVisible;
    if (isVisible) {
      this.unmarkTileForDeletion(node);

      // We need distance for 2 things:
      // - subdivision testing
      // - near / far calculation in MainLoop. For this one, we need the distance for *all*
      // displayed tiles.
      // For this last reason, we need to calculate this here, and not in subdivisionControl
      node.calculateCameraDistance(context.view.camera);
      if (!this.frozen) {
        if (node.pendingSubdivision === true || this.subdivisionTest(context, node)) {
          this.subdivideNode(context, node);
          // display iff children aren't ready
          if (node.additiveRefinement || node.pendingSubdivision === true) {
            node.setDisplayed(true);
          } else {
            // If one of our child is a tileset, this node must be displayed until this
            // child content is ready, to avoid hiding our content too early (= when our
            // child is loaded but its content is not)
            const index = nonNull(this._tileIndex);
            const children = nonNull(index.get(node).children);
            const subtilesets = children.filter(tile => tile.isProcessedTile);
            if (subtilesets.length) {
              let allReady = true;
              for (const tileset of subtilesets) {
                const subTilesetNode = node.children.filter(n => n.tileId === tileset.tileId)[0];
                if (!isTilesetContentReady(tileset, subTilesetNode)) {
                  allReady = false;
                  break;
                }
              }
              node.setDisplayed(allReady);
            } else {
              node.setDisplayed(true);
            }
          }
          returnValue = node.getChildTiles();
        } else {
          node.setDisplayed(true);
          for (const n of node.getChildTiles()) {
            n.visible = false;
            this.markTileForDeletion(n);
          }
        }
      } else {
        returnValue = node.getChildTiles();
      }

      // update material
      if (node.content && node.content.visible) {
        // it will therefore contribute to near / far calculation
        if (node.boundingVolume.region) {
          throw new Error('boundingVolume.region is not yet supported');
        } else if (node.boundingVolume.box) {
          this._distance.min = Math.min(this._distance.min, node.distance.min);
          this._distance.max = Math.max(this._distance.max, node.distance.max);
        } else if (node.boundingVolume.sphere) {
          this._distance.min = Math.min(this._distance.min, node.distance.min);
          this._distance.max = Math.max(this._distance.max, node.distance.max);
        }
        node.content.traverse(o => {
          const mesh = o;
          if (this.isOwned(mesh) && 'material' in mesh) {
            const m = mesh.material;
            if ('wireframe' in m) {
              m.wireframe = this.wireframe;
            }
          }
        });
        if (this.material) {
          node.content.traverse(o => {
            const pointcloud = o;
            if (this.isOwned(pointcloud) && pointcloud.material != null) {
              if (pointcloud.isPoints) {
                if (PointCloudMaterial.isPointCloudMaterial(pointcloud.material) && PointCloudMaterial.isPointCloudMaterial(this.material)) {
                  pointcloud.material.update(this.material);
                } else if (this.material != null) {
                  pointcloud.material.copy(this.material);
                }
              }
            }
          });
        }
      }
    } else if (node !== this._root) {
      if (node.parent && node.parent.additiveRefinement) {
        this.markTileForDeletion(node);
      }
    }
    return returnValue;
  }
  postUpdate(context) {
    this.traverse(obj => {
      if (PointCloud.isPointCloud(obj) && PointCloudMaterial.isPointCloudMaterial(obj.material)) {
        obj.material.updateUniforms();
        this.forEachLayer(layer => layer.update(context, obj));
      }
    });
    this.forEachLayer(layer => layer.postUpdate());
  }
  markTileForDeletion(node) {
    if (node.cleanableSince == null) {
      node.markForDeletion();
      this._cleanableTiles.push(node);
    }
  }
  unmarkTileForDeletion(node) {
    if (node && node.cleanableSince != null) {
      this._cleanableTiles.splice(this._cleanableTiles.indexOf(node), 1);
      node.unmarkForDeletion();
    }
  }

  // Cleanup all 3dtiles|three.js starting from a given node n.
  // n's children can be of 2 types:
  //   - have a 'content' attribute -> it's a tileset and must
  //     be cleaned with cleanup3dTileset()
  //   - doesn't have 'content' -> it's a raw Object3D object,
  //     and must be cleaned with _cleanupObject3D()
  cleanup3dTileset(n, depth = 0) {
    this.unmarkTileForDeletion(n);
    const tileset = nonNull(this._tileIndex).get(n);
    if (tileset.obj) {
      tileset.obj.deleted = Date.now();
      tileset.obj = undefined;
    }

    // clean children tiles recursively
    for (const child of n.getChildTiles()) {
      this.cleanup3dTileset(child, depth + 1);
      n.remove(child);
    }
    if (n.content) {
      // clean content
      n.content.traverse(_cleanupObject3D);
      n.remove(n.content);
      delete n.content;
    }
    if ('dispose' in n && typeof n.dispose === 'function') {
      n.dispose();
    }

    // and finally remove from parent
    // if (depth === 0 && n.parent) {
    //     n.parent.remove(n);
    // }
  }
  subdivisionTest(context, node) {
    const tileset = nonNull(this._tileIndex).get(node);
    if (tileset.children === undefined) {
      return false;
    }
    if (tileset.isProcessedTile) {
      return true;
    }
    const sse = node.computeNodeSSE(context.view);
    node.sse = sse;
    return sse > this.sseThreshold;
  }
  subdivideNodeAdditive(context, node) {
    const children = nonNull(nonNull(this._tileIndex).get(node).children);
    for (const child of children) {
      // child being downloaded or already added => skip
      if (child.promise || node.children.filter(n => n.tileId === child.tileId).length > 0) {
        continue;
      }

      // 'child' is only metadata (it's *not* a Object3D). 'cullingTest' needs
      // a matrixWorld, so we compute it: it's node's matrixWorld x child's transform
      let overrideMatrixWorld = node.matrixWorld;
      if (child.transformMatrix != null) {
        overrideMatrixWorld = tmpMatrix.multiplyMatrices(node.matrixWorld, child.transformMatrix);
      }
      const isVisible = !cullingTest(context.view, child, overrideMatrixWorld);

      // child is not visible => skip
      if (!isVisible) {
        continue;
      }
      child.promise = this.requestNewTile(child, node).then(tile => {
        if (!(!tile || !node.parent)) {
          node.add(tile);
          tile.updateMatrixWorld();
          const extent = boundingVolumeToExtent(nonNull(this._extent).crs, tile.boundingVolume, tile.matrixWorld);
          tile.traverse(obj => {
            obj.extent = extent;
          });
          this.notifyChange(child);
        } // cancelled promise or node has been deleted
      }).catch(e => {
        console.error('Cannot subdivide node', node, e);
      }).finally(() => delete child.promise);
    }
  }
  subdivideNodeSubstractive(node) {
    // Subdivision in progress => nothing to do
    if (node.pendingSubdivision === true) {
      return;
    }
    if (node.getChildTiles().length > 0) {
      return;
    }
    const index = nonNull(this._tileIndex);

    // No child => nothing to do either
    const childrenTiles = index.get(node).children;
    if (childrenTiles === undefined || childrenTiles.length === 0) {
      return;
    }
    node.pendingSubdivision = true;

    // Substractive (refine = 'REPLACE') is an all or nothing subdivision mode
    const promises = [];
    for (const child of childrenTiles) {
      const p = this.requestNewTile(child, node).then(tile => {
        if (!(!tile || !node.parent)) {
          node.add(tile);
          tile.updateMatrixWorld();
          const extent = boundingVolumeToExtent(nonNull(this._extent).crs, tile.boundingVolume, tile.matrixWorld);
          tile.traverse(obj => {
            obj.extent = extent;
          });
        } // cancelled promise or node has been deleted
      }).catch(e => {
        console.error('Cannot subdivide node', node, e);
      });
      promises.push(p);
    }
    Promise.all(promises).then(() => {
      node.pendingSubdivision = false;
      this.notifyChange(node);
    }, () => {
      node.pendingSubdivision = false;

      // delete other children
      for (const n of node.getChildTiles()) {
        n.visible = false;
        this.markTileForDeletion(n);
      }
    });
  }
  subdivideNode(context, node) {
    if (node.additiveRefinement) {
      // Additive refinement can only fetch visible children.
      this.subdivideNodeAdditive(context, node);
    } else {
      // Substractive refinement on the other hand requires to replace
      // node with all of its children
      this.subdivideNodeSubstractive(node);
    }
  }

  /**
   * Calculate and set the material opacity, taking into account this entity opacity and the
   * original opacity of the object.
   *
   * @param material - a material belonging to an object of this entity
   */
  setMaterialOpacity(material) {
    material.opacity = this.opacity * material.userData.originalOpacity;
    const currentTransparent = material.transparent;
    material.transparent = material.opacity < 1.0;
    material.needsUpdate = currentTransparent !== material.transparent;
  }
  setupMaterial(material) {
    material.clippingPlanes = this.clippingPlanes;
    // this object can already be transparent with opacity < 1.0
    // we need to honor it, even when we change the whole entity's opacity
    if (material.userData.originalOpacity == null) {
      material.userData.originalOpacity = material.opacity;
    }
    this.setMaterialOpacity(material);
  }
  async executeCommand(metadata, requester) {
    const tile = new Tile(metadata, requester);

    // Patch for supporting 3D Tiles pre 1.0 (metadata.content.url) and 1.0
    // (metadata.content.uri)
    let path = undefined;
    if (metadata.content) {
      if (metadata.content.url != null) {
        // 3D Tiles pre 1.0 version
        path = metadata.content.url;
      } else if (metadata.content.uri != null) {
        // 3D Tiles 1.0 version
        path = metadata.content.uri;
      }
    }
    const setupObject = obj => {
      this.onObjectCreated(obj);
    };
    if (path != null) {
      // Check if we have relative or absolute url (with tileset's lopocs for example)
      const url = path.startsWith('http') ? path : metadata.baseURL + path;
      const dl = GlobalCache.get(url) ?? GlobalCache.set(url, Fetcher.arrayBuffer(url, this._networkOptions));
      const result = await dl;
      if (result !== undefined) {
        let content;
        const magic = utf8Decoder.decode(new Uint8Array(result, 0, 4));
        metadata.magic = magic;
        if (magic[0] === '{') {
          const {
            newTileset,
            newPrefix
          } = await $3dTilesLoader.jsonParse(result, this, url);
          nonNull(this._tileIndex).extendTileset(newTileset, metadata.tileId, newPrefix);
        } else if (magic === 'b3dm') {
          content = await $3dTilesLoader.b3dmToMesh(result, this, url);
        } else if (magic === 'pnts') {
          content = await $3dTilesLoader.pntsParse(result, this);
        } else {
          throw new Error(`Unsupported magic code ${magic}`);
        }
        if (content) {
          // TODO: request should be delayed if there is a viewerRequestVolume
          tile.content = content.object3d;
          content.object3d.name = path;
          if ('batchTable' in content && content.batchTable != null) {
            tile.batchTable = content.batchTable;
          }
          tile.add(content.object3d);
          tile.traverse(setupObject);
          return tile;
        }
      }
      tile.traverse(setupObject);
      return tile;
    }
    tile.traverse(setupObject);
    return tile;
  }

  /**
   * @param node - The tile to evaluate;
   * @returns true if the request can continue, false if it must be cancelled.
   */
  shouldExecute(node) {
    if (!node) {
      return true;
    }

    // node was removed from the hierarchy
    if (!node.parent) {
      return false;
    }

    // tile not visible anymore
    if (!node.visible) {
      return false;
    }

    // tile visible but doesn't need subdivision anymore
    if (node.sse != null && node.sse < this.sseThreshold) {
      return false;
    }
    return true;
  }
  pick(coordinates, options) {
    if (this.material && PointCloudMaterial.isPointCloudMaterial(this.material)) {
      return pickPointsAt(this.instance, coordinates, this, options);
    }
    return pickObjectsAt(this.instance, coordinates, this.object3d, options);
  }
}
export default Tiles3D;
export { boundingVolumeToExtent };