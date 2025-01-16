import { EventDispatcher, Group, Object3D, Scene, Vector2, type ColorRepresentation, type WebGLRenderer, type WebGLRendererParameters } from 'three';
import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type Entity from '../entities/Entity';
import Entity3D from '../entities/Entity3D';
import C3DEngine from '../renderer/c3DEngine';
import type RenderingOptions from '../renderer/RenderingOptions';
import View, { type CameraOptions } from '../renderer/View';
import MainLoop from './MainLoop';
import { type MemoryUsageReport } from './MemoryUsage';
import type PickOptions from './picking/PickOptions';
import type PickResult from './picking/PickResult';
import type Progress from './Progress';
/** Frame event payload */
export type FrameEventPayload = {
    /** The frame number. */
    frame: number;
    /** Time elapsed since previous update loop, in milliseconds */
    dt: number;
    /** `true` if the update loop restarted */
    updateLoopRestarted: boolean;
};
/** Entity event payload */
export type EntityEventPayload = {
    /** Entity */
    entity: Entity;
};
/**
 * Events supported by
 * [`Instance.addEventListener()`](https://threejs.org/docs/#api/en/core/EventDispatcher.addEventListener)
 * and
 * [`Instance.removeEventListener()`](https://threejs.org/docs/#api/en/core/EventDispatcher.removeEventListener)
 */
export interface InstanceEvents {
    /**
     * Fires when an entity is added to the instance.
     */
    'entity-added': unknown;
    /**
     * Fires when an entity is removed from the instance.
     */
    'entity-removed': unknown;
    /**
     * Fires at the start of the update
     */
    'update-start': FrameEventPayload;
    /**
     * Fires before the camera update
     */
    'before-camera-update': {
        camera: View;
    } & FrameEventPayload;
    /**
     * Fires after the camera update
     */
    'after-camera-update': {
        camera: View;
    } & FrameEventPayload;
    /**
     * Fires before the entity update
     */
    'before-entity-update': EntityEventPayload & FrameEventPayload;
    /**
     * Fires after the entity update
     */
    'after-entity-update': EntityEventPayload & FrameEventPayload;
    /**
     * Fires before the render
     */
    'before-render': FrameEventPayload;
    /**
     * Fires after the render
     */
    'after-render': FrameEventPayload;
    /**
     * Fires at the end of the update
     */
    'update-end': FrameEventPayload;
    'picking-start': unknown;
    'picking-end': {
        /**
         * The duration of the picking, in seconds.
         */
        elapsed: number;
        /**
         * The picking results.
         */
        results?: PickResult<unknown>[];
    };
}
/**
 * The names of events supported by
 * [`Instance.addEventListener()`](https://threejs.org/docs/#api/en/core/EventDispatcher.addEventListener)
 * and
 * [`Instance.removeEventListener()`](https://threejs.org/docs/#api/en/core/EventDispatcher.removeEventListener).
 *
 * @deprecated Use InstanceEvents instead.
 */
export declare const INSTANCE_EVENTS: Record<string, keyof InstanceEvents>;
/** Options for creating Instance */
export interface InstanceOptions extends CameraOptions {
    /**
     * The container for the instance. May be either the `id` of an existing `<div>` element,
     * or the element itself.
     */
    target: string | HTMLDivElement;
    /**
     * The coordinate reference system of the scene.
     * Must be a cartesian system.
     * Must first be registered via {@link Instance.registerCRS}
     */
    crs: string;
    /**
     * The [Three.js Scene](https://threejs.org/docs/#api/en/scenes/Scene) instance to use,
     * otherwise a default one will be constructed
     */
    scene3D?: Scene;
    /**
     * The background color of the canvas. If `null`, the canvas is transparent.
     * If `undefined`, the default color is used.
     * @defaultValue `'#030508'`
     */
    backgroundColor?: ColorRepresentation | null;
    /**
     * The renderer to use. Might be either an instance of an existing {@link WebGLRenderer},
     * or options to create one. If `undefined`, a new one will be created with default parameters.
     */
    renderer?: WebGLRenderer | WebGLRendererParameters;
}
/**
 * Options for picking objects from the Giro3D {@link Instance}.
 */
export interface PickObjectsAtOptions extends PickOptions {
    /**
     * List of entities to pick from.
     * If not provided, will pick from all the objects in the scene.
     * Strings consist in the IDs of the object.
     */
    where?: (string | Object3D | Entity)[];
    /**
     * Indicates if the results should be sorted by distance, as Three.js raycasting does.
     * This prevents the `limit` option to be fully used as it is applied after sorting,
     * thus it may be slow and is disabled by default.
     *
     * @defaultValue false
     */
    sortByDistance?: boolean;
    /**
     * Indicates if features information are also retrieved from the picked object.
     * On complex objects, this may be slow, and therefore is disabled by default.
     *
     * @defaultValue false
     */
    pickFeatures?: boolean;
}
/**
 * The instance is the core component of Giro3D. It encapsulates the 3D scene,
 * the current camera and one or more {@link Entity | entities},
 * such as a {@link Map}.
 *
 * ```js
 * // Create a Giro3D instance in the EPSG:3857 coordinate system:
 * const instance = new Instance({
 *     target: 'view',
 *     crs: 'EPSG:3857',
 * });
 *
 * const map = new Map(...);
 *
 * // Add an entity to the instance
 * instance.add(map);
 *
 * // Bind an event listener on double click
 * instance.domElement.addEventListener('dblclick', () => console.log('double click!'));
 *
 * // Get the camera position
 * const position = instance.view.camera.position;
 *
 * // Set the camera position to be located 10,000 meters above the center of the coordinate system.
 * instance.view.camera.position.set(0, 0, 10000);
 * instance.view.camera.lookAt(lookAt);
 * ```
 */
declare class Instance extends EventDispatcher<InstanceEvents> implements Progress {
    private readonly _referenceCrs;
    private readonly _viewport;
    private readonly _mainLoop;
    private readonly _engine;
    private readonly _scene;
    private readonly _threeObjects;
    private readonly _view;
    private readonly _entities;
    private readonly _resizeObserver?;
    private readonly _pickingClock;
    private readonly _onContextRestored;
    private readonly _onContextLost;
    private _resizeTimeout?;
    private _disposed;
    /**
     * Constructs a Giro3D Instance
     *
     * @param options - Options
     *
     * ```js
     * const instance = new Instance({
     *   target: 'parentElement', // The id of the <div> to attach the instance
     *   crs: 'EPSG:3857',
     * });
     * ```
     */
    constructor(options: InstanceOptions);
    private onContextLost;
    private onContextRestored;
    /** Gets the canvas that this instance renders into. */
    get domElement(): HTMLCanvasElement;
    /** Gets the DOM element that contains the Giro3D viewport. */
    get viewport(): HTMLDivElement;
    /** Gets the CRS used in this instance. */
    get referenceCrs(): string;
    /** Gets whether at least one entity is currently loading data. */
    get loading(): boolean;
    /**
     * Gets the progress (between 0 and 1) of the processing of the entire instance.
     * This is the average of the progress values of all entities.
     * Note: This value is only meaningful is {@link loading} is `true`.
     * Note: if no entity is present in the instance, this will always return 1.
     */
    get progress(): number;
    /** Gets the main loop */
    get mainLoop(): MainLoop;
    /** Gets the rendering engine */
    get engine(): C3DEngine;
    /**
     * Gets the rendering options.
     *
     * Note: you must call {@link notifyChange | notifyChange()} to take
     * the changes into account.
     */
    get renderingOptions(): RenderingOptions;
    /**
     * Gets the underlying WebGL renderer.
     */
    get renderer(): WebGLRenderer;
    /**
     * Gets the underlying CSS2DRenderer.
     */
    get css2DRenderer(): CSS2DRenderer;
    /** Gets the [3D Scene](https://threejs.org/docs/#api/en/scenes/Scene). */
    get scene(): Scene;
    /** Gets the group containing native Three.js objects. */
    get threeObjects(): Group;
    /** Gets the view. */
    get view(): View;
    private _doUpdateRendererSize;
    private _updateRendererSize;
    /**
     * Dispose of this instance object. Free all memory used.
     *
     * Note: this *will not* dispose the following reusable objects:
     * - controls (because they can be attached and detached). For THREE.js controls, use
     * `controls.dispose()`
     * - Inspectors, use `inspector.detach()`
     * - any openlayers objects, please see their individual documentation
     *
     */
    dispose(): void;
    /**
     * Add THREE object or Entity to the instance.
     *
     * If the object or entity has no parent, it will be added to the default tree (i.e under
     * `.scene` for entities and under `.threeObjects` for regular Object3Ds.).
     *
     * If the object or entity already has a parent, then it will not be changed. Check that this
     * parent is present in the scene graph (i.e has the `.scene` object as ancestor), otherwise it
     * will **never be displayed**.
     *
     * @example
     * // Add Map to instance
     * instance.add(new Map(...);
     *
     * // Add Map to instance then wait for the map to be ready.
     * instance.add(new Map(...).then(...);
     * @param object - the object to add
     * @returns a promise resolved with the new layer object when it is fully initialized
     * or rejected if any error occurred.
     */
    add<T extends Object3D | Entity>(object: T): Promise<T>;
    /**
     * Removes the entity or THREE object from the scene.
     *
     * @param object - the object to remove.
     */
    remove(object: Object3D | Entity): void;
    /**
     * Notifies the scene it needs to be updated due to changes exterior to the
     * scene itself (e.g. camera movement).
     * non-interactive events (e.g: texture loaded)
     *
     * @param changeSources - The source(s) of the change. Might be a single object or an array.
     * @param options - Notification options.
     */
    notifyChange(changeSources?: unknown | unknown[], options?: {
        /**
         * Should we render the scene?
         * @defaultValue true
         */
        needsRedraw?: boolean;
        /**
         * Should the update be immediate? If `false`, the update is deferred to the
         * next animation frame.
         * @defaultValue false
         */
        immediate?: boolean;
    }): void;
    /**
     * Registers a new coordinate reference system.
     * This should be done before creating the instance.
     * This method can be called several times to add multiple CRS.
     *
     * ```js
     *  // register the CRS first...
     *  Instance.registerCRS(
     *  'EPSG:102115',
     *  '+proj=utm +zone=5 +ellps=clrk66 +units=m +no_defs +type=crs');
     *
     *  // ...then create the instance
     *  const instance = new Instance({ crs: 'EPSG:102115' });
     * ```
     * @param name - the short name, or EPSG code to identify this CRS.
     * @param value - the CRS definition, either in proj syntax, or in WKT syntax.
     */
    static registerCRS(name: string, value: string): void;
    /**
     * Get all top-level objects (entities and regular THREE objects), using an optional filter
     * predicate.
     *
     * ```js
     * // get all objects
     * const allObjects = instance.getObjects();
     * // get all object whose name includes 'foo'
     * const fooObjects = instance.getObjects(obj => obj.name === 'foo');
     * ```
     * @param filter - the optional filter predicate.
     * @returns an array containing the queried objects
     */
    getObjects(filter?: (obj: Object3D | Entity) => boolean): (Object3D | Entity)[];
    /**
     * Get all entities, with an optional predicate applied.
     *
     * ```js
     * // get all entities
     * const allEntities = instance.getEntities();
     *
     * // get all entities whose name contains 'building'
     * const buildings = instance.getEntities(entity => entity.name.includes('building'));
     * ```
     * @param filter - the optional filter predicate
     * @returns an array containing the queried entities
     */
    getEntities(filter?: (obj: Entity) => boolean): Entity[];
    /**
     * Executes the rendering.
     * Internal use only.
     *
     * @internal
     */
    render(): void;
    /**
     * Extract canvas coordinates from a mouse-event / touch-event.
     *
     * @param event - event can be a MouseEvent or a TouchEvent
     * @param target - The target to set with the result.
     * @param touchIdx - Touch index when using a TouchEvent (default: 0)
     * @returns canvas coordinates (in pixels, 0-0 = top-left of the instance)
     */
    eventToCanvasCoords(event: MouseEvent | TouchEvent, target: Vector2, touchIdx?: number): Vector2;
    /**
     * Extract normalized coordinates (NDC) from a mouse-event / touch-event.
     *
     * @param event - event can be a MouseEvent or a TouchEvent
     * @param target - The target to set with the result.
     * @param touchIdx - Touch index when using a TouchEvent (default: 0)
     * @returns NDC coordinates (x and y are [-1, 1])
     */
    eventToNormalizedCoords(event: MouseEvent | TouchEvent, target: Vector2, touchIdx?: number): Vector2;
    /**
     * Convert canvas coordinates to normalized device coordinates (NDC).
     *
     * @param canvasCoords - (in pixels, 0-0 = top-left of the instance)
     * @param target - The target to set with the result.
     * @returns NDC coordinates (x and y are [-1, 1])
     */
    canvasToNormalizedCoords(canvasCoords: Vector2, target: Vector2): Vector2;
    /**
     * Convert NDC coordinates to canvas coordinates.
     *
     * @param ndcCoords - The NDC coordinates to convert
     * @param target - The target to set with the result.
     * @returns canvas coordinates (in pixels, 0-0 = top-left of the instance)
     */
    normalizedToCanvasCoords(ndcCoords: Vector2, target: Vector2): Vector2;
    /**
     * Gets the object by it's id property.
     *
     * @param objectId - Object id
     * @returns Object found
     * @throws Error if object cannot be found
     */
    private objectIdToObject;
    /**
     * Return objects from some layers/objects3d under the mouse in this instance.
     *
     * @param mouseOrEvt - mouse position in window coordinates, i.e [0, 0] = top-left,
     * or `MouseEvent` or `TouchEvent`
     * @param options - Options
     * @returns An array of objects. Each element contains at least an object
     * property which is the Object3D under the cursor. Then depending on the queried
     * layer/source, there may be additionnal properties (coming from THREE.Raycaster
     * for instance).
     * If `options.pickFeatures` if `true`, `features` property may be set.
     *
     * ```js
     * instance.pickObjectsAt(mouseEvent)
     * instance.pickObjectsAt(mouseEvent, { radius: 1, where: [entity0, entity1] })
     * instance.pickObjectsAt(mouseEvent, { radius: 3, where: [entity0] })
     * ```
     */
    pickObjectsAt(mouseOrEvt: Vector2 | MouseEvent | TouchEvent, options?: PickObjectsAtOptions): PickResult[];
    /**
     * Moves the camera to look at an object.
     *
     * @param obj - Object to look at
     */
    focusObject(obj: Object3D | Entity3D): void;
    getMemoryUsage(): MemoryUsageReport;
}
export default Instance;
//# sourceMappingURL=Instance.d.ts.map