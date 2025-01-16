import type { ColorRepresentation } from 'three';
import { Color } from 'three';
import type Context from '../core/Context';
import type Extent from '../core/geographic/Extent';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
import type { EntityUserData } from './Entity';
import type { Entity3DEventMap } from './Entity3D';
import Entity3D from './Entity3D';
export declare const DEFAULT_STYLE: {
    color: Color;
    fontSize: number;
    numberFormat: Intl.NumberFormat;
};
/**
 * The grid step values.
 */
export interface Ticks {
    /** The tick distance on the x axis. */
    x: number;
    /** The tick distance on the y axis. */
    y: number;
    /** The tick distance on the z (vertical) axis. */
    z: number;
}
/**
 * The grid volume.
 */
export interface Volume {
    /** The grid volume extent. */
    extent: Extent;
    /** The elevation of the grid floor. */
    floor: number;
    /** The elevation of the grid ceiling. */
    ceiling: number;
}
/**
 * The grid formatting options.
 */
export interface Style {
    /** The grid line and label colors. */
    color: ColorRepresentation;
    /** The fontsize, in points (pt). */
    fontSize: number;
    /** The number format for the labels. */
    numberFormat: Intl.NumberFormat;
}
/**
 * Describes the starting point of the ticks.
 */
export declare enum TickOrigin {
    /**
     * Tick values represent distances to the grid's lower left corner
     */
    Relative = 0,
    /**
     * Tick values represent coordinates in the CRS of the scene.
     */
    Absolute = 1
}
/**
 * Create a 3D axis grid. This is represented as a box volume where each side of the box is itself a
 * grid.
 *
 * ```js
 * // Create a 200x200 meters extent
 * const extent = new Extent('EPSG:3857', -100, +100, -100, +100);
 *
 * // Create an AxisGrid on this extent, with the grid floor at zero meters,
 * // and the grid ceiling at 2500 meters.
 * //
 * // Display a tick (grid line), every 10 meters on the horizontal axes,
 * // and every 50 meters on the vertical axis.
 * const grid = new AxisGrid({
 *   volume: {
 *       extent,
 *       floor: 0,
 *       ceiling: 2500,
 *   },
 *   origin: TickOrigin.Relative,
 *   ticks: {
 *       x: 10,
 *       y: 10,
 *       z: 50,
 *   },
 * });
 * ```
 */
declare class AxisGrid<UserData = EntityUserData> extends Entity3D<Entity3DEventMap, UserData> {
    readonly type: "AxisGrid";
    /**
     * Read-only flag to check if a given object is of type AxisGrid.
     */
    readonly isAxisGrid: true;
    private readonly _root;
    private readonly _labelRoot;
    private readonly _labels;
    private readonly _labelElements;
    private _style;
    private _boundingSphere;
    private _boundingBoxCenter;
    private _origin;
    private _ticks;
    private _unitSuffix;
    private _material;
    private _cameraForward;
    private _showFloorGrid;
    private _showCeilingGrid;
    private _showSideGrids;
    private _disposed;
    private _volume;
    private _lastCamera;
    private _boundingBox;
    private _dimensions;
    private _arrowRoot;
    private _floor;
    private _ceiling;
    private _front;
    private _back;
    private _left;
    private _right;
    private _height;
    private _midHeight;
    private _needsRebuild;
    showHelpers: boolean;
    /**
     * Creates an instance of AxisGrid.
     *
     * @param options - The options.
     */
    constructor(options: {
        /**
         * The grid volume
         */
        volume: Volume;
        /**
         * The origin of the ticks volume
         * @defaultValue {@link TickOrigin.Relative}
         */
        origin?: TickOrigin;
        /**
         * The distance between grid lines.
         * @defaultValue 100 on each axis.
         */
        ticks?: Ticks;
        /**
         * The style to apply to lines and labels.
         */
        style?: Partial<Style>;
    });
    getMemoryUsage(context: GetMemoryUsageContext): void;
    updateOpacity(): void;
    /**
     * Gets or sets the style.
     * You will need to call {@link refresh} to recreate the grid.
     */
    get style(): Style;
    set style(v: Style);
    /**
     * Gets or sets the volume.
     * You will need to call {@link refresh} to recreate the grid.
     */
    get volume(): Volume;
    set volume(v: Volume);
    /**
     * Gets or sets the tick origin.
     * You will need to call {@link refresh} to recreate the grid.
     */
    get origin(): TickOrigin;
    set origin(v: TickOrigin);
    /**
     * Gets or sets the grid and label color.
     */
    get color(): ColorRepresentation;
    set color(color: ColorRepresentation);
    /**
     * Shows or hides labels.
     */
    get showLabels(): boolean;
    set showLabels(v: boolean);
    /**
     * Shows or hides the floor grid.
     */
    get showFloorGrid(): boolean;
    set showFloorGrid(v: boolean);
    /**
     * Shows or hides the ceiling grid.
     */
    get showCeilingGrid(): boolean;
    set showCeilingGrid(v: boolean);
    /**
     * Shows or hides the side grids.
     */
    get showSideGrids(): boolean;
    set showSideGrids(v: boolean);
    /**
     * Gets or sets the tick intervals.
     * You will need to call {@link refresh} to recreate the grid.
     */
    get ticks(): Ticks;
    set ticks(v: Ticks);
    /**
     * Rebuilds the grid. This is necessary after changing the ticks, volume or origin.
     */
    refresh(): void;
    private rebuildObjects;
    private removeLabels;
    updateVisibility(): void;
    private buildLabels;
    private deleteSides;
    private buildSides;
    /**
     * @param name - The name of the object.
     * @param width - The width of the plane.
     * @param height - The height of the plane.
     * @param xOffset - The starting offset on the X axis.
     * @param xStep - The distance between lines on the X axis.
     * @param yOffset - The starting offset on the Y axis.
     * @param yStep - The distance between lines on the Y axis.
     * @returns the mesh object.
     */
    private buildSide;
    private makeArrowHelper;
    private updateLabelsVisibility;
    private deleteArrowHelpers;
    private updateLabelEdgeVisibility;
    private updateSidesVisibility;
    preUpdate(context: Context): object[];
    private updateMinMaxDistance;
    dispose(): void;
}
export default AxisGrid;
//# sourceMappingURL=AxisGrid.d.ts.map