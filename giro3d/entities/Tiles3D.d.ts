import type { Box3 } from 'three';
import { Vector2, type Material, type Object3D } from 'three';
import type Context from '../core/Context';
import type ColorLayer from '../core/layer/ColorLayer';
import type HasLayers from '../core/layer/HasLayers';
import type Layer from '../core/layer/Layer';
import type { LayerEvents } from '../core/layer/Layer';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import type Pickable from '../core/picking/Pickable';
import type PickOptions from '../core/picking/PickOptions';
import { type PointsPickResult } from '../core/picking/PickPointsAt';
import type PickResult from '../core/picking/PickResult';
import type Tiles3DSource from '../sources/Tiles3DSource';
import { type ProcessedTile } from './3dtiles/3dTilesIndex';
import { boundingVolumeToExtent } from './3dtiles/BoundingVolume';
import Tile from './3dtiles/Tile';
import type { $3dTilesAsset } from './3dtiles/types';
import { type EntityUserData } from './Entity';
import Entity3D, { type Entity3DEventMap } from './Entity3D';
/** Options to create a Tiles3D object. */
export interface Tiles3DOptions<TMaterial extends Material> {
    /**
     * The delay, in milliseconds, to cleanup unused objects.
     *
     * @defaultvalue 1000
     */
    cleanupDelay?: number;
    /**
     * The Screen Space Error (SSE) threshold to use for this tileset.
     *
     * @defaultvalue 16
     */
    sseThreshold?: number;
    /**
     * The optional 3d object to use as the root object of this entity.
     * If none provided, a new one will be created.
     */
    object3d?: Object3D;
    /** The optional material to use. */
    material?: TMaterial;
}
/**
 * Types of results for picking on {@link Tiles3D}.
 *
 * If Tiles3D uses {@link PointCloudMaterial}, then results will be of {@link PointsPickResult}.
 * Otherwise, they will be of {@link PickResult}.
 */
export type Tiles3DPickResult = PointsPickResult | PickResult;
/**
 * A [3D Tiles](https://www.ogc.org/standards/3DTiles) dataset.
 *
 */
declare class Tiles3D<TMaterial extends Material = Material, UserData extends EntityUserData = EntityUserData> extends Entity3D<Entity3DEventMap, UserData> implements Pickable<Tiles3DPickResult>, HasLayers {
    readonly type: "Tiles3D";
    readonly hasLayers: true;
    readonly isMemoryUsage: true;
    /** Read-only flag to check if a given object is of type Tiles3D. */
    readonly isTiles3D: true;
    private readonly _url;
    private _networkOptions?;
    private _colorLayer?;
    get url(): string;
    /** The Screen Space Error (SSE) threshold to use for this tileset. */
    sseThreshold: number;
    /** The delay, in milliseconds, to cleanup unused objects. */
    cleanupDelay: number;
    /** The material to use */
    material?: TMaterial;
    private _cleanableTiles;
    private _opCounter;
    private _queue;
    readonly imageSize: Vector2;
    private _tileIndex?;
    private _asset?;
    get asset(): $3dTilesAsset;
    private _root?;
    get root(): Tile;
    private _extent?;
    wireframe?: boolean;
    /**
     * Constructs a Tiles3D object.
     *
     * @param source - The data source.
     * @param options - Optional properties.
     */
    constructor(source: Tiles3DSource, options?: Tiles3DOptions<TMaterial>);
    onRenderingContextRestored(): void;
    getBoundingBox(): Box3 | null;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    attach(colorLayer: ColorLayer): Promise<void>;
    get loading(): boolean;
    get progress(): number;
    getLayers(predicate?: (arg0: Layer) => boolean): Layer<LayerEvents>[];
    forEachLayer(callback: (layer: Layer) => void): void;
    get layerCount(): number;
    updateOpacity(): void;
    preprocess(): Promise<void>;
    private requestNewTile;
    preUpdate(): Tile[];
    update(context: Context, node: Tile): Tile[] | undefined;
    postUpdate(context: Context): void;
    protected markTileForDeletion(node: Tile): void;
    protected unmarkTileForDeletion(node: Tile | undefined): void;
    protected cleanup3dTileset(n: Tile, depth?: number): void;
    protected subdivisionTest(context: Context, node: Tile): boolean;
    protected subdivideNodeAdditive(context: Context, node: Tile): void;
    protected subdivideNodeSubstractive(node: Tile): void;
    protected subdivideNode(context: Context, node: Tile): void;
    /**
     * Calculate and set the material opacity, taking into account this entity opacity and the
     * original opacity of the object.
     *
     * @param material - a material belonging to an object of this entity
     */
    protected setMaterialOpacity(material: Material): void;
    protected setupMaterial(material: Material): void;
    executeCommand(metadata: ProcessedTile, requester?: Tile): Promise<Tile>;
    /**
     * @param node - The tile to evaluate;
     * @returns true if the request can continue, false if it must be cancelled.
     */
    shouldExecute(node: Tile | undefined): boolean;
    pick(coordinates: Vector2, options?: PickOptions): Tiles3DPickResult[];
}
export default Tiles3D;
export { boundingVolumeToExtent };
//# sourceMappingURL=Tiles3D.d.ts.map