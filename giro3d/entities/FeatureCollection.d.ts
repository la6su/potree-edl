import type Feature from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import type { Object3D } from 'three';
import { Box3, Group, Vector3 } from 'three';
import type Context from '../core/Context';
import { type FeatureElevationCallback, type FeatureExtrusionOffsetCallback, type FeatureStyle, type FeatureStyleCallback, type LineMaterialGenerator, type PointMaterialGenerator, type SurfaceMaterialGenerator } from '../core/FeatureTypes';
import type Extent from '../core/geographic/Extent';
import LayerUpdateState from '../core/layer/LayerUpdateState';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import type SimpleGeometryMesh from '../renderer/geometries/SimpleGeometryMesh';
import type SurfaceMesh from '../renderer/geometries/SurfaceMesh';
import type { EntityUserData } from './Entity';
import type { Entity3DEventMap } from './Entity3D';
import Entity3D from './Entity3D';
/**
 * The content of the `.userData` property of the {@link SimpleGeometryMesh}es created by this entity.
 */
export type MeshUserData = {
    /**
     * The feature this mesh was generated from.
     */
    feature: Feature;
    /**
     * The parent entity of this mesh.
     */
    parentEntity: Entity3D;
    /**
     * The style of this mesh.
     */
    style: FeatureStyle;
};
type FeatureTileUserData = {
    parentEntity: Entity3D;
    layerUpdateState: LayerUpdateState;
    extent: Extent;
    x: number;
    y: number;
    z: number;
};
declare class FeatureTile extends Group {
    readonly isFeatureTile: true;
    readonly type: "FeatureTile";
    readonly origin: Vector3;
    readonly boundingBox: Box3;
    readonly userData: FeatureTileUserData;
    constructor(options: {
        name: string;
        origin: Vector3;
        userData: FeatureTileUserData;
        boundingBox: Box3;
    });
    dispose(set: Set<string | number>): void;
}
/**
 * An {@link Entity3D} that represent [simple features](https://en.wikipedia.org/wiki/Simple_Features)
 * as 3D meshes.
 *
 * ❗ Arbitrary triangulated meshes (TINs) are not supported.
 *
 * ## Supported geometries
 *
 * Both 2D and 3D geometries are supported. In the case of 2D geometries (with only XY coordinates),
 * you can specify an elevation (Z) to display the geometries at arbitrary heights, using the
 * `elevation` option in the constructor.
 *
 * Supported geometries:
 * - [Point](https://openlayers.org/en/latest/apidoc/module-ol_geom_Point-Point.html) and [MultiPoint](https://openlayers.org/en/latest/apidoc/module-ol_geom_MultiPoint-MultiPoint.html)
 * - [LineString](https://openlayers.org/en/latest/apidoc/module-ol_geom_LineString-LineString.html) and [MultiLineString](https://openlayers.org/en/latest/apidoc/module-ol_geom_MultiLineString-MultiLineString.html)
 * - [Polygon](https://openlayers.org/en/latest/apidoc/module-ol_geom_Polygon-Polygon.html) and [MultiPolygon](https://openlayers.org/en/latest/apidoc/module-ol_geom_MultiPolygon-MultiPolygon.html).
 * Polygons can additionally be extruded (e.g to display buildings from footprints) with the
 * `extrusionOffset` constructor option.
 *
 * ## Data sources
 *
 * At the moment, this entity accepts an OpenLayers [VectorSource](https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html)
 * that returns [features](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html).
 *
 * NOTE: if your source doesn't have a notion of level of detail, like a WFS server, you must choose
 * one level where data will be downloaded. The level giving the best user experience depends on the
 * data source. You must configure both `minLevel` and `maxLevel` to this level.
 *
 * For example, in the case of a WFS source:
 *
 * ```js
 * import VectorSource from 'ol/source/Vector.js';
 * import FeatureCollection from '@giro3d/giro3d/entities/FeatureCollection';
 *
 * const vectorSource = new VectorSource({
 *  // ...
 * });
 * const featureCollection = new FeatureCollection('features', {
 *  source: vectorSource
 *  minLevel: 10,
 *  maxLevel: 10,
 *  elevation: (feature) => feat.getProperties().elevation,
 * });
 *
 * instance.add(featureCollection);
 *
 * ```
 * ## Supported CRSes
 *
 * The `FeatureCollection` supports the reprojection of geometries if the source has a different CRS
 * than the scene. Any custom CRS must be registered first with
 * {@link core.Instance.registerCRS | Instance.registerCRS()}.
 *
 * Related examples:
 *
 * - [WFS as 3D meshes](/examples/wfs_mesh.html)
 * - [IGN data](/examples/ign_data.html)
 *
 * ## Styling
 *
 * Features can be styled using a {@link FeatureStyle}, either using the same style for the entire
 * entity, or using a style function that will return a style for each feature.
 *
 * ❗ All features that share the same style will internally use the same material. It is not advised
 * to modify this material to avoid affecting all shared objects. Those materials are automatically
 * disposed when the entity is removed from the instance.
 *
 * Textures used by point styles are also disposed if they were created internally by the entity
 * (from a provided URL) rather than provided as a texture.
 *
 * ### Overriding material generators
 *
 * By default, styles are converted to materials using default generator functions. It is possible
 * to override those function to create custom materials. For example, to use custom line materials,
 * you can pass the `lineMaterialGenerator` option to the constructor.
 */
declare class FeatureCollection<UserData = EntityUserData> extends Entity3D<Entity3DEventMap, UserData> {
    /**
     * Read-only flag to check if a given object is of type FeatureCollection.
     */
    readonly isFeatureCollection: true;
    readonly type: "FeatureCollection";
    /**
     * The projection code of the data source.
     */
    readonly dataProjection: string | null;
    /**
     * The minimum LOD at which this entity is displayed.
     */
    readonly minLevel: number;
    /**
     * The maximum LOD at which this entity is displayed.
     */
    readonly maxLevel: number;
    /**
     * The extent of this entity.
     */
    readonly extent: Extent;
    private readonly _level0Nodes;
    private readonly _rootMeshes;
    private readonly _geometryConverter;
    private readonly _subdivisions;
    private readonly _opCounter;
    private readonly _tileIdSet;
    private readonly _source;
    private readonly _style;
    private readonly _extrusionOffset?;
    private readonly _elevation;
    private readonly _ignoreZ;
    private _targetProjection?;
    /**
     * The factor to drive the subdivision of feature nodes. The heigher, the bigger the nodes.
     */
    sseScale: number;
    /**
     * The number of materials managed by this entity.
     */
    get materialCount(): number;
    /**
     * Construct a `FeatureCollection`.
     *
     * @param options - Constructor options.
     */
    constructor(options: {
        /** The OpenLayers [VectorSource](https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html) providing features to this entity */
        source: VectorSource;
        /**
         * The projection code for the projections of the features. If null or empty,
         * no reprojection will be done. If a valid epsg code is given and if different from
         * `instance.referenceCrs`, each feature will be reprojected before mesh
         * conversion occurs. Note that reprojection can be somewhat heavy on CPU resources.
         */
        dataProjection?: string;
        /** The geographic extent of the entity. */
        extent: Extent;
        /** The optional 3D object to use as the root */
        object3d?: Object3D;
        /**
         * The min subdivision level to start processing features.
         * Useful for WFS or other untiled servers, to avoid to download the
         * entire dataset when the whole extent is visible.
         */
        minLevel?: number;
        /**
         * The max level to subdivide the extent and process features.
         */
        maxLevel?: number;
        /**
         * Set the elevation of the features received from the source.
         * It can be a constant for every feature, or a callback.
         * The callback version is particularly useful to derive the elevation
         * from the properties of the feature.
         * Requires `ignoreZ` to be `false`.
         */
        elevation?: number | number[] | FeatureElevationCallback;
        /**
         * If true, the Z-coordinates of geometries will be ignored and set to zero.
         * @defaultValue false
         */
        ignoreZ?: boolean;
        /**
         * If set, this will cause 2D features to be extruded of the corresponding amount.
         * If a single value is given, it will be used for all the vertices of every feature.
         * If an array is given, each extruded vertex will use the corresponding value.
         * If a callback is given, it allows to extrude each feature individually.
         */
        extrusionOffset?: number | number[] | FeatureExtrusionOffsetCallback;
        /**
         * An style or a callback returning a style to style the individual features.
         * If an object is used, the informations it contains will be used to style every
         * feature the same way. If a function is provided, it will be called with the feature.
         * This allows to individually style each feature.
         */
        style?: FeatureStyle | FeatureStyleCallback;
        /**
         * An optional material generator for shaded surfaces.
         */
        shadedSurfaceMaterialGenerator?: SurfaceMaterialGenerator;
        /**
         * An optional material generator for unshaded surfaces.
         */
        unshadedSurfaceMaterialGenerator?: SurfaceMaterialGenerator;
        /**
         * An optional material generator for lines.
         */
        lineMaterialGenerator?: LineMaterialGenerator;
        /**
         * An optional material generator for points.
         */
        pointMaterialGenerator?: PointMaterialGenerator;
    });
    getMemoryUsage(context: GetMemoryUsageContext): void;
    preprocess(): Promise<void>;
    /**
     * Gets whether this entity is currently loading data.
     */
    get loading(): boolean;
    /**
     * Gets the progress value of the data loading.
     */
    get progress(): number;
    private buildNewTile;
    preUpdate(_: Context, changeSources: Set<unknown>): FeatureTile[];
    private getCachedList;
    /**
     * Updates the styles of the  given objects, or all objects if unspecified.
     * @param objects - The objects to update.
     */
    updateStyles(objects?: (SimpleGeometryMesh<MeshUserData> | SurfaceMesh<MeshUserData>)[]): void;
    private updateStyle;
    protected assignRenderOrder(obj: Object3D): void;
    private prepare;
    private getStyle;
    updateRenderOrder(): void;
    updateOpacity(): void;
    traverseGeometries(callback: (geom: SimpleGeometryMesh<MeshUserData>) => void): void;
    private getCacheKey;
    private processFeatures;
    private loadFeatures;
    private getMeshesWithCache;
    private disposeTile;
    update(ctx: Context, tile: FeatureTile): FeatureTile[] | null | undefined;
    private subdivideNode;
    private testTileSSE;
    dispose(): void;
    private updateMinMaxDistance;
}
export default FeatureCollection;
//# sourceMappingURL=FeatureCollection.d.ts.map