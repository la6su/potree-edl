import { Box3, EventDispatcher, Matrix4, PerspectiveCamera, type OrthographicCamera, type Sphere } from 'three';
import type Disposable from '../core/Disposable';
import Coordinates from '../core/geographic/Coordinates';
export interface CameraOptions {
    /** the THREE camera to use */
    camera?: PerspectiveCamera;
}
export interface ExternalControls extends EventDispatcher<{
    change: unknown;
}> {
    update(): void;
}
export declare const DEFAULT_MIN_NEAR_PLANE = 2;
export declare const DEFAULT_MAX_NEAR_PLANE = 2000000000;
type ViewEvents = {
    change: unknown;
};
/**
 * Adds geospatial capabilities to three.js cameras.
 */
declare class View extends EventDispatcher<ViewEvents> implements Disposable {
    private readonly _crs;
    private readonly _viewMatrix;
    private _camera;
    private _width;
    private _height;
    private _preSSE;
    private _maxFar;
    private _minNear;
    private _controls;
    private _onControlsUpdated;
    private _frustum;
    /**
     * The width, in pixels, of this view.
     */
    get width(): number;
    /**
     * The height, in pixels, of this view.
     */
    get height(): number;
    /**
     * Gets or sets the current camera.
     */
    get camera(): PerspectiveCamera | OrthographicCamera;
    set camera(c: PerspectiveCamera | OrthographicCamera);
    /**
     * @param crs - the CRS of this camera
     * @param width - the width in pixels of the camera viewport
     * @param height - the height in pixels of the camera viewport
     * @param options - optional values
     */
    constructor(crs: string, width: number, height: number, options?: CameraOptions);
    get crs(): string;
    get preSSE(): number;
    set preSSE(value: number);
    get viewMatrix(): Matrix4;
    get near(): number;
    /**
     * Gets or sets the distance to the near plane. The distance will be clamped to be within
     * the bounds defined by {@link minNearPlane} and {@link maxFarPlane}.
     */
    set near(distance: number);
    get far(): number;
    /**
     * Gets or sets the distance to the far plane. The distance will be clamped to be within
     * the bounds defined by {@link minNearPlane} and {@link maxFarPlane}.
     */
    set far(distance: number);
    /**
     * Gets or sets the maximum distance allowed for the camera far plane.
     */
    get maxFarPlane(): number;
    set maxFarPlane(distance: number);
    /**
     * Gets or sets the minimum distance allowed for the camera near plane.
     */
    get minNearPlane(): number;
    set minNearPlane(distance: number);
    /**
     * Gets the currently registered controls, if any.
     *
     * Note: To register controls, use {@link setControls}.
     */
    get controls(): ExternalControls | null;
    /**
     * Registers external controls that must be udpated periodically.
     *
     * Note: this is the case of simple controls in the  `examples/{js,jsm}/controls` folder
     * of THREE.js (e.g `MapControls`):
     *
     * - they fire `'change'` events when the controls' state has changed and the view must be rendered,
     * - they have an `update()` method to update the controls' state.
     *
     * For more complex controls, such as the package [`camera-controls`](https://www.npmjs.com/package/camera-controls),
     * a more complex logic is required. Please refer to the appropriate examples for a detailed
     * documentation on how to bind Giro3D and those controls.
     *
     * @param controls - The controls to register. If `null`, currently registered controls
     * are unregistered (they are not disabled however).
     */
    setControls(controls: ExternalControls | null): void;
    /**
     * Resets the near and far planes to their default value.
     */
    resetPlanes(): void;
    /**
     * @internal
     */
    update(width?: number, height?: number): void;
    private resize;
    /**
     * Return the position in the requested CRS, or in camera's CRS if undefined.
     *
     * @param crs - if defined (e.g 'EPSG:4236') the camera position will be
     * returned in this CRS
     * @returns Coordinates object holding camera's position
     */
    position(crs?: string): Coordinates;
    isBox3Visible(box3: Box3, matrixWorld?: Matrix4): boolean;
    isSphereVisible(sphere: Sphere, matrixWorld?: Matrix4): boolean;
    box3SizeOnScreen(box3: Box3, matrixWorld: Matrix4): Box3;
    private projectBox3PointsInCameraSpace;
    dispose(): void;
}
export default View;
//# sourceMappingURL=View.d.ts.map