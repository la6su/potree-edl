import type { Polygon } from 'ol/geom';
import { Object3D } from 'three';
import type LineStringMesh from './LineStringMesh';
import type SimpleGeometryMesh from './SimpleGeometryMesh';
import type { DefaultUserData, SimpleGeometryMeshEventMap } from './SimpleGeometryMesh';
import type SurfaceMesh from './SurfaceMesh';
/**
 * Represents a single polygon geometry, including the surface and the rings.
 */
export default class PolygonMesh<UserData extends DefaultUserData = DefaultUserData> extends Object3D<SimpleGeometryMeshEventMap> implements SimpleGeometryMesh {
    readonly isSimpleGeometryMesh: true;
    readonly isPolygonMesh: true;
    readonly type: "PolygonMesh";
    readonly isExtruded: boolean;
    private _featureOpacity;
    private _surface;
    private _linearRings;
    readonly source: Polygon;
    userData: Partial<UserData>;
    get surface(): SurfaceMesh | null;
    set surface(newSurface: SurfaceMesh | null);
    get linearRings(): LineStringMesh<UserData>[] | null;
    set linearRings(newRings: LineStringMesh<UserData>[] | null);
    set opacity(opacity: number);
    constructor(options: {
        source: Polygon;
        surface?: SurfaceMesh;
        linearRings?: LineStringMesh<UserData>[];
        isExtruded?: boolean;
    });
    dispose(): void;
}
export declare function isPolygonMesh(obj: unknown): obj is PolygonMesh;
//# sourceMappingURL=PolygonMesh.d.ts.map