import { EventDispatcher, Vector2, Vector3 } from 'three';
import type Disposable from '../core/Disposable';
import type Instance from '../core/Instance';
import type PickResult from '../core/picking/PickResult';
import type { ShapePickResult } from '../entities/Shape';
import Shape, { type ShapeConstructorOptions } from '../entities/Shape';
/**
 * Various constraints that can be applied to shapes created by this tool.
 */
interface Permissions {
    insertPoint: boolean;
    movePoint?: boolean;
    removePoint?: boolean;
}
/**
 * A callback that can be used to test for a mouse button or key combination.
 * If the function returns `true`, the associated action is executed.
 */
export type MouseCallback = (e: MouseEvent) => boolean;
/**
 * A pick function that is used by the drawtool to interact with the scene.
 */
export type PickCallback<T extends PickResult = PickResult> = (eventOrCanvasCoordinate: MouseEvent | Vector2) => T[];
export type CommonCreationOptions = {
    /**
     * The optional signal to listen to cancel the creation of a shape.
     */
    signal?: AbortSignal;
    /**
     * The optional custom picking function.
     */
    pick?: PickCallback;
    /**
     * An optional callback to be called when a point has been moved.
     * @param shape - The shape being created.
     * @param position - The position of the point.
     */
    onTemporaryPointMoved?: (shape: Shape, position: Vector3) => void;
    /**
     * The input required to finish drawing the shape.
     * Does not apply to shapes that require a fixed number of points (i.e point, segment, etc).
     * @defaultValue right click
     */
    endCondition?: MouseCallback;
};
export type CreationOptions = Partial<ShapeConstructorOptions> & CommonCreationOptions;
/**
 * Options for the {@link DrawTool.createShape} method.
 */
export type CreateShapeOptions = Partial<ShapeConstructorOptions> & CommonCreationOptions & {
    /**
     * The minimum number of points to create before the shape can be completed.
     */
    minPoints?: number;
    /**
     * The maximum number of points to create before the shape is automatically completed.
     */
    maxPoints?: number;
    /**
     * If `true`, the shape's line will be closed just before being returned to the caller.
     */
    closeRing?: boolean;
    /**
     * An optional callback to be called when a point has been added to the shape.
     * @param shape - The shape being created.
     * @param index - The index of the point.
     * @param position - The position of the point.
     */
    onPointCreated?: (shape: Shape, index: number, position: Vector3) => void;
    /**
     * An optional list of permitted operations.
     */
    constraints?: Permissions;
};
export interface DrawToolEventMap {
    'start-drag': Record<string, unknown>;
    'end-drag': Record<string, unknown>;
}
/**
 * A hook that prevents the operation from occuring.
 */
export declare const inhibitHook: () => boolean;
/**
 * A hook that prevents the removal of a point if the new number of points is below a limit (e.g
 * removing a point of a 2-point LineString).
 */
export declare const limitRemovePointHook: (limit: number) => (options: {
    shape: Shape;
}) => boolean;
/**
 * A hook that ensures the ring remains closed after the first or last point of the ring is removed.
 */
export declare const afterRemovePointOfRing: (options: {
    shape: Shape;
    index: number;
}) => void;
/**
 * A hook that ensures the ring remains closed after the first or last point of the ring is moved.
 */
export declare const afterUpdatePointOfRing: (options: {
    shape: Shape;
    index: number;
    newPosition: Vector3;
}) => void;
export declare const conditions: {
    rightClick: MouseCallback;
    doubleClick: MouseCallback;
};
/**
 * A callback that is called after a shape has been modified.
 */
export type ShapeModifiedCallback<T> = (arg: {
    /**
     * The modified shape.
     */
    shape: Shape;
} & T) => void;
/**
 * Called when a point has been inserted in a shape during edition.
 */
export type PointInsertedCallback = ShapeModifiedCallback<{
    /**
     * The index of the inserted point.
     */
    pointIndex: number;
    /**
     * The position of the inserted point.
     */
    position: Vector3;
}>;
/**
 * Called when a point has been removed in a shape during edition.
 */
export type PointRemovedCallback = ShapeModifiedCallback<{
    /**
     * The index of the inserted point.
     */
    pointIndex: number;
}>;
/**
 * Called when a point has been moved during edition.
 */
export type PointUpdatedCallback = ShapeModifiedCallback<{
    /**
     * The index of the updated point.
     */
    pointIndex: number;
    /**
     * The new position of the updated point.
     */
    newPosition: Vector3;
}>;
/**
 * A tool that allows interactive creation and edition of {@link Shape}s.
 *
 * ## Creation
 *
 * To create shapes, you can either use one of the preset methods ({@link createSegment},
 * {@link createPolygon}...), or start creating a free shape with {@link createShape}.
 *
 * This method allows fine control over the constraints to apply to the shape (how many vertices,
 * styling options, what component to display...).
 *
 * ## Edition
 *
 * The {@link enterEditMode} method allows the user to edit any shape that the mouse interacts with.
 * Depending on the constraints put on the shape during the creation (assuming of course that the
 * shape was created with this tool), some operations might not be permitted.
 *
 * To exit edition mode, call {@link exitEditMode}.
 *
 * ### Examples of constraints
 *
 * - If a shape was created with the {@link createSegment} method, it is not possible to insert
 * or remove points, because the constraint forces the shape to have exactly 2 points.
 *
 * - If a shape was created with the {@link createPolygon} method, then any time the user moves the first or
 * last vertex, the other one is automatically moved at the same position, to ensure the shape
 * remains closed.
 */
export default class DrawTool extends EventDispatcher<DrawToolEventMap> implements Disposable {
    private readonly _domElement;
    private readonly _instance;
    private readonly _markerMaterial;
    private _selectedVertexMarker?;
    private _editionModeController?;
    private _inhibitEdition;
    private _mouseEventHandler;
    private _lastMouseCoordinate;
    constructor(options: {
        /**
         * The Giro3D instance.
         */
        instance: Instance;
        /**
         * The DOM element to listen to. If unspecified, this will use {@link Instance.domElement}.
         */
        domElement?: HTMLElement;
    });
    private onMouseEvent;
    private defaultPickShapes;
    private defaultPick;
    private hideVertexMarker;
    private displayVertexMarker;
    /**
     * Enter edition mode. In this mode, existing {@link Shape}s can be modified (add/remove points, move points).
     * @param options - The options.
     */
    enterEditMode(options?: {
        /**
         * The custom picking function. If unspecified, the default one will be used.
         */
        pick?: PickCallback;
        /**
         * A picking function to pick **shapes only**. If unspecified, the default one will be used.
         */
        pickShapes?: PickCallback<ShapePickResult>;
        /**
         * The optional callback called just before a point is clicked, to determine if it can be deleted.
         * By default, points are removed with a **click on the middle mouse button** or **Alt + Left click**.
         */
        onBeforePointRemoved?: MouseCallback;
        /**
         * The optional callback called just before a point is clicked, to determine if it can be moved.
         * By default, points are moved with a **left click**.
         */
        onBeforePointMoved?: MouseCallback;
        /**
         * The optional callback to test for mouse or key combination when a segment is clicked.
         * By default, points are inserted with a **left click**.
         */
        onSegmentClicked?: MouseCallback;
        /**
         * An optional callback called when a point has been inserted.
         */
        onPointInserted?: PointInsertedCallback;
        /**
         * An optional callback called when a point has been removed.
         */
        onPointRemoved?: PointRemovedCallback;
        /**
         * An optional callback called when a point has been updated (i.e moved).
         */
        onPointUpdated?: PointUpdatedCallback;
        /**
         * The shapes to edit. If `undefined` or empty, all shapes become editable.
         */
        shapesToEdit?: Shape[];
    }): void;
    /**
     * Exits edition mode.
     */
    exitEditMode(): void;
    private exitCreateMode;
    /**
     * Starts creating a {@link Shape} with the given parameters.
     * @param options - The shape creation options.
     * @returns A promise that eventually resolves with the created shape, or `null` if the creation
     * was cancelled.
     */
    createShape(options: CreateShapeOptions): Promise<Shape | null>;
    /**
     * Create a segment (straight line between two points).
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createSegment(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Creates a LineString {@link Shape}.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createLineString(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Creates a vertical measure {@link Shape} that displays the vertical distance between
     * the start and end point, as well as the angle between the segment formed by those points
     * and the horizontal plane. The shape looks like a right triangle.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createVerticalMeasure(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Creates a single point {@link Shape}.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createPoint(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Creates multiple point {@link Shape}s.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createMultiPoint(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Creates a polygon {@link Shape}.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createPolygon(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Create a closed ring {@link Shape}.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createRing(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Create a sector {@link Shape}.
     * @param options - The options.
     * @returns A promise that eventually returns the {@link Shape} or `null` if creation was cancelled.
     */
    createSector(options?: CreationOptions): Promise<Shape | null>;
    /**
     * Disposes unmanaged resources created by this instance.
     */
    dispose(): void;
}
export {};
//# sourceMappingURL=DrawTool.d.ts.map