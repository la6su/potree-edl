import { Feature } from 'ol';
/**
 * Given a simple GeoJSON Geometry object, returns the flat coordinates
 *
 * @param geojson - GeoJSON geometry object
 * @returns Flat coordinates
 */
declare function toFlatCoordinates(geojson: GeoJSON.Geometry): number[];
/**
 * Creates a simple GeoJSON Geometry object from a list of 3D coordinates.
 *
 * @param flat3Coords - Coordinates
 * @param geometryType - Geometry type
 * @returns GeoJSON geometry object
 */
declare function fromFlat3Coordinates(flat3Coords: [number, number, number][], geometryType: GeoJSON.GeoJsonGeometryTypes): GeoJSON.Geometry;
/**
 * Creates a simple GeoJSON Geometry object from a list of flat coordinates.
 *
 * Prefer `fromFlat3Coordinates` if possible (quicker, no object creation).
 *
 * @param flatCoords - Coordinates
 * @param geometryType - Geometry type
 * @returns GeoJSON geometry object
 */
declare function fromFlatCoordinates(flatCoords: number[], geometryType: GeoJSON.GeoJsonGeometryTypes): GeoJSON.Geometry;
declare function getOpenLayersFeature(feature: GeoJSON.Feature): Feature;
declare const _default: {
    toFlatCoordinates: typeof toFlatCoordinates;
    fromFlat3Coordinates: typeof fromFlat3Coordinates;
    fromFlatCoordinates: typeof fromFlatCoordinates;
    getOpenLayersFeature: typeof getOpenLayersFeature;
};
export default _default;
//# sourceMappingURL=GeoJSONUtils.d.ts.map