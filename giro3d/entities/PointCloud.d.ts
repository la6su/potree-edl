import type { Box3 } from 'three';
import { Vector2 } from 'three';
import ColorMap from '../core/ColorMap';
import type Context from '../core/Context';
import type ColorLayer from '../core/layer/ColorLayer';
import type HasLayers from '../core/layer/HasLayers';
import type Layer from '../core/layer/Layer';
import type { GetMemoryUsageContext } from '../core/MemoryUsage';
import type PickOptions from '../core/picking/PickOptions';
import type PickResult from '../core/picking/PickResult';
import type { Classification } from '../renderer/PointCloudMaterial';
import { type PointCloudAttribute, type PointCloudSource } from '../sources/PointCloudSource';
import type { EntityPreprocessOptions, EntityUserData } from './Entity';
import type { Entity3DEventMap } from './Entity3D';
import Entity3D from './Entity3D';
export declare class UnsupportedAttributeError extends Error {
    constructor(attribute: string);
}
/**
 * Constructor options for the PointCloud entity.
 */
export type PointCloudOptions = {
    /**
     * The point cloud source.
     */
    source: PointCloudSource;
    /**
     * The delay, in milliseconds, before unused data is freed from memory.
     * The longer the delay, the longer a node's data will be kept in memory, making it possible
     * to display this node immediately when it becomes visible.
     *
     * Conversely, reducing this value will free memory more often, leading to a reduced memory
     * footprint.
     *
     * @defaultValue 5000
     */
    cleanupDelay?: number;
};
/**
 * Displays point clouds coming from a {@link PointCloudSource}.
 *
 * This entity supports two coloring modes: `'attribute'` and `'layer'`. In coloring mode `'attribute'`,
 * points are colorized from the selected attribute (e.g color, intensity, classification...).
 *
 * ```ts
 * pointCloud.setColoringMode('attribute');
 * pointCloud.setActiveAttribute('Intensity');
 * ```
 *
 * In coloring mode `'layer'`, points are colorized using a {@link ColorLayer} that must be set with
 * {@link setColorLayer}.
 *
 * Note: the layer does not have to be in the same coordinate system as the point cloud.
 *
 * ```ts
 * const colorLayer = new ColorLayer(...);
 * pointCloud.setColorLayer(colorLayer);
 * pointCloud.setColoringMode('layer');
 * ```
 */
export default class PointCloud<TUserData extends EntityUserData = EntityUserData> extends Entity3D<Entity3DEventMap, TUserData> implements HasLayers {
    /** Readonly flag to indicate that this object is a PointCloud instance. */
    readonly isPointCloud: true;
    readonly type: "PointCloud";
    readonly hasLayers: true;
    private readonly _stateMachine;
    private readonly _listeners;
    private readonly _tileVolumeRoot;
    private readonly _pointsRoot;
    private readonly _cleanupPollingInterval;
    private readonly _classifications;
    /** The source of this entity. */
    readonly source: PointCloudSource;
    private _colorLayer;
    private _depthTest;
    private _subdivisionThreshold;
    private _shaderMode;
    private _activeAttribute;
    private _pointSize;
    private _cleanupDelay;
    private _showVolume;
    private _decimation;
    private _showPoints;
    private _showNodeDataVolumes;
    private _disposed;
    private _pointBudget;
    private _colorMap;
    private _rootNode;
    private _metadata;
    private _volumeHelper;
    constructor(options: PointCloudOptions);
    /**
     * Enables or disables depth testing for point cloud meshes.
     *
     * @defaultValue true
     */
    get depthTest(): boolean;
    set depthTest(v: boolean);
    get progress(): number;
    get loading(): boolean;
    get layerCount(): number;
    /**
     * The colormap used to colorize scalar attributes.
     */
    get colorMap(): ColorMap | null;
    set colorMap(c: ColorMap | null);
    private updateColorMap;
    /**
     * The global factor that drives LOD computation. The lower this value, the
     * sooner a node is subdivided. Note: changing this scale to a value less than 1 can drastically
     * increase the number of nodes displayed in the scene, and can even lead to browser crashes.
     *
     * @defaultValue 1
     */
    get subdivisionThreshold(): number;
    set subdivisionThreshold(v: number);
    /**
     * Returns the list of supported attributes in the source.
     */
    getSupportedAttributes(): PointCloudAttribute[];
    /**
     * The point size, in pixels.
     *
     * Note: a value of zero triggers automatic size computation.
     *
     * @defaultValue 0
     */
    get pointSize(): number;
    set pointSize(size: number);
    /**
     * Gets the active attribute.
     *
     * Note: to set the active attribute, use {@link setActiveAttribute}.
     */
    get activeAttribute(): PointCloudAttribute | null;
    /**
     * Sets the coloring mode of the entity:
     * - `layer`: the point cloud is colorized from a color layer previously set with {@link setColorLayer}.
     * - `attribute`: the point cloud is colorized from the source attributes (e.g color, classification...)
     * previously set with {@link setActiveAttribute}.
     */
    setColoringMode(mode: 'layer' | 'attribute'): void;
    private updateColoringFromAttribute;
    /**
     * Sets the active attribute.
     *
     * Note: to enable coloring from the attribute, use {@link setColoringMode} with mode `'attribute'`.
     *
     * Note: To get the supported attributes, use {@link getSupportedAttributes}.
     *
     * @param attributeName - The active attribute.
     *
     * @throws {@link UnsupportedAttributeError} If the attribute is not supported by the source.
     */
    setActiveAttribute(attributeName: string): void;
    /**
     * Toggles the visibility of the point cloud volume.
     */
    get showVolume(): boolean;
    set showVolume(show: boolean);
    /**
     * The amount of decimation to apply to currently displayed point meshes. A value of `1` means
     * that all points are displayed. A value of `N` means that we display only 1 every Nth point.
     *
     * Note: this has no effect on the quantity of data that point cloud sources must fetch, as it
     * is a purely graphical setting. This does, however, improve rendering performance by reducing
     * the number of points to draw on the screen.
     */
    get decimation(): number;
    set decimation(v: number);
    /**
     * The delay, in milliseconds, to remove unused data for each node.
     * Must be a positive integer greater or equal to zero.
     *
     * Setting it to zero will cleanup immediately after a node becomes invisible.
     */
    get cleanupDelay(): number;
    set cleanupDelay(delay: number);
    /**
     * Enables or disables the display of the point cloud.
     * @defaultValue true
     */
    get showPoints(): boolean;
    set showPoints(v: boolean);
    /**
     * Toggles the visibility of invidividual node volumes.
     */
    get showNodeVolumes(): boolean;
    set showNodeVolumes(show: boolean);
    /**
     * Toggles the visibility of individual node content volumes.
     *
     * Note: octree-based point clouds have cube-shaped node volumes, whereas
     * their  node data volume is a tight bounding box around the actual points of the node.
     */
    get showNodeDataVolumes(): boolean;
    set showNodeDataVolumes(show: boolean);
    /**
     * Gets the classification array. The array contains 256 entries that can be updated,
     * but the array itself may not be resized.
     *
     * @defaultValue `ASPRS_CLASSIFICATIONS`
     */
    get classifications(): Readonly<Classification[]>;
    /**
     * Gets the total number of points in this point cloud, or `undefined`
     * if this value is not known.
     *
     * Note: the entity must be initialized to be able to access this property.
     */
    get pointCount(): number | undefined;
    /**
     * Gets the number of points currently displayed.
     */
    get displayedPointCount(): number;
    /**
     * Gets or sets the point budget. A non-null point budget will automatically compute the
     * {@link decimation} property every frame, based on the number of currently displayed points.
     * A value of `null` removes the point budget and stop automatic decimation computation.
     */
    get pointBudget(): number | null;
    set pointBudget(v: number | null);
    getMemoryUsage(context: GetMemoryUsageContext): void;
    updateOpacity(): void;
    /**
     * Forces the point cloud to reload all data.
     */
    clear(): void;
    getBoundingBox(): Box3 | null;
    protected preprocess(_opts: EntityPreprocessOptions): Promise<void>;
    private deleteNodeHierarchy;
    preUpdate(context: Context): unknown[] | null;
    private updateDecimation;
    postUpdate(context: Context): void;
    /**
     * Disposes this entity and deletes unmanaged graphical resources.
     */
    dispose(): void;
    pick(canvasCoords: Vector2, options?: PickOptions): PickResult[];
    /**
     * Sets the color layer to colorize the points.
     *
     * Note: to enable coloring from the color layer, use {@link setColoringMode} with mode `'layer'`.
     *
     * @param colorLayer - The color layer.
     */
    setColorLayer(colorLayer: ColorLayer): void;
    removeColorLayer(): void;
    forEachLayer(callback: (layer: Layer) => void): void;
    getLayers(predicate?: (arg0: Layer) => boolean): Layer[];
    private updateMinMaxDistance;
    private traversePointCloudMaterials;
    /**
     * Creates a volume helper for the entire entity.
     */
    private createGlobalVolumeHelper;
    private cleanup;
    private testNodeSSE;
    private updateGeometry;
    private createGeometry;
    private createMaterial;
    private createMesh;
    private updateMaterial;
    private cleanupNodeIfNecessary;
    private disposeMesh;
    private traversePointCloudMeshes;
    /**
     * Loads data from the source for the given node.
     */
    private loadNodeData;
    private showNode;
    private getNodeInfo;
    private removeDataVolumeHelper;
    private removeVolumeHelper;
    private forEachNodeInfo;
    private updateHelpers;
}
//# sourceMappingURL=PointCloud.d.ts.map