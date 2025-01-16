import { Box3, type Material, type Mesh, type Object3D, type Plane, type Vector2 } from 'three';
import type Context from '../core/Context';
import type MemoryUsage from '../core/MemoryUsage';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import type Pickable from '../core/picking/Pickable';
import type PickOptions from '../core/picking/PickOptions';
import type PickResult from '../core/picking/PickResult';
import type RenderingContextHandler from '../renderer/RenderingContextHandler';
import Entity, { type EntityEventMap, type EntityUserData } from './Entity';
export interface Entity3DEventMap extends EntityEventMap {
    /**
     * Fired when the entity opacity changed.
     */
    'opacity-property-changed': {
        opacity: number;
    };
    /**
     * Fired when the entity visibility changed.
     */
    'visible-property-changed': {
        visible: boolean;
    };
    /**
     * Fired when the entity's clipping planes have changed.
     */
    'clippingPlanes-property-changed': {
        clippingPlanes: Plane[] | null;
    };
    /**
     * Fired when the entity render order changed.
     */
    'renderOrder-property-changed': {
        renderOrder: number;
    };
    /**
     * Fired when the entity creates a new object
     */
    'object-created': {
        obj: Object3D;
    };
}
/**
 * Base class for any {@link Entity} that displays 3D objects.
 *
 * Subclasses *must* call `onObjectCreated` when creating new Object3D, before adding them to the
 * scene
 */
declare class Entity3D<TEventMap extends Entity3DEventMap = Entity3DEventMap, TUserData = EntityUserData> extends Entity<TEventMap & Entity3DEventMap, TUserData> implements Pickable, MemoryUsage, RenderingContextHandler {
    readonly isMemoryUsage: true;
    readonly type: string;
    readonly isPickable = true;
    /**
     * Read-only flag to check if a given object is of type Entity3D.
     */
    readonly isEntity3D: boolean;
    private _visible;
    private _opacity;
    private _object3d;
    protected _distance: {
        min: number;
        max: number;
    };
    get distance(): {
        min: number;
        max: number;
    };
    private _clippingPlanes;
    private _renderOrder;
    /**
     * Creates a Entity3D with the specified parameters.
     *
     * @param object3d - the root Three.js of this entity
     */
    constructor(object3d: Object3D);
    getMemoryUsage(_context: GetMemoryUsageContext): void;
    onRenderingContextLost(options: {
        canvas: HTMLCanvasElement;
    }): void;
    onRenderingContextRestored(options: {
        canvas: HTMLCanvasElement;
    }): void;
    /**
     * Returns the root object of this entity.
     */
    get object3d(): Object3D<import("three").Object3DEventMap>;
    /**
     * Gets or sets the visibility of this entity.
     * A non-visible entity will not be automatically updated.
     */
    get visible(): boolean;
    set visible(v: boolean);
    /**
     * Gets or sets the render order of this entity.
     */
    get renderOrder(): number;
    set renderOrder(v: number);
    /**
     * Gets or sets the opacity of this entity.
     */
    get opacity(): number;
    set opacity(v: number);
    /**
     * Gets or sets the clipping planes set on this entity. Default is `null` (no clipping planes).
     *
     * Note: custom entities must ensure that the materials and shaders used do support
     * the [clipping plane feature](https://threejs.org/docs/index.html?q=materi#api/en/materials/Material.clippingPlanes) of three.js.
     * Refer to the three.js documentation for more information.
     */
    get clippingPlanes(): Plane[] | null;
    set clippingPlanes(planes: Plane[] | null);
    /**
     * Updates the visibility of the entity.
     * Note: this method can be overriden for custom implementations.
     *
     */
    updateVisibility(): void;
    /**
     * Updates the opacity of the entity.
     * Note: this method can be overriden for custom implementations.
     */
    updateOpacity(): void;
    /**
     * Updates the render order of the entity.
     * Note: this method can be overriden for custom implementations.
     */
    updateRenderOrder(): void;
    /**
     * Updates the clipping planes of all objects under this entity.
     */
    updateClippingPlanes(): void;
    shouldCheckForUpdate(): boolean;
    shouldFullUpdate(updateSource: unknown): boolean;
    shouldUpdate(updateSource: unknown): boolean;
    /**
     * Returns true if this object belongs to this entity.
     *
     * @param obj - The object to test.
     */
    protected isOwned(obj: unknown): boolean;
    preUpdate(context: Context, changeSources: Set<unknown>): unknown[] | null;
    /**
     * Returns an approximated bounding box of this entity in the scene.
     *
     * @returns the resulting bounding box, or `null` if it could not be computed.
     */
    getBoundingBox(): Box3 | null;
    /**
     * Applies entity-level setup on new object's material.
     *
     * Subclasses can override this to setup custom logic, for instance if the entity can produce
     * objects that are naturally transparent.
     *
     * @param material - the material of the newly created object
     */
    protected setupMaterial(material: Material): void;
    /**
     * Applies entity-level setup on a new object.
     *
     * Note: this method should be called from the subclassed entity to notify the parent
     * class that a new 3D object has just been created, so that it can be setup with entity-wide
     * parameters.
     *
     * @example
     * // In the subclass
     * const obj = new Object3D();
     *
     * // Notify the parent class
     * this.onObjectCreated(obj);
     * @param obj - The object to prepare.
     */
    protected onObjectCreated(obj: Object3D): void;
    /**
     * Assigns the render order of this object.
     *
     * This may be overriden to perform custom logic.
     */
    protected assignRenderOrder(obj: Object3D): void;
    /**
     * Test whether this entity contains the given object.
     *
     * The object may be a component of the entity, or a 3D object.
     *
     * @param obj - The object to test.
     * @returns true if the entity contains the object.
     */
    contains(obj: unknown): boolean;
    /**
     * Traverses all materials in the hierarchy of this entity.
     *
     * @param callback - The callback.
     * @param root - The traversal root. If undefined, the traversal starts at the root
     * object of this entity.
     */
    traverseMaterials(callback: (arg0: Material) => void, root?: Object3D | undefined): void;
    /**
     * Traverses all meshes in the hierarchy of this entity.
     *
     * @param callback - The callback.
     * @param root - The raversal root. If undefined, the traversal starts at the root
     * object of this entity.
     */
    traverseMeshes(callback: (arg0: Mesh) => void, root?: Object3D | undefined): void;
    /**
     * Traverses all objects in the hierarchy of this entity.
     *
     * @param callback - The callback.
     * @param root - The traversal root. If undefined, the traversal starts at the root
     * object of this entity.
     */
    traverse(callback: (arg0: Object3D) => void, root?: Object3D | undefined): void;
    pick(canvasCoords: Vector2, options?: PickOptions): PickResult[];
}
export declare function isEntity3D(o: unknown): o is Entity3D;
export default Entity3D;
//# sourceMappingURL=Entity3D.d.ts.map