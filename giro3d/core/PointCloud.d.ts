import { Points, type BufferGeometry, type EventDispatcher, type Material, type Object3DEventMap, type Vector2 } from 'three';
import PointCloudMaterial from '../renderer/PointCloudMaterial';
import type Disposable from './Disposable';
import type Extent from './geographic/Extent';
export interface PointCloudEventMap extends Object3DEventMap {
    'visibility-changed': unknown;
    dispose: unknown;
}
/** Options for constructing {@link PointCloud} */
export interface PointCloudOptions<M extends Material = Material> {
    /** Geometry */
    geometry: BufferGeometry;
    /** Material */
    material: M;
    /** Texture size */
    textureSize: Vector2;
    extent?: Extent;
}
/**
 * A point cloud object with geospatial properties.
 *
 */
declare class PointCloud<M extends PointCloudMaterial = PointCloudMaterial> extends Points<BufferGeometry, M> implements EventDispatcher<PointCloudEventMap>, Disposable {
    readonly isPointCloud: boolean;
    readonly type = "PointCloud";
    extent?: Extent;
    textureSize: Vector2;
    disposed: boolean;
    static isPointCloud(obj: unknown): obj is PointCloud;
    get level(): number;
    constructor(opts: PointCloudOptions<M>);
    setupMaterial(): void;
    private getPointValue;
    /**
     * Returns the intensity of the specified point.
     *
     * @param pointIndex - The index of the point.
     * @returns The intensity value for the specified point, or `undefined` if this point cloud does not support intensities.
     */
    getIntensity(pointIndex: number): number | undefined;
    /**
     * Returns the classification number of the specified point.
     *
     * @param pointIndex - The index of the point.
     * @returns The classification number for the specified point, or `undefined` if this point cloud does not support classifications.
     */
    getClassification(pointIndex: number): number | undefined;
    canProcessColorLayer(): boolean;
    getExtent(): Extent;
    dispose(): void;
}
export default PointCloud;
//# sourceMappingURL=PointCloud.d.ts.map