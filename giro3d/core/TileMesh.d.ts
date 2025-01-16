import { Box3, Mesh, Vector2, type Intersection, type Object3D, type Object3DEventMap, type Raycaster, type Texture, type WebGLRenderTarget } from 'three';
import type LayeredMaterial from '../renderer/LayeredMaterial';
import type { MaterialOptions } from '../renderer/LayeredMaterial';
import type RenderingState from '../renderer/RenderingState';
import type Disposable from './Disposable';
import type Extent from './geographic/Extent';
import type GetElevationOptions from './GetElevationOptions';
import type Instance from './Instance';
import ElevationLayer from './layer/ElevationLayer';
import type Layer from './layer/Layer';
import type MemoryUsage from './MemoryUsage';
import { type GetMemoryUsageContext } from './MemoryUsage';
import OffsetScale from './OffsetScale';
import TileGeometry from './TileGeometry';
import { type NeighbourList } from './TileIndex';
type GeometryPool = Map<string, TileGeometry>;
export interface TileMeshEventMap extends Object3DEventMap {
    'visibility-changed': unknown;
    dispose: unknown;
}
declare class TileMesh extends Mesh<TileGeometry, LayeredMaterial, TileMeshEventMap> implements Disposable, MemoryUsage {
    readonly isMemoryUsage: true;
    private readonly _pool;
    private readonly _extentDimensions;
    private _segments;
    readonly type: string;
    readonly isTileMesh: boolean;
    private _minmax;
    readonly extent: Extent;
    readonly textureSize: Vector2;
    private readonly _volume;
    readonly level: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    private _heightMap;
    disposed: boolean;
    private _enableTerrainDeformation;
    private readonly _enableCPUTerrain;
    private readonly _instance;
    private readonly _onElevationChanged;
    private _shouldUpdateHeightMap;
    isLeaf: boolean;
    private _elevationLayerInfo;
    private _helperMesh;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    get boundingBox(): Box3;
    getWorldSpaceBoundingBox(target: Box3): Box3;
    /**
     * Creates an instance of TileMesh.
     *
     * @param options - Constructor options.
     */
    constructor({ geometryPool, material, extent, segments, coord: { level, x, y }, textureSize, instance, enableCPUTerrain, enableTerrainDeformation, onElevationChanged, }: {
        /** The geometry pool to use. */
        geometryPool: GeometryPool;
        /** The tile material. */
        material: LayeredMaterial;
        /** The tile extent. */
        extent: Extent;
        /** The subdivisions. */
        segments: number;
        /** The tile coordinate. */
        coord: {
            level: number;
            x: number;
            y: number;
        };
        /** The texture size. */
        textureSize: Vector2;
        instance: Instance;
        enableCPUTerrain: boolean;
        enableTerrainDeformation: boolean;
        onElevationChanged: (tile: TileMesh) => void;
    });
    get showHelpers(): boolean;
    set showHelpers(visible: boolean);
    get segments(): number;
    set segments(v: number);
    private createGeometry;
    onLayerVisibilityChanged(layer: Layer): void;
    addChildTile(tile: TileMesh): void;
    reorderLayers(): void;
    /**
     * Checks that the given raycaster intersects with this tile's volume.
     */
    private checkRayVolumeIntersection;
    raycast(raycaster: Raycaster, intersects: Intersection[]): void;
    private updateHeightMapIfNecessary;
    /**
     * @param neighbour - The neighbour.
     * @param location - Its location in the neighbour array.
     */
    private processNeighbour;
    /**
     * @param neighbours - The neighbours.
     */
    processNeighbours(neighbours: NeighbourList<TileMesh>): void;
    update(materialOptions: MaterialOptions): void;
    isVisible(): boolean;
    setDisplayed(show: boolean): void;
    /**
     * @param v - The new opacity.
     */
    set opacity(v: number);
    setVisibility(show: boolean): void;
    isDisplayed(): boolean;
    /**
     * Updates the rendering state of the tile's material.
     *
     * @param state - The new rendering state.
     */
    changeState(state: RenderingState): void;
    static applyChangeState(o: Object3D, s: RenderingState): void;
    pushRenderState(state: RenderingState): () => void;
    canProcessColorLayer(): boolean;
    private static canSubdivideTile;
    canSubdivide(): boolean;
    removeElevationTexture(): void;
    setElevationTexture(layer: ElevationLayer, elevation: {
        texture: Texture;
        pitch: OffsetScale;
        min?: number;
        max?: number;
        renderTarget: WebGLRenderTarget;
    }, isFinal?: boolean): void;
    private createHeightMap;
    private inheritHeightMap;
    private resetHeights;
    private applyHeightMap;
    setBBoxZ(min: number | undefined, max: number | undefined): void;
    traverseTiles(callback: (descendant: TileMesh) => void): void;
    /**
     * Removes the child tiles and returns the detached tiles.
     */
    detachChildren(): TileMesh[];
    private updateVolume;
    get minmax(): {
        min: number;
        max: number;
    };
    getExtent(): Extent;
    getElevation(params: GetElevationOptions): {
        elevation: number;
        resolution: number;
    } | null;
    /**
     * Gets whether this mesh is currently performing processing.
     *
     * @returns `true` if the mesh is currently performing processing, `false` otherwise.
     */
    get loading(): boolean;
    /**
     * Gets the progress percentage (normalized in [0, 1] range) of the processing.
     *
     * @returns The progress percentage.
     */
    get progress(): number;
    /**
     * Search for a common ancestor between this tile and another one. It goes
     * through parents on each side until one is found.
     *
     * @param tile - the tile to evaluate
     * @returns the resulting common ancestor
     */
    findCommonAncestor(tile: TileMesh): TileMesh | null;
    isAncestorOf(node: TileMesh): boolean;
    dispose(): void;
}
export declare function isTileMesh(o: unknown): o is TileMesh;
export default TileMesh;
//# sourceMappingURL=TileMesh.d.ts.map