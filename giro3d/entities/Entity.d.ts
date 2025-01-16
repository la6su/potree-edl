import { EventDispatcher } from 'three';
import type Context from '../core/Context';
import type Disposable from '../core/Disposable';
import type Instance from '../core/Instance';
export interface EntityEventMap {
    initialized: unknown;
    'frozen-property-changed': {
        frozen: boolean;
    };
}
export type EntityUserData = Record<string, unknown>;
export type EntityPreprocessOptions = {
    instance: Instance;
};
/**
 * Abstract base class for all entities in Giro3D.
 * The Entity is the core component of Giro3D and represent an updatable
 * object that is added to an {@link core.Instance | Instance}.
 *
 * The class inherits three.js' [`EventDispatcher`](https://threejs.org/docs/index.html?q=even#api/en/core/EventDispatcher).
 *
 * ### The `userData` property
 *
 * The `userData` property can be used to attach custom data to the entity, in a type safe manner.
 * It is recommended to use this property instead of attaching arbitrary properties to the object:
 *
 * ```ts
 * type MyCustomUserData = {
 *   creationDate: Date;
 *   owner: string;
 * };
 * const entity: Entity<MyCustomUserData> = ...;
 *
 * entity.userData.creationDate = Date.now();
 * entity.userData.owner = 'John Doe';
 * ```
 *
 * ### Lifetime
 *
 * The lifetime of an entity follows this pattern: when the entity is added to an instance, its
 * {@link preprocess} method is called. When the promise
 * returned by this method resolves, the entity can be used in the main loop, where the update
 * methods (see below) will be used to update the entity over time. Finally, when the entity is
 * removed from the instance, its {@link dispose} method
 * is called to cleanup memory.
 *
 * ### The update methods
 *
 * This class exposes three methods to update the object:
 * - {@link Entity.preUpdate}
 * to determine which _parts_ of the object should actually be updated.
 * - {@link Entity.update} called for each part returned
 * by `preUpdate()`
 * - {@link Entity.postUpdate} to finalize
 * the update step.
 *
 * ### A note on "parts"
 *
 * The notion of "part to be updated" is entity-specific. For example, if the entity is a tiled map,
 * the parts may be map tiles. If the entity is a point cloud, it may be point clusters, and so on.
 * On the other hand, if the entity is not made of distinct objects, the "part to update" may be the
 * entity itself, or a dummy object.
 *
 * ```js
 * const instance = new Instance(...);
 * const entity = new Entity('exampleEntity');
 * instance.add(entity);
 * ```
 * @typeParam TEventMap - The event map of the entity.
 * @typeParam TUserData - The type of the `userData` property.
 */
declare abstract class Entity<TEventMap extends EntityEventMap = EntityEventMap, TUserData = EntityUserData> extends EventDispatcher<TEventMap & EntityEventMap> implements Disposable {
    /**
     * The unique identifier of this entity.
     */
    readonly id: string;
    private _frozen;
    private _ready;
    private _instance?;
    /**
     * Determine if this entity is ready to use.
     */
    get ready(): boolean;
    get instance(): Instance;
    /**
     * The name of this entity.
     */
    name: string | undefined;
    /**
     * An object that can be used to store custom data about the {@link Entity}.
     */
    readonly userData: TUserData;
    /**
     * Read-only flag to check if a given object is of type Entity.
     */
    readonly isEntity: boolean;
    /**
     * The name of the type of this object.
     */
    type: string;
    /**
     * Creates an entity with the specified unique identifier.
     */
    constructor();
    /**
     * Gets or sets the frozen status of this entity. A frozen entity is still visible
     * but will not be updated automatically.
     *
     * Useful for debugging purposes.
     */
    get frozen(): boolean;
    set frozen(v: boolean);
    /**
     * Gets whether this entity is currently loading data.
     */
    get loading(): boolean;
    /**
     * Gets the current loading progress (between 0 and 1).
     * Note: This property is only meaningful if {@link loading} is `true`.
     */
    get progress(): number;
    /**
     * Asynchronously preprocess the entity. This method may be overriden to perform
     * any operation that must be done before the entity can be used in the scene, such
     * as fetching metadata about a dataset, etc.
     *
     * @param opts - The preprocess options.
     *
     * @returns A promise that resolves when the entity is ready to be used.
     */
    protected preprocess(_opts: EntityPreprocessOptions): Promise<void>;
    /**
     * @internal
     */
    initialize(opts: EntityPreprocessOptions): Promise<void>;
    /**
     * This method is called before `update` to check if the MainLoop
     * should try to update this entity or not. For better performances,
     * it should return `false` if the entity has no impact on the
     * rendering (e.g. the element is not visible).
     *
     * The inherited child _can_ completely ignore this value if it makes sense.
     *
     * @returns `true` if should check for update
     */
    shouldCheckForUpdate(): boolean;
    /**
     * This method is called at the beginning of the `update` step to determine
     * if we should do a full render of the object. This should be the case if, for
     * instance, the source is the camera.
     *
     * You can override this depending on your needs. The inherited child should
     * not ignore this value, it should do a boolean OR, e.g.:
     * `return super.shouldFullUpdate(updateSource) || this.contains(updateSource);`
     *
     * @param updateSource - Source of change
     * @returns `true` if requires a full update of this object
     */
    shouldFullUpdate(updateSource: unknown): boolean;
    /**
     * This method is called at the beginning of the `update` step to determine
     * if we should re-render `updateSource`.
     * Not used when `shouldFullUpdate` returns `true`.
     *
     * You can override this depending on your needs.  The inherited child should
     * not ignore this value, it should do a boolean OR, e.g.:
     * `return super.shouldUpdate(updateSource) || this.contains(updateSource);`
     *
     * @param updateSource - Source of change
     * @returns `true` if requires an update of `updateSource`
     */
    shouldUpdate(updateSource: unknown): boolean;
    /**
     * Filters what objects need to be updated, based on `updatedSources`.
     * The returned objects are then passed to {@link preUpdate} and {@link postUpdate}.
     *
     * Inherited classes should override {@link shouldFullUpdate} and {@link shouldUpdate}
     * if they need to change this behavior.
     *
     * @param updateSources - Sources that triggered an update
     * @returns Set of objects to update
     */
    filterChangeSources(updateSources: Set<unknown>): Set<unknown>;
    /**
     * This method is called just before `update()` to filter and select
     * which _elements_ should be actually updated. For example, in the
     * case of complex entities made of a hierarchy of elements, the entire
     * hierarchy may not need to be updated.
     *
     * Use this method to optimize the update step by reducing the number
     * of elements to process.
     *
     * Note: if this functions returns nothing, `update()` will not be called.
     *
     * @param context - the update context.
     * @param changeSources - the objects that triggered an update step.
     * This is useful to filter out unnecessary updates if no sources are
     * relevant to this entity. For example, if one of the sources is a
     * camera that moved during the previous frame, any entity that depends
     * on the camera's field of view should be updated.
     * @returns the _elements_ to update during `update()`.
     */
    preUpdate(context: Context, changeSources: Set<unknown>): unknown[] | null;
    /**
     * Performs an update on an _element_ of the entity.
     *
     * Note: this method will be called for each element returned by `preUpdate()`.
     *
     * @param context - the update context.
     * This is the same object that the entity whose `update()` is being called.
     * @param element - the element to update.
     * This is one of the elements returned by {@link preUpdate}.
     * @returns New elements to update
     */
    update(context: Context, element: unknown): unknown[] | undefined | null;
    /**
     * Method called after {@link Entity.update}.
     *
     * @param context - the update context.
     * @param changeSources - the objects that triggered an update step.
     * This is useful to filter out unnecessary updates if no sources are
     * relevant to this entity. For example, if one of the sources is a
     * camera that moved during the previous frame, any entity that depends
     * on the camera's field of view should be updated.
     */
    postUpdate(context: Context, changeSources: Set<unknown>): void;
    /**
     * Disposes this entity and all resources associated with it.
     *
     * The default implementation of this method does nothing.
     * You should implement it in your custom entities to handle any special logic of disposal.
     *
     * For example: disposing materials, geometries, stopping HTTP requests, etc.
     *
     */
    dispose(): void;
    /**
     * Notifies the parent instance that a change occured in the scene.
     */
    protected notifyChange(source?: unknown | unknown[]): void;
}
export declare function isEntity(o: unknown): o is Entity;
export default Entity;
//# sourceMappingURL=Entity.d.ts.map