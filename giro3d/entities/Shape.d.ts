import type { Feature } from 'geojson';
import { Vector2, Vector3, type ColorRepresentation, type Object3D } from 'three';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import type PickOptions from '../core/picking/PickOptions';
import type PickResult from '../core/picking/PickResult';
import { type EntityUserData } from './Entity';
import Entity3D, { type Entity3DEventMap } from './Entity3D';
export type Formatter<T> = (values: T) => string | null;
export type LineLabelFormatOptions = {
    /**
     * The shape the lable belongs to.
     */
    shape: Shape;
    /**
     * The default formatter for line labels.
     */
    defaultFormatter: LineLabelFormatter;
    /**
     * The length of the segment or line, in CRS units.
     */
    length: number;
};
/**
 * A formatter for length values.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */
export type LineLabelFormatter = Formatter<LineLabelFormatOptions>;
export type SegmentLabelFormatOptions = {
    /**
     * The shape the lable belongs to.
     */
    shape: Shape;
    /**
     * The default formatter for segments.
     */
    defaultFormatter: SegmentLabelFormatter;
    /**
     * The length of the segment or line, in CRS units.
     */
    length: number;
    /**
     * The coordinate of the segment start.
     */
    start: Vector3;
    /**
     * The coordinate of the segment end.
     */
    end: Vector3;
};
/**
 * A formatter for segment values.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */
export type SegmentLabelFormatter = Formatter<SegmentLabelFormatOptions>;
export type VerticalLineFormatOptions = {
    /**
     * The shape the lable belongs to.
     */
    shape: Shape;
    /**
     * The default formatter used as fallback.
     */
    defaultFormatter: VerticalLineLabelFormatter;
    /**
     * The index of the vertex that this line is connected to.
     */
    vertexIndex: number;
    /**
     * The length of the line, in CRS units.
     */
    length: number;
};
/**
 * A formatter for vertical lines labels.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */
export type VerticalLineLabelFormatter = Formatter<VerticalLineFormatOptions>;
export type SurfaceFormatOptions = {
    shape: Shape;
    /**
     * The default formatter used as fallback.
     */
    defaultFormatter: SurfaceLabelFormatter;
    /**
     * The area to format, in CRS square units.
     */
    area: number;
};
/**
 * A formatter for the surface label.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */
export type SurfaceLabelFormatter = Formatter<SurfaceFormatOptions>;
export type SurfaceLabelPlacement = (params: {
    shape: Shape;
}) => Vector3;
export type VertexFormatOptions = {
    shape: Shape;
    /**
     * The default formatter for vertices.
     */
    defaultFormatter: VertexLabelFormatter;
    /**
     * The index of the vertex in the order in which they were defined.
     */
    index: number;
    /**
     * The position of the vertex in world space.
     */
    position: Vector3;
};
export type VertexLabelFormatter = Formatter<VertexFormatOptions>;
/**
 * A hook that is triggered just before a modification of the shape's points.
 * If the hook returns `false`, the operation is not performed.
 */
export type PreHook<T> = (args: T) => boolean;
/**
 * A hook that is triggered just after a modification of the shape's points.
 */
export type PostHook<T> = (args: T) => void;
/**
 * Hook options for point removal.
 */
export type RemovePointHook = {
    /**
     * The shape that triggered the hook.
     */
    shape: Shape;
    /**
     * The index of the removed point.
     */
    index: number;
    /**
     * The position of the point to remove.
     */
    position: Vector3;
};
/**
 * Hook options for point update.
 */
export type UpdatePointHook = {
    /**
     * The shape that triggered the hook.
     */
    shape: Shape;
    /**
     * The index of the updated point.
     */
    index: number;
    /**
     * The old position of the updated point.
     */
    oldPosition: Vector3;
    /**
     * The new position of the updated point.
     */
    newPosition: Vector3;
};
/**
 * Hook options for point insertion.
 */
export type InsertPointHook = {
    /**
     * The shape that triggered the hook.
     */
    shape: Shape;
    /**
     * The index of the inserted point.
     */
    index: number;
    /**
     * The position of the inserted point.
     */
    position: Vector3;
};
/**
 * The picking result for shapes.
 */
export type ShapePickResult = PickResult & {
    isShapePickResult: true;
    /**
     * The index of the picked vertex, otherwise `null`.
     */
    pickedVertexIndex?: number;
    /**
     * The index of the first point that makes the picked segment, otherwise `null`.
     */
    pickedSegment?: number;
    /**
     * `true` if the surface was picked, `false` otherwise.
     */
    pickedSurface?: boolean;
    /**
     * `true` if a label was picked, `false` otherwise.
     */
    pickedLabel?: boolean;
    entity: Shape;
};
export declare function isShapePickResult(obj?: unknown): obj is ShapePickResult;
export type ShapeExportOptions = {
    /**
     * Should the elevation/altitude of points be exported?
     * @defaultValue true
     */
    includeAltitudes?: boolean;
};
/**
 * A {@link VertexLabelFormatter} that displays the angle in degrees.
 *
 * Note: only acute angles (&lt; 180°) are supported.
 */
export declare const angleFormatter: Formatter<VertexFormatOptions>;
/**
 * A {@link SegmentLabelFormatter} that displays the slope of the segment in percent.
 */
export declare const slopeSegmentFormatter: SegmentLabelFormatter;
/**
 * A {@link SegmentLabelFormatter} that displays the slope of the segment in degrees.
 */
export declare const angleSegmentFormatter: SegmentLabelFormatter;
export declare const vertexHeightFormatter: Formatter<VertexFormatOptions>;
export declare const DEFAULT_SURFACE_OPACITY = 0.35;
export declare const DEFAULT_COLOR = "#2978b4";
export declare const DEFAULT_FONT_SIZE = 12;
export declare const DEFAULT_BORDER_WIDTH = 1;
export declare const DEFAULT_LINE_WIDTH = 2;
export declare const DEFAULT_VERTEX_RADIUS = 4;
export declare const DEFAULT_SHOW_VERTICES = true;
export declare const DEFAULT_SHOW_FLOOR_VERTICES = false;
export declare const DEFAULT_SHOW_LINE = true;
export declare const DEFAULT_SHOW_SURFACE = false;
export declare const DEFAULT_SHOW_VERTICAL_LINES = false;
export declare const DEFAULT_SHOW_FLOOR_LINE = false;
export type ShapeFontWeight = 'bold' | 'normal';
export interface ShapeConstructorOptions {
    /**
     * Show vertices.
     * @defaultValue {@link DEFAULT_SHOW_VERTICES}
     */
    showVertices?: boolean;
    /**
     * Shows the line that connects each vertex.
     * @defaultValue {@link DEFAULT_SHOW_LINE}
     */
    showLine?: boolean;
    /**
     * Shows the line that is the vertical projection of the line on the plane at the {@link floorElevation}.
     * @defaultValue {@link DEFAULT_SHOW_FLOOR_LINE}
     */
    showFloorLine?: boolean;
    /**
     * The floor elevation, in meters.
     * @defaultValue 0
     */
    floorElevation?: number;
    /**
     * Show vertical lines that connect each vertex to each floor vertex.
     * @defaultValue {@link DEFAULT_SHOW_VERTICAL_LINES}
     */
    showVerticalLines?: boolean;
    /**
     * Shows floor vertices.
     * @defaultValue {@link DEFAULT_SHOW_FLOOR_VERTICES}
     */
    showFloorVertices?: boolean;
    /**
     * Show the surface polygon.
     * @defaultValue {@link DEFAULT_SHOW_SURFACE}
     */
    showSurface?: boolean;
    /**
     * The opacity of the surface.
     * @defaultValue {@link DEFAULT_SURFACE_OPACITY}
     */
    surfaceOpacity?: number;
    /**
     * The specific opacity of the labels.
     * @defaultValue 1
     */
    labelOpacity?: number;
    /**
     * Make labels pickable.
     * @defaultValue false
     */
    pickableLabels?: boolean;
    /**
     * Display labels for vertical lines.
     * @defaultValue false
     */
    showVerticalLineLabels?: boolean;
    /**
     * Display labels for each segment of the line.
     * @defaultValue false
     */
    showSegmentLabels?: boolean;
    /**
     * Display a label for the entire line.
     * @defaultValue false
     */
    showLineLabel?: boolean;
    /**
     * Display a label for the surface.
     * @defaultValue false
     */
    showSurfaceLabel?: boolean;
    /**
     * Display a label for each vertex.
     * @defaultValue false
     */
    showVertexLabels?: boolean;
    /**
     * The main color of the shape. Affects lines, vertices, surfaces and labels.
     * @defaultValue {@link DEFAULT_COLOR}
     */
    color?: ColorRepresentation;
    /**
     * The radius, in pixels, of vertices.
     * @defaultValue {@link DEFAULT_VERTEX_RADIUS}
     */
    vertexRadius?: number;
    /**
     * The width, in pixels, of lines.
     * @defaultValue {@link DEFAULT_LINE_WIDTH}
     */
    lineWidth?: number;
    /**
     * The width, in pixels, of the border around vertices and lines.
     * @defaultValue {@link DEFAULT_BORDER_WIDTH}
     */
    borderWidth?: number;
    /**
     * The label font size.
     * @defaultValue {@link DEFAULT_FONT_SIZE}
     */
    fontSize?: number;
    /**
     * The label font weight.
     * @defaultValue `'bold'`
     */
    fontWeight?: ShapeFontWeight;
    /**
     * A custom formatter for the surface label.
     */
    surfaceLabelFormatter?: SurfaceLabelFormatter;
    /**
     * An optional function to compute the location of the surface label.
     */
    surfaceLabelPlacement?: SurfaceLabelPlacement;
    /**
     * A custom formatter for the line label.
     */
    lineLabelFormatter?: LineLabelFormatter;
    /**
     * A custom formatter for segment labels.
     */
    segmentLabelFormatter?: SegmentLabelFormatter;
    /**
     * A custom formatter for the vertex labels.
     */
    vertexLabelFormatter?: VertexLabelFormatter;
    /**
     * A custom formatter for vertical line labels.
     */
    verticalLineLabelFormatter?: VerticalLineLabelFormatter;
    /**
     * An optional hook to be called just before a point is removed.
     * If the hook returns `false`, the point is not removed.
     */
    beforeRemovePoint?: PreHook<RemovePointHook>;
    /**
     * An optional hook to be called just after a point is removed.
     */
    afterRemovePoint?: PostHook<RemovePointHook>;
    /**
     * An optional hook to be called just before a point is updated.
     * If the hook returns `false`, the point is not updated.
     */
    beforeUpdatePoint?: PreHook<UpdatePointHook>;
    /**
     * An optional hook to be called just after a point is updated.
     */
    afterUpdatePoint?: PostHook<UpdatePointHook>;
    /**
     * An optional hook to be called just before a point is inserted.
     * If the hook returns `false`, the point is not inserted.
     */
    beforeInsertPoint?: PreHook<InsertPointHook>;
    /**
     * An optional hook to be called just after a point is inserted.
     */
    afterInsertPoint?: PostHook<InsertPointHook>;
}
/**
 * An entity that displays a geometric shape made of connected vertices.
 *
 * ## Shape components
 *
 * A shape is made of several optional components:
 * - vertices
 * - main line
 * - secondary lines
 * - surface
 * - labels
 *
 * All components can be hidden. In that case the shape displays nothing, even though its
 * {@link visible} property is set to `true`.
 *
 * ### Vertices
 *
 * Vertices can be displayed for each point of the shape.
 *
 * ```js
 * const shape = new Shape(...);
 *
 * shape.showVertices = true;
 * shape.vertexRadius = 12; // pixels
 * ```
 *
 * Note: vertices do not have to be displayed for the points to be editable.
 *
 * ### Main line
 *
 * The _main line_ is the line that connects the `points` of the shape. This line can form a ring
 * if the shape is closed (with the {@link makeClosed | makeClosed()} method).
 *
 * Note: the main line can only be displayed if there are 2 or more vertices.
 *
 * ### Surface
 *
 * If the _main line_ is a ring, the surface can be displayed by toggling {@link showSurface}.
 * The surface has the same color as the shape, but its opacity can be changed with {@link surfaceOpacity}.
 *
 * Note: the surface can only be displayed if there are 4 or more vertices (and the first and last vertices must be equal).
 *
 * ### Secondary lines
 *
 * _Secondary lines_ are:
 * - vertical lines that connect each vertex to the _floor elevation_, toggled with {@link showVerticalLines}
 * - the horizontal line that connect each _floor vertex_, toggled by {@link showFloorLine}
 *
 * The elevation of the floor can be set with {@link floorElevation}.
 *
 * ### Floor vertices
 *
 * _Floor vertices_ are a secondary set of uneditable vertices that connect each main vertex to the
 * floor elevation. They can be toggled with {@link showFloorVertices}.
 *
 * ## Styling
 *
 * The shape can be styled with different parameters:
 * - {@link color} to set the color of all element of the shape, including labels.
 * - {@link lineWidth} to set the width of the lines, in pixels.
 * - {@link vertexRadius} to set the radius of vertices, in pixels.
 * - {@link borderWidth} to set the width of the border, in pixels.
 * - {@link dashSize} to change the size of the dashes of secondary lines
 *
 * Note: the border color is automatically computed to provide sufficient contrast from the main color.せtぽい
 *
 * ## Labels
 *
 * Labels can be displayed for various areas of the shape:
 * - Labels for each vertex (toggled with {@link showVertexLabels})
 * - Labels for each segment of the main line (toggled with {@link showSegmentLabels})
 * - Labels for each vertical line (toggled with {@link showVerticalLineLabels})
 * - A single label for the entirety of the main line (toggled with {@link showLineLabel})
 * - A single label for the surface (toggled with {@link showSurfaceLabel})
 *
 * ### Label styling
 *
 * Labels are DOM elements and are styled with three properties:
 * - {@link color}
 * - {@link fontSize}
 * - {@link fontWeight}
 *
 * ### Label formatting
 *
 * The text of each label is provided by a {@link Formatter}. The formatter either returns a `string`
 * or `null`. If `null`, the label is not displayed at all.
 *
 * |Type|Formatter|Default formatter|
 * |----|---------|-----------------|
 * |vertices|{@link VertexLabelFormatter}|Displays the vertex index|
 * |segments|{@link SegmentLabelFormatter}|Displays the length of the segment in metric units|
 * |line|{@link LineLabelFormatter}|Displays the length of the line in metric units|
 * |vertical lines|{@link VerticalLineLabelFormatter}|Displays the length of the line in metric units|
 * |surface|{@link SurfaceLabelFormatter}|Displays the area of the surface in square metric units|
 *
 * #### Formatter examples
 *
 * To display the parity of the vertex index:
 *
 * ```js
 * const parityFormatter = ({ vertexIndex }) => {
 *     if (vertexIndex % 2 === 0) {
 *         return 'even vertex';
 *     } else {
 *         return 'odd vertex';
 *     }
 * }
 *
 * const shape = new Shape({
 *     ...options,
 *     vertexLabelFormatter: parityFormatter
 * });
 * ```
 *
 * To display the length of segments in feet:
 *
 * ```js
 * const feetFormatter = ({ length }) => {
 *     return `${length * 3.28084} ft`;
 * }
 *
 * const shape = new Shape({
 *     ...options,
 *     segmentLabelFormatter: feetFormatter
 * });
 * ```
 *
 * To display the area of the surface in acres:
 *
 * ```js
 * const acresFormatter = ({ area }) => {
 *     return `${area * 0.000247105} acres`;
 * }
 *
 * const shape = new Shape({
 *     ...options,
 *     surfaceLabelFormatter: acresFormatter
 * });
 * ```
 * ## Hooks
 *
 * Each operation that modifies the list of the points ({@link updatePoint}, {@link removePoint},
 * {@link insertPoint}, but not {@link setPoints}) triggers two hooks:
 * - a {@link PreHook} before the operation
 * - a {@link PostHook} after the operation.
 *
 * The {@link PreHook} can be used to cancel the operation by returning `false`.
 *
 * Hooks can be used to enforce constraints. For example to prevent removal of points
 * such that the number of points becomes insufficient to represent a polygon.
 *
 * ```js
 * const beforeRemovePoint = ({ shape }) => {
 *     // Prevent removal of points if we are already at the
 *     // minimum number of vertices to display a polygon
 *     if (shape.points.length < 4) {
 *         return false;
 *     }
 *
 *     return true;
 * }
 * ```
 *
 * {@link PostHook}s can be used to update the shape after an operation.
 *
 * For example, suppose we have a 2-point shape, and we want to ensure that both points have the
 * same elevation (Z coordinate). Whenever a point is moved, we might also want to update the
 * other point.
 *
 * ```js
 * const afterUpdatePoint = ({ shape, index, newPosition }) => {
 *     const z = newPosition.z;
 *
 *     const otherIndex = index === 0 ? 1 : 0;
 *     const other = shape.points[otherIndex];
 *
 *     // Prevent infinite recursion by checking that
 *     // the point is not already at the correct height.
 *     if (other.z !== z) {
 *         shape.updatePoint(otherIndex, new Vector3(other.x, other.y, z));
 *     }
 * }
 * ```
 *
 * ```js
 * const shape = new Shape({
 *     ...options,
 *     afterUpdatePoint,
 * });
 * ```
 *
 * @typeParam UserData - The type of the {@link userData} property.
 */
export default class Shape<UserData extends EntityUserData = EntityUserData> extends Entity3D<Entity3DEventMap, UserData> {
    readonly isShape: true;
    readonly type: "Shape";
    private readonly _points;
    private readonly _segments;
    private readonly _formatLine;
    private readonly _formatSegment;
    private readonly _formatVerticalLine;
    private readonly _formatSurface;
    private readonly _surfaceLabelPlacement;
    private readonly _formatVertex;
    private _lineWidth;
    private _borderWidth;
    private _depthTest;
    private _color;
    private _contrastColor;
    private _fontSize;
    private _fontWeight;
    private _pickableLabels;
    private readonly _lengthLabels;
    private readonly _vertexLabels;
    private readonly _heightLabels;
    private _areaLabel?;
    private _showSegmentLabels;
    private _showVerticalLineLabels;
    private _showLineLabel;
    private _showSurfaceLabel;
    private _showVertexLabels;
    private _labelOpacity;
    private _mainLine?;
    private _showLine;
    private readonly _innerLineMaterial;
    private readonly _outerLineMaterial;
    private _floorElevation;
    private readonly _innerSecondaryLineMaterial;
    private readonly _outerSecondaryLineMaterial;
    private _floorLine?;
    private _showFloorLine;
    private readonly _verticalLines;
    private _showVerticalLines;
    private _surface?;
    private _showSurface;
    private readonly _surfaceMaterial;
    private _surfaceOpacity;
    private _vertexRadius;
    private readonly _innerVertexMaterial;
    private readonly _outerVertexMaterial;
    private _showVertices;
    private readonly _vertices;
    private _showFloorVertices;
    private readonly _floorVertices;
    private readonly _beforeRemovePoint?;
    private readonly _afterRemovePoint?;
    private readonly _beforeUpdatePoint?;
    private readonly _afterUpdatePoint?;
    private readonly _beforeInsertPoint?;
    private readonly _afterInsertPoint?;
    /**
     * Creates a {@link Shape}.
     * @param options - The constructor options.
     */
    constructor(options?: ShapeConstructorOptions);
    /**
     * Gets or sets the specific opacity factor of the surface.
     * The final opacity of the surface is the product of this value with {@link opacity}.
     */
    get surfaceOpacity(): number;
    set surfaceOpacity(v: number);
    /**
     * Gets or sets the opacity factor of the labels.
     * The final opacity of the label is the product of this value with {@link opacity}.
     */
    get labelOpacity(): number;
    set labelOpacity(v: number);
    /**
     * Toggles depth test on or off.
     */
    get depthTest(): boolean;
    set depthTest(v: boolean);
    /**
     * Gets or sets the radius of the vertices, in pixels.
     */
    get vertexRadius(): number;
    set vertexRadius(radius: number);
    /**
     * Gets or sets the color of the shape.
     */
    get color(): ColorRepresentation;
    set color(c: ColorRepresentation);
    /**
     * Toggle the display of vertical distances (distances from each vertex to a defined elevation).
     */
    get showVerticalLines(): boolean;
    set showVerticalLines(show: boolean);
    /**
     * Toggle the display of floor line.
     */
    get showFloorLine(): boolean;
    set showFloorLine(show: boolean);
    /**
     * Toggle the dash on lines.
     */
    get dashed(): boolean;
    set dashed(dashed: boolean);
    /**
     * The dash size.
     */
    get dashSize(): number;
    set dashSize(size: number);
    /**
     * The floor elevation for the vertical lines.
     */
    get floorElevation(): number;
    set floorElevation(floor: number);
    /**
     * Toggle the display of vertices.
     */
    get showVertices(): boolean;
    set showVertices(show: boolean);
    /**
     * Toggle the display of floor vertices.
     */
    get showFloorVertices(): boolean;
    set showFloorVertices(show: boolean);
    /**
     * Gets or sets the line width, in pixels.
     */
    get lineWidth(): number;
    set lineWidth(width: number);
    /**
     * Gets or sets the font weight.
     * @defaultValue {@link DEFAULT_FONT_WEIGHT}
     */
    get fontWeight(): ShapeFontWeight;
    set fontWeight(v: ShapeFontWeight);
    /**
     * Gets or sets the font size, in pixels.
     * @defaultValue {@link DEFAULT_FONT_SIZE}
     */
    get fontSize(): number;
    set fontSize(v: number);
    /**
     * Gets or sets the border width, in pixels.
     */
    get borderWidth(): number;
    set borderWidth(width: number);
    /**
     * Toggle display of the line.
     */
    get showLine(): boolean;
    set showLine(show: boolean);
    /**
     * Returns the current vertex collection as a read-only array.
     *
     * Note: to modify the point collection, use {@link setPoints} instead.
     */
    get points(): Readonly<Vector3[]>;
    /**
     * Inserts a point at the specified index.
     * @param index - The point index.
     * @param position - The position of the point.
     */
    insertPoint(index: number, position: Vector3): void;
    /**
     * Removes the point at the given index.
     * @param index - The index of the point to update.
     */
    removePoint(index: number): void;
    /**
     * Sets the position of an existing point.
     * @param index - The index of the point to update.
     * @param newPosition - The new position of the point.
     */
    updatePoint(index: number, newPosition: Vector3): void;
    /**
     * Sets the points of the shape.
     * @param points - The points. If `null`, all points are removed.
     */
    setPoints(points?: Vector3[]): void;
    /**
     * Returns the point just before the specified index, taking into account closed lines.
     * @param index - The point index.
     * @returns The location of the previous point, if any, otherwise `null`.
     *
     * Note: if the line is not closed, requesting the point before index zero will return null,
     * but if the line is closed, it will return the point before the last one.
     */
    getPreviousPoint(index: number): Vector3 | null;
    /**
     * Returns the point just after the specified index, taking into account closed lines.
     * @param index - The point index.
     * @returns The location of the next point, if any, otherwise `null`.
     *
     * Note: if the line is not closed, requesting the point after index (n - 1) will return null,
     * but if the line is closed, it will return the point after the first one.
     */
    getNextPoint(index: number): Vector3 | null;
    /**
     * Gets the area of this shape, if any.
     *
     * Note: if the shape is not a closed shape, returns `null`.
     * @returns The area, in CRS units.
     */
    getArea(): number | null;
    /**
     * Gets the length of the line of this shape, if any. If the shape has less than 2 points,
     * returns `null`.
     *
     * Note: if the shape is a closed shape, this equals the perimeter of the shape.
     *
     * @returns The length, in CRS units.
     */
    getLength(): number | null;
    /**
     * Make labels pickable.
     */
    get pickableLabels(): boolean;
    set pickableLabels(v: boolean);
    /**
     * Toggle the labels for each segment.
     */
    get showSegmentLabels(): boolean;
    set showSegmentLabels(show: boolean);
    /**
     * Toggle the vertical line labels (one label per vertical line).
     */
    get showVerticalLineLabels(): boolean;
    set showVerticalLineLabels(show: boolean);
    /**
     * Toggle the label for the entire line.
     */
    get showLineLabel(): boolean;
    set showLineLabel(show: boolean);
    /**
     * Toggle the surface label.
     */
    get showSurfaceLabel(): boolean;
    set showSurfaceLabel(show: boolean);
    /**
     * Toggle the vertex labels.
     */
    get showVertexLabels(): boolean;
    set showVertexLabels(show: boolean);
    /**
     * Toggle the display of the surface.
     */
    get showSurface(): boolean;
    set showSurface(show: boolean);
    /**
     * Ensures that the line makes a closed ring, by duplicating
     * the first point as the last point, if necessary.
     */
    makeClosed(): void;
    /**
     * Gets whether the line is closed.
     *
     * Note: To close the line, use {@link makeClosed}.
     */
    get isClosed(): boolean;
    updateRenderOrder(): void;
    updateVisibility(): void;
    private updateLabelOpacity;
    updateOpacity(): void;
    /**
     * Rebuilds all labels. Useful if the formatter functions have changed.
     */
    rebuildLabels(): void;
    /**
     * Returns the closest point on the line to the specified point.
     * @param point - The point to test.
     * @returns An object containing the location of the closest point, as well as the index of the
     * first point that makes the segment in which the point was found.
     */
    getClosestPointOnLine(point: Vector3): {
        point: Vector3;
        previousPointIndex: number;
    };
    pick(canvasCoordinates: Vector2, _options?: PickOptions): ShapePickResult[];
    /**
     * Returns the GeoJSON (in WGS84 coordinates) feature equivalent to this shape.
     */
    toGeoJSON(options?: ShapeExportOptions): Feature;
    /**
     * Returns the OpenLayers feature (in WGS84 coordinates) equivalent to this shape.
     */
    toOpenLayersFeature(options?: ShapeExportOptions): import("ol").Feature<import("ol/geom").Geometry>;
    private visitMaterials;
    private updateDepthTest;
    private visitVertices;
    private visitLines;
    preUpdate(): unknown[] | null;
    private visitLabels;
    private updateLabels;
    private makeVertex;
    private rebuildVertices;
    onObjectCreated(obj: Object3D): void;
    private rebuildLine;
    private updateStyle;
    private createLabel;
    private rebuildSurface;
    private rebuildSurfaceLabel;
    private rebuildVerticalLineLabels;
    private rebuildLineLabels;
    private rebuildVertexLabels;
    private rebuildFloorLine;
    private rebuildVerticalLines;
    private rebuildGeometries;
    private buildSegmentListIfNecessary;
    private pickLabels;
    private raycastLabel;
    /**
     * Raycast each vertex and returns the index of the first intersected vertex, or null if none.
     */
    private raycastVertices;
    private raycastMainLine;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    /**
     * Disposes the shape.
     */
    dispose(): void;
    private getGeoJSONGeometry;
}
/**
 * A type predicate to test if the object is a {@link Shape}.
 */
export declare function isShape(o: unknown): o is Shape;
//# sourceMappingURL=Shape.d.ts.map