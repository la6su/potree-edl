import { Box3, Matrix4, Mesh, MeshBasicMaterial, Ray, RGBAFormat, UnsignedByteType, Vector2, Vector3 } from 'three';
import { readRGRenderTargetIntoRGBAU8Buffer } from '../renderer/composition/WebGLComposer';
import MemoryTracker from '../renderer/MemoryTracker';
import HeightMap from './HeightMap';
import ElevationLayer from './layer/ElevationLayer';
import OffsetScale from './OffsetScale';
import Rect from './Rect';
import TileGeometry from './TileGeometry';
import { intoUniqueOwner } from './UniqueOwner';
const ray = new Ray();
const inverseMatrix = new Matrix4();
const THIS_RECT = new Rect(0, 1, 0, 1);
const helperMaterial = new MeshBasicMaterial({
  color: '#75eba8',
  depthTest: false,
  depthWrite: false,
  wireframe: true,
  transparent: true
});
const NO_NEIGHBOUR = -99;
const NO_OFFSET_SCALE = new OffsetScale(0, 0, 0, 0);
const tempVec2 = new Vector2();
const tempVec3 = new Vector3();
function makePooledGeometry(pool, extent, segments, level) {
  const key = `${segments}-${level}`;
  const cached = pool.get(key);
  if (cached) {
    return cached;
  }
  const dimensions = extent.dimensions();
  const geometry = new TileGeometry({
    dimensions,
    segments
  });
  pool.set(key, geometry);
  return geometry;
}
function makeRaycastableGeometry(extent, segments) {
  const dimensions = extent.dimensions();
  const geometry = new TileGeometry({
    dimensions,
    segments
  });
  return geometry;
}
class TileVolume {
  constructor(options) {
    const dims = options.extent.dimensions(tempVec2);
    const width = dims.x;
    const height = dims.y;
    const min = new Vector3(-width / 2, -height / 2, options.min);
    const max = new Vector3(+width / 2, +height / 2, options.max);
    this._localBox = new Box3(min, max);
    this._owner = options.owner;
  }
  get centerZ() {
    return this.localBox.getCenter(tempVec3).z;
  }
  get localBox() {
    return this._localBox;
  }

  /**
   * Gets or set the min altitude, in local coordinates.
   */
  get zMin() {
    return this._localBox.min.z;
  }
  set zMin(v) {
    this._localBox.min.setZ(v);
  }

  /**
   * Gets or set the max altitude, in local coordinates.
   */
  get zMax() {
    return this._localBox.max.z;
  }
  set zMax(v) {
    this._localBox.max.setZ(v);
  }

  /**
   * Returns the local size of this volume.
   */
  getLocalSize(target) {
    return this._localBox.getSize(target);
  }

  /**
   * Returns the local bounding box.
   */
  getLocalBoundingBox(target) {
    const result = target ?? new Box3();
    result.copy(this._localBox);
    return result;
  }

  /**
   * Gets the world bounding box, taking into account world transformation.
   */
  getWorldSpaceBoundingBox(target) {
    const result = target ?? new Box3();
    result.copy(this._localBox);
    this._owner.updateWorldMatrix(true, false);
    result.applyMatrix4(this._owner.matrixWorld);
    return result;
  }
}
class TileMesh extends Mesh {
  isMemoryUsage = true;
  type = 'TileMesh';
  isTileMesh = true;
  _minmax = {
    min: -Infinity,
    max: +Infinity
  };
  _heightMap = null;
  disposed = false;
  _shouldUpdateHeightMap = false;
  isLeaf = false;
  _elevationLayerInfo = null;
  _helperMesh = null;
  getMemoryUsage(context) {
    this.material?.getMemoryUsage(context);

    // We only count what we own, otherwise the same heightmap will be counted more than once.
    if (this._heightMap && this._heightMap.owner === this) {
      context.objects.set(`heightmap-${this._heightMap.owner.id}`, {
        cpuMemory: this._heightMap.payload.buffer.byteLength,
        gpuMemory: 0
      });
    }
    // If CPU terrain is enabled, then the geometry is owned by this mesh, rather than
    // shared with other meshes in the same map, so we have to count it.
    if (this._enableCPUTerrain) {
      this.geometry.getMemoryUsage(context);
    }
  }
  get boundingBox() {
    if (!this._enableTerrainDeformation) {
      this._volume.zMin = 0;
      this._volume.zMax = 0;
    } else {
      this._volume.zMin = this.minmax.min;
      this._volume.zMax = this.minmax.max;
    }
    return this._volume.localBox;
  }
  getWorldSpaceBoundingBox(target) {
    return this._volume.getWorldSpaceBoundingBox(target);
  }

  /**
   * Creates an instance of TileMesh.
   *
   * @param options - Constructor options.
   */
  constructor({
    geometryPool,
    material,
    extent,
    segments,
    coord: {
      level,
      x = 0,
      y = 0
    },
    textureSize,
    instance,
    enableCPUTerrain,
    enableTerrainDeformation,
    onElevationChanged
  }) {
    super(
    // CPU terrain forces geometries to be unique, so cannot be pooled
    enableCPUTerrain ? makeRaycastableGeometry(extent, segments) : makePooledGeometry(geometryPool, extent, segments, level), material);
    this._pool = geometryPool;
    this._segments = segments;
    this._instance = instance;
    this._onElevationChanged = onElevationChanged;
    this.matrixAutoUpdate = false;
    this.level = level;
    this.extent = extent;
    this.textureSize = textureSize;
    this._enableCPUTerrain = enableCPUTerrain;
    this._enableTerrainDeformation = enableTerrainDeformation;
    if (!this.geometry.boundingBox) {
      this.geometry.computeBoundingBox();
    }
    const boundingBox = this.geometry.boundingBox;
    this._volume = new TileVolume({
      extent,
      owner: this,
      min: boundingBox.min.z,
      max: boundingBox.max.z
    });
    this.name = `tile @ (z=${level}, x=${x}, y=${y})`;
    this.frustumCulled = false;

    // Layer
    this.setDisplayed(false);
    this.material.setUuid(this.id);
    const dim = extent.dimensions();
    this._extentDimensions = dim;
    this.material.uniforms.tileDimensions.value.set(dim.x, dim.y);

    // Sets the default bbox volume
    this.setBBoxZ(-0.5, +0.5);
    this.x = x;
    this.y = y;
    this.z = level;
    MemoryTracker.track(this, this.name);
  }
  get showHelpers() {
    if (!this._helperMesh) {
      return false;
    }
    return this._helperMesh.material.visible;
  }
  set showHelpers(visible) {
    if (visible && !this._helperMesh) {
      this._helperMesh = new Mesh(this.geometry, helperMaterial);
      this._helperMesh.matrixAutoUpdate = false;
      this._helperMesh.name = 'collider helper';
      this.add(this._helperMesh);
      this._helperMesh.updateMatrix();
      this._helperMesh.updateMatrixWorld(true);
    }
    if (!visible && this._helperMesh) {
      this._helperMesh.removeFromParent();
      this._helperMesh = null;
    }
    if (this._helperMesh) {
      this._helperMesh.material.visible = visible;
    }
  }
  get segments() {
    return this._segments;
  }
  set segments(v) {
    if (this._segments !== v) {
      this._segments = v;
      this.createGeometry();
      this.material.segments = v;
      if (this._enableCPUTerrain) {
        this._shouldUpdateHeightMap = true;
      }
    }
  }
  createGeometry() {
    this.geometry = this._enableCPUTerrain ? makeRaycastableGeometry(this.extent, this._segments) : makePooledGeometry(this._pool, this.extent, this._segments, this.level);
    if (this._helperMesh) {
      this._helperMesh.geometry = this.geometry;
    }
  }
  onLayerVisibilityChanged(layer) {
    if (layer instanceof ElevationLayer && this._enableCPUTerrain) {
      this._shouldUpdateHeightMap = true;
    }
  }
  addChildTile(tile) {
    this.add(tile);
    if (this._heightMap) {
      const heightMap = this._heightMap.payload;
      const inheritedHeightMap = heightMap.clone();
      const offsetScale = tile.extent.offsetToParent(this.extent);
      heightMap.offsetScale.combine(offsetScale, inheritedHeightMap.offsetScale);
      tile.inheritHeightMap(intoUniqueOwner(inheritedHeightMap, this));
    }
  }
  reorderLayers() {
    this.material.reorderLayers();
  }

  /**
   * Checks that the given raycaster intersects with this tile's volume.
   */
  checkRayVolumeIntersection(raycaster) {
    const matrixWorld = this.matrixWorld;

    // convert ray to local space of mesh

    inverseMatrix.copy(matrixWorld).invert();
    ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

    // test with bounding box in local space

    // Note that we are not using the bounding box of the geometry, because at this moment,
    // the mesh might still be completely flat, as the heightmap might not be computed yet.
    // This is the whole point of this method: to avoid computing the heightmap if not necessary.
    // So we are using the logical bounding box provided by the volume.
    return ray.intersectsBox(this.boundingBox);
  }
  raycast(raycaster, intersects) {
    // Updating the heightmap is quite costly operation that requires a texture readback.
    // Let's do it only if the ray intersects the volume of this tile.
    if (this.checkRayVolumeIntersection(raycaster)) {
      this.updateHeightMapIfNecessary();
      super.raycast(raycaster, intersects);
    }
  }
  updateHeightMapIfNecessary() {
    if (this._shouldUpdateHeightMap && this._enableCPUTerrain) {
      this._shouldUpdateHeightMap = false;
      if (this._elevationLayerInfo) {
        this.createHeightMap(this._elevationLayerInfo.renderTarget, this._elevationLayerInfo.offsetScale);
        const shouldHeightmapBeActive = this._elevationLayerInfo.layer.visible && this._enableTerrainDeformation;
        if (shouldHeightmapBeActive) {
          this.applyHeightMap();
        } else {
          this.resetHeights();
        }
      }
    }
  }

  /**
   * @param neighbour - The neighbour.
   * @param location - Its location in the neighbour array.
   */
  processNeighbour(neighbour, location) {
    const diff = neighbour.level - this.level;
    const neighbourTexture = neighbour.material.getElevationTexture();
    const neighbourOffsetScale = neighbour.material.getElevationOffsetScale();
    const offsetScale = this.extent.offsetToParent(neighbour.extent);
    const nOffsetScale = neighbourOffsetScale.combine(offsetScale);
    this.material.updateNeighbour(location, diff, nOffsetScale, neighbourTexture);
  }

  /**
   * @param neighbours - The neighbours.
   */
  processNeighbours(neighbours) {
    for (let i = 0; i < neighbours.length; i++) {
      const neighbour = neighbours[i];
      if (neighbour != null && neighbour.material != null && neighbour.material.visible) {
        this.processNeighbour(neighbour, i);
      } else {
        this.material.updateNeighbour(i, NO_NEIGHBOUR, NO_OFFSET_SCALE, null);
      }
    }
  }
  update(materialOptions) {
    if (this._enableCPUTerrain && this._heightMap && this._elevationLayerInfo) {
      if (this._enableTerrainDeformation !== materialOptions.terrain.enabled) {
        this._enableTerrainDeformation = materialOptions.terrain.enabled;
        this._shouldUpdateHeightMap = true;
      }
    }
    this.showHelpers = materialOptions.showColliderMeshes ?? false;
  }
  isVisible() {
    return this.visible;
  }
  setDisplayed(show) {
    const currentVisibility = this.material.visible;
    this.material.visible = show && this.material.update();
    if (this._helperMesh) {
      this._helperMesh.visible = this.material.visible;
    }
    if (currentVisibility !== show) {
      this.dispatchEvent({
        type: 'visibility-changed'
      });
    }
  }

  /**
   * @param v - The new opacity.
   */
  set opacity(v) {
    this.material.opacity = v;
  }
  setVisibility(show) {
    const currentVisibility = this.visible;
    this.visible = show;
    if (currentVisibility !== show) {
      this.dispatchEvent({
        type: 'visibility-changed'
      });
    }
  }
  isDisplayed() {
    return this.material.visible;
  }

  /**
   * Updates the rendering state of the tile's material.
   *
   * @param state - The new rendering state.
   */
  changeState(state) {
    this.material.changeState(state);
  }
  static applyChangeState(o, s) {
    if (o.isTileMesh) {
      o.changeState(s);
    }
  }
  pushRenderState(state) {
    if (this.material.uniforms.renderingState.value === state) {
      return () => {
        /** do nothing */
      };
    }
    const oldState = this.material.uniforms.renderingState.value;
    this.traverse(n => TileMesh.applyChangeState(n, state));
    return () => {
      this.traverse(n => TileMesh.applyChangeState(n, oldState));
    };
  }
  canProcessColorLayer() {
    return this.material.canProcessColorLayer();
  }
  static canSubdivideTile(tile) {
    let current = tile;
    let ancestorLevel = 0;

    // To be able to subdivide a tile, we need to ensure that we
    // have proper elevation data on this tile (if applicable).
    // Otherwise the newly created tiles will not have a correct bounding box,
    // and this will mess with frustum culling / level of detail selection, in turn leading
    // to dangerous levels of subdivisions (and hundreds/thousands of undesired tiles).
    // On the other hand, we can afford a bit of undesired tiles if it means that
    // the color layers will display correctly.

    while (ancestorLevel < 3 && current != null) {
      if (current != null && current.material != null && current.material.isElevationLayerTextureLoaded()) {
        return true;
      }
      ancestorLevel++;
      if (isTileMesh(current.parent)) {
        current = current.parent;
      } else {
        break;
      }
    }
    return false;
  }
  canSubdivide() {
    return TileMesh.canSubdivideTile(this);
  }
  removeElevationTexture() {
    this._elevationLayerInfo = null;
    this._shouldUpdateHeightMap = true;
    this.material.removeElevationLayer();
  }
  setElevationTexture(layer, elevation, isFinal = false) {
    if (this.disposed) {
      return;
    }
    this._elevationLayerInfo = {
      layer,
      offsetScale: elevation.pitch,
      renderTarget: elevation.renderTarget
    };
    this.material.setElevationTexture(layer, elevation, isFinal);
    this.setBBoxZ(elevation.min, elevation.max);
    if (this._enableCPUTerrain) {
      this._shouldUpdateHeightMap = true;
    }
    this._onElevationChanged(this);
  }
  createHeightMap(renderTarget, offsetScale) {
    const outputHeight = Math.floor(renderTarget.height);
    const outputWidth = Math.floor(renderTarget.width);

    // One millimeter
    const precision = 0.001;

    // To ensure that all values are positive before encoding
    const offset = -this._minmax.min;
    const buffer = readRGRenderTargetIntoRGBAU8Buffer({
      renderTarget,
      renderer: this._instance.renderer,
      outputWidth,
      outputHeight,
      precision,
      offset
    });
    const heightMap = new HeightMap(buffer, outputWidth, outputHeight, offsetScale, RGBAFormat, UnsignedByteType, precision, offset);
    this._heightMap = intoUniqueOwner(heightMap, this);
  }
  inheritHeightMap(heightMap) {
    this._heightMap = heightMap;
    this._shouldUpdateHeightMap = true;

    // Let's get a more precise minmax from the inherited heightmap, but
    // only on the region of the inherited heightmap that matches this tile's extent
    // (otherwise this would not provide any benefit at all);
    const minmax = heightMap.payload.getMinMax(THIS_RECT);
    if (minmax != null) {
      this._minmax = minmax;
    }
  }
  resetHeights() {
    this.geometry.resetHeights();
    this.setBBoxZ(0, 0);
    this._onElevationChanged(this);
  }
  applyHeightMap() {
    if (!this._heightMap) {
      return;
    }
    const {
      min,
      max
    } = this.geometry.applyHeightMap(this._heightMap.payload);
    if (min > this._minmax.min && max < this._minmax.max) {
      this.setBBoxZ(min, max);
    }
    this._onElevationChanged(this);
  }
  setBBoxZ(min, max) {
    // 0 is an acceptable value
    if (min == null || max == null) {
      return;
    }
    this._minmax = {
      min,
      max
    };
    this.updateVolume(min, max);
  }
  traverseTiles(callback) {
    this.traverse(obj => {
      if (isTileMesh(obj)) {
        callback(obj);
      }
    });
  }

  /**
   * Removes the child tiles and returns the detached tiles.
   */
  detachChildren() {
    const childTiles = this.children.filter(c => isTileMesh(c));
    childTiles.forEach(c => c.dispose());
    this.remove(...childTiles);
    return childTiles;
  }
  updateVolume(min, max) {
    const v = this._volume;
    if (Math.floor(min) !== Math.floor(v.zMin) || Math.floor(max) !== Math.floor(v.zMax)) {
      this._volume.zMin = min;
      this._volume.zMax = max;
    }
  }
  get minmax() {
    const range = Math.abs(this._minmax.max - this._minmax.min);
    const width = this._extentDimensions.width;
    const height = this._extentDimensions.height;
    // If the current volume is very elongated in the vertical axis,
    // this can cause excessive subdivisions of the tile. Let's compute
    // the heightmap to get a more precise min/max and hopefully a tighter
    // volume. Note that the heightmap will be computed only if it does not
    // exist, avoiding unnecessary computations.
    if (range / Math.max(width, height) > 3) {
      this.updateHeightMapIfNecessary();
    }
    return this._minmax;
  }
  getExtent() {
    return this.extent;
  }
  getElevation(params) {
    this.updateHeightMapIfNecessary();
    if (this._heightMap) {
      const uv = this.extent.offsetInExtent(params.coordinates, tempVec2);
      const heightMap = this._heightMap.payload;
      const elevation = heightMap.getValue(uv.x, uv.y);
      if (elevation != null) {
        const dims = this.extent.dimensions(tempVec2);
        const xRes = dims.x / heightMap.width;
        const yRes = dims.y / heightMap.height;
        const resolution = Math.min(xRes, yRes);
        return {
          elevation,
          resolution
        };
      }
    }
    return null;
  }

  /**
   * Gets whether this mesh is currently performing processing.
   *
   * @returns `true` if the mesh is currently performing processing, `false` otherwise.
   */
  get loading() {
    return this.material.loading;
  }

  /**
   * Gets the progress percentage (normalized in [0, 1] range) of the processing.
   *
   * @returns The progress percentage.
   */
  get progress() {
    return this.material.progress;
  }

  /**
   * Search for a common ancestor between this tile and another one. It goes
   * through parents on each side until one is found.
   *
   * @param tile - the tile to evaluate
   * @returns the resulting common ancestor
   */
  findCommonAncestor(tile) {
    if (tile == null) {
      return null;
    }
    if (tile.level === this.level) {
      if (tile.id === this.id) {
        return tile;
      }
      if (tile.level !== 0) {
        return this.parent.findCommonAncestor(tile.parent);
      }
      return null;
    }
    if (tile.level < this.level) {
      return this.parent.findCommonAncestor(tile);
    }
    return this.findCommonAncestor(tile.parent);
  }
  isAncestorOf(node) {
    return node.findCommonAncestor(this) === this;
  }
  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.dispatchEvent({
      type: 'dispose'
    });
    this.material.dispose();
    if (this._enableCPUTerrain) {
      // When colliders are enabled, geometries are created for each tile,
      // and thus must be disposed when the mesh is disposed.
      this.geometry.dispose();
    }
  }
}
export function isTileMesh(o) {
  return o.isTileMesh;
}
export default TileMesh;