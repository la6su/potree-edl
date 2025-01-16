import { LineString, type MultiLineString, type MultiPoint, type MultiPolygon, type Point, type Polygon } from 'ol/geom';
import { EventDispatcher, Vector3, type Texture } from 'three';
import { type FillStyle, type LineMaterialGenerator, type PointMaterialGenerator, type PointStyle, type StrokeStyle, type SurfaceMaterialGenerator } from '../../core/FeatureTypes';
import LineStringMesh from './LineStringMesh';
import MultiLineStringMesh from './MultiLineStringMesh';
import MultiPointMesh from './MultiPointMesh';
import MultiPolygonMesh from './MultiPolygonMesh';
import PointMesh from './PointMesh';
import PolygonMesh from './PolygonMesh';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import type { DefaultUserData } from './SimpleGeometryMesh';
import SurfaceMesh from './SurfaceMesh';
export interface InputMap {
    Point: Point;
    MultiPoint: MultiPoint;
    LineString: LineString;
    MultiLineString: MultiLineString;
    Polygon: Polygon;
    MultiPolygon: MultiPolygon;
}
export interface OutputMap<UserData extends DefaultUserData = DefaultUserData> {
    Point: PointMesh<UserData>;
    MultiPoint: MultiPointMesh<UserData>;
    LineString: LineStringMesh<UserData>;
    MultiLineString: MultiLineStringMesh<UserData>;
    Polygon: PolygonMesh<UserData>;
    MultiPolygon: MultiPolygonMesh<UserData>;
}
export type BaseOptions = {
    /**
     * The point of origin for relative coordinates.
     */
    origin?: Vector3;
    /**
     * Ignores the Z component of coordinates.
     */
    ignoreZ?: boolean;
};
export type PointOptions = BaseOptions & Partial<PointStyle>;
export type PolygonOptions = BaseOptions & {
    fill?: FillStyle;
    stroke?: StrokeStyle;
    extrusionOffset?: number[] | number;
    elevation?: number[] | number;
};
export type LineOptions = BaseOptions & StrokeStyle;
export interface OptionMap {
    Point: PointOptions;
    MultiPoint: PointOptions;
    LineString: LineOptions;
    MultiLineString: LineOptions;
    Polygon: PolygonOptions;
    MultiPolygon: PolygonOptions;
}
interface GeometryGeneratorEventMap {
    'texture-loaded': {
        texture: Texture;
    };
}
/**
 * Generates three.js meshes from OpenLayers geometries.
 *
 * Supported geometries:
 * - Point / MultiPoint
 * - LineString / MultiLineString
 * - Polygon / MultiPolygon, 2D or 3D (extruded).
 *
 * Important note: features with the same styles will share the same material instance, to
 * avoid duplication and improve performance. This means that modifying the material will
 * affect all geometries that use it.
 */
export default class GeometryConverter<UserData extends DefaultUserData = DefaultUserData> extends EventDispatcher<GeometryGeneratorEventMap> {
    private readonly _materialCache;
    private readonly _downloadQueue;
    private readonly _downloadedTextures;
    private readonly _shadedSurfaceMaterialGenerator;
    private readonly _unshadedSurfaceMaterialGenerator;
    private readonly _lineMaterialGenerator;
    private readonly _pointMaterialGenerator;
    private _disposed;
    constructor(options?: {
        shadedSurfaceMaterialGenerator?: SurfaceMaterialGenerator;
        unshadedSurfaceMaterialGenerator?: SurfaceMaterialGenerator;
        lineMaterialGenerator?: LineMaterialGenerator;
        pointMaterialGenerator?: PointMaterialGenerator;
    });
    /**
     * Gets whether this generator is disposed. A disposed generator can no longer be used.
     */
    get disposed(): boolean;
    get materialCount(): number;
    /**
     * Converts a {@link Point}.
     * @param geometry - The `Point` to convert.
     * @param options  - The options.
     */
    build(geometry: Point, options?: PointOptions): PointMesh<UserData>;
    /**
     * Converts a {@link MultiPoint}.
     * @param geometry - The `MultiPoint` to convert.
     * @param options  - The options.
     */
    build(geometry: MultiPoint, options?: PointOptions): MultiPointMesh<UserData>;
    /**
     * Converts a {@link MultiPoint} or {@link Point}.
     * @param geometry - The `MultiPoint` or `Point` to convert.
     * @param options  - The options.
     */
    build(geometry: Point | MultiPoint, options?: PointOptions): SimpleGeometryMesh<UserData>;
    /**
     * Converts a {@link Polygon}.
     * @param geometry - The `Polygon` to convert.
     * @param options  - The options.
     */
    build(geometry: Polygon, options?: PolygonOptions): PolygonMesh<UserData>;
    /**
     * Converts a {@link MultiPolygon}.
     *
     * Note: if the `MultiPolygon` has only one polygon, then a {@link PolygonMesh} is returned instead of a {@link MultiPolygonMesh}.
     * @param geometry - The `MultiPolygon` to convert.
     * @param options  - The options.
     */
    build(geometry: MultiPolygon, options?: PolygonOptions): PolygonMesh<UserData> | MultiPolygonMesh<UserData>;
    /**
     * Converts a {@link Polygon}.
     * @param geometry - The `Polygon` to convert.
     * @param options  - The options.
     */
    build(geometry: Polygon | MultiPolygon, options?: PolygonOptions): SimpleGeometryMesh<UserData>;
    /**
     * Converts a {@link LineString}.
     * @param geometry - The `LineString` to convert.
     * @param options  - The options.
     */
    build(geometry: LineString, options?: LineOptions): LineStringMesh<UserData>;
    /**
     * Converts a {@link MultiLineString}.
     *
     * Note: if the `MultiLineString` has only one polygon, then a {@link LineStringMesh} is returned instead of a {@link MultiLineStringMesh}.
     * @param geometry - The `MultiLineString` to convert.
     * @param options  - The options.
     */
    build(geometry: MultiLineString, options?: LineOptions): MultiLineStringMesh<UserData> | LineStringMesh<UserData>;
    /**
     * Converts a {@link MultiLineString} or {@link LineString}.
     *
     * Note: if the `MultiLineString` has only one polygon, then a {@link LineStringMesh} is returned instead of a {@link MultiLineStringMesh}.
     * @param geometry - The `MultiLineString` or `LineString` to convert.
     * @param options  - The options.
     */
    build(geometry: LineString | MultiLineString, options?: LineOptions): SimpleGeometryMesh<UserData>;
    updatePolygonMesh(mesh: PolygonMesh, options: PolygonOptions): void;
    updateMultiPolygonMesh(mesh: MultiPolygonMesh, options: PolygonOptions): void;
    updateMultiLineStringMesh(mesh: MultiLineStringMesh, options: LineOptions): void;
    updateLineStringMesh(mesh: LineStringMesh, options: LineOptions): void;
    updatePointMesh(mesh: PointMesh, style: Partial<PointStyle>): void;
    updateSurfaceMesh(mesh: SurfaceMesh, options: PolygonOptions): void;
    /**
     * Perform the last transformation on generated objects.
     * @param object - The object to finalize.
     * @param options - Options
     */
    private finalize;
    private getSurfaceGeometry;
    /**
     * If origin has not be set, compute a default origin point by taking the first
     * coordinate of the geometry.
     */
    private setDefaultOrigin;
    private getSurfaceMesh;
    private getPolygonRings;
    private buildPolygon;
    private buildMultiPolygon;
    private buildPointMesh;
    private buildPoint;
    private buildMultiPoint;
    private getShadedSurfaceMaterial;
    private getUnshadedSurfaceMaterial;
    private getSpriteMaterial;
    private getCachedTexture;
    private loadRemoteTexture;
    private fetchTexture;
    private getLineMaterial;
    private getLineGeometry;
    private buildLineString;
    private buildMultiLineString;
    /**
     * Disposes this generator and all cached materials. Once disposed, this generator cannot be used anymore.
     */
    dispose({ disposeTextures, disposeMaterials, }: {
        /** Dispose the textures created by this generator */
        disposeTextures?: boolean;
        /** Dispose the materials created by this generator */
        disposeMaterials?: boolean;
    }): void;
}
export {};
//# sourceMappingURL=GeometryConverter.d.ts.map