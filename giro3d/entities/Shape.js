import proj from 'proj4';
import earcut from 'earcut';
import { BufferGeometry, Color, CurvePath, DoubleSide, Float32BufferAttribute, FrontSide, Group, Line3, LineCurve3, MathUtils, Mesh, MeshBasicMaterial, Raycaster, Sphere, Triangle, Vector2, Vector3 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { getGeometryMemoryUsage } from '../core/MemoryUsage';
import ConstantSizeSphere, { getWorldSpaceRadius } from '../renderer/ConstantSizeSphere';
import { getContrastColor } from '../utils/ColorUtils';
import GeoJSONUtils from '../utils/GeoJSONUtils';
import Entity3D from './Entity3D';
const tmpMidPoint = new Vector3();
const tmpNDC = new Vector2();
const sRGB = new Color();
const tmpSphere = new Sphere();
const tmpIntersection = new Vector3();
const DEFAULT_PICKING_RADIUS = 6;
function toNumberArray(vectors, origin) {
  const result = new Float32Array(vectors.length * 3);
  for (let i = 0; i < vectors.length; i++) {
    const v = vectors[i];
    result[i * 3 + 0] = v.x - origin.x;
    result[i * 3 + 1] = v.y - origin.y;
    result[i * 3 + 2] = v.z - origin.z;
  }
  return result;
}

/**
 * A formatter for length values.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */

/**
 * A formatter for segment values.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */

/**
 * A formatter for vertical lines labels.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */

/**
 * A formatter for the surface label.
 *
 * Note: if the formatter returns `null`, the label is not displayed.
 */

// eslint-disable-next-line no-use-before-define

/**
 * A hook that is triggered just before a modification of the shape's points.
 * If the hook returns `false`, the operation is not performed.
 */

/**
 * A hook that is triggered just after a modification of the shape's points.
 */

/**
 * Hook options for point removal.
 */

/**
 * Hook options for point update.
 */

/**
 * Hook options for point insertion.
 */

const tmpIntersectList = [];
const KILOMETER = 1000;
const SQ_KILOMETER = KILOMETER * KILOMETER;

/**
 * The picking result for shapes.
 */

export function isShapePickResult(obj) {
  return obj?.isShapePickResult;
}
// eslint-disable-next-line no-use-before-define
function defaultLabelPlacement(options) {
  const {
    points
  } = options.shape;

  // Special case of the triangle: use the barycentre
  if (points.length === 3 || points.length === 4 && points[0].equals(points[3])) {
    const triangle = new Triangle(points[0], points[1], points[2]);
    return triangle.getMidpoint(new Vector3());
  }
  const sum = points.reduce((prev, cur) => {
    return prev.clone().add(cur);
  });
  return new Vector3(sum.x / points.length, sum.y / points.length, sum.z / points.length);
}
function setOpacity(material, opacity) {
  const current = material.opacity;
  if (current !== opacity) {
    const transparent = material.transparent;
    material.opacity = opacity;
    const newTransparent = opacity < 1;
    if (transparent !== newTransparent) {
      material.needsUpdate = true;
      material.transparent = newTransparent;
    }
  }
}
const DEFAULT_NUMBER_FORMAT = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});
function getAngle(A, B, C) {
  const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
  const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
  const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

/**
 * A {@link VertexLabelFormatter} that displays the angle in degrees.
 *
 * Note: only acute angles (&lt; 180°) are supported.
 */
export const angleFormatter = params => {
  const {
    index,
    position,
    shape
  } = params;
  const A = shape.getPreviousPoint(index);
  const B = position;
  const C = shape.getNextPoint(index);
  if (A != null && B != null && C != null) {
    const angleRadians = getAngle(A, B, C);
    const angleDegrees = MathUtils.radToDeg(angleRadians);
    return `${angleDegrees.toFixed(1)}°`;
  }
  return null;
};

/**
 * A {@link SegmentLabelFormatter} that displays the slope of the segment in percent.
 */
export const slopeSegmentFormatter = params => {
  const {
    start,
    end
  } = params;
  const z = Math.min(start.z, end.z);
  const height = Math.max(start.z, end.z) - Math.min(start.z, end.z);
  const distance = new Vector3(start.x, start.y, z).distanceTo(new Vector3(end.x, end.y, z));
  const sign = start.z > end.z ? -1 : 1;
  return `${(sign * (height / distance) * 100).toFixed(1)}%`;
};

/**
 * A {@link SegmentLabelFormatter} that displays the slope of the segment in degrees.
 */
export const angleSegmentFormatter = params => {
  const {
    start,
    end,
    length
  } = params;
  const opposite = Math.max(start.z, end.z) - Math.min(start.z, end.z);
  let angle = MathUtils.radToDeg(Math.asin(opposite / length));
  if (start.z > end.z) {
    angle = -angle;
  }
  return `${angle.toFixed(1)}°`;
};
export const vertexHeightFormatter = options => {
  const z = options.position.z;
  return `${z.toFixed(1)} m`;
};

/**
 * Formats the length into a readable string.
 * @param length - The length of the line or segment.
 */

function defaultLengthFormatter(opts) {
  let unit;
  let value;
  const {
    length
  } = opts;
  if (length > KILOMETER * 10) {
    value = length / KILOMETER;
    unit = 'km';
  } else {
    value = length;
    unit = 'm';
  }
  return `${DEFAULT_NUMBER_FORMAT.format(value)} ${unit}`;
}

/**
 * Formats the length count into a readable string.
 * @param length - The length of the line or segment.
 */
function defaultVerticalLineFormatter(opts) {
  return defaultLengthFormatter(opts);
}

/**
 * Formats the area into a readable string.
 * @param area - The area in CRS units.
 */
function defaultAreaFormatter(opts) {
  let unit;
  let value;
  const {
    area
  } = opts;
  if (area > SQ_KILOMETER * 10) {
    value = area / SQ_KILOMETER;
    unit = 'km²';
  } else {
    value = area;
    unit = 'm²';
  }
  return `${DEFAULT_NUMBER_FORMAT.format(value)} ${unit}`;
}

/**
 * Formats the label associated with a vertex into a readable string.
 */
function defaultVertexFormatter(opts) {
  return `${opts.index}`;
}
function getClosedPolygon(points) {
  if (!points[points.length - 1].equals(points[0])) {
    return [...points, points[0]];
  }
  return points;
}
function computeArea(points, computeGeometry) {
  if (points.length < 2) {
    return {
      area: undefined,
      geometry: undefined
    };
  }

  // Let's have relative point to avoid jittering
  const origin = points[0];
  const closedPolygon = getClosedPolygon(points);
  const indices = earcut(toNumberArray(points, origin), undefined, 3);
  let geometry = undefined;
  if (computeGeometry) {
    const coordinateAsNumbers = toNumberArray(closedPolygon, origin);
    geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(coordinateAsNumbers, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
  }
  const triangleCount = indices.length / 3;
  let area = 0;
  for (let i = 0; i < triangleCount; i++) {
    const a = points[indices[i * 3 + 0]];
    const b = points[indices[i * 3 + 1]];
    const c = points[indices[i * 3 + 2]];
    if (a == null || b == null || c == null) {
      continue;
    }
    const triangle = new Triangle(a, b, c);
    area += triangle.getArea();
  }
  return {
    area,
    geometry,
    origin
  };
}
export const DEFAULT_SURFACE_OPACITY = 0.35;
const VERTICAL_LINE_WIDTH_FACTOR = 1;

// The Giro3D blue
export const DEFAULT_COLOR = '#2978b4';
export const DEFAULT_FONT_SIZE = 12; // pixels
export const DEFAULT_BORDER_WIDTH = 1; // pixels
export const DEFAULT_LINE_WIDTH = 2; // pixels
export const DEFAULT_VERTEX_RADIUS = 4; // pixels
export const DEFAULT_SHOW_VERTICES = true;
export const DEFAULT_SHOW_FLOOR_VERTICES = false;
export const DEFAULT_SHOW_LINE = true;
export const DEFAULT_SHOW_SURFACE = false;
export const DEFAULT_SHOW_VERTICAL_LINES = false;
export const DEFAULT_SHOW_FLOOR_LINE = false;
class Vertex extends Group {
  isVertex = true;
  type = 'Vertex';
  _borderWidth = DEFAULT_BORDER_WIDTH;
  _radius = DEFAULT_VERTEX_RADIUS;
  get radius() {
    return this._radius;
  }
  set radius(radius) {
    if (this._radius !== radius) {
      this._radius = radius;
      this.update();
    }
  }
  get borderWidth() {
    return this._borderWidth;
  }
  set borderWidth(width) {
    if (this._borderWidth !== width) {
      this._borderWidth = width;
      this.update();
    }
  }
  update() {
    this._inner.radius = this._radius;
    if (this._borderWidth > 0) {
      this._outer.radius = this._radius + this._borderWidth;
      this._outer.visible = true;
    } else {
      this._outer.visible = false;
    }
    this.updateMatrixWorld(true);
  }
  constructor(innerMaterial, outerMaterial) {
    super();
    this._inner = new ConstantSizeSphere({
      radius: this._radius,
      material: innerMaterial
    });
    this._outer = new ConstantSizeSphere({
      radius: this._radius,
      material: outerMaterial
    });
    this.add(this._inner);
    this.add(this._outer);
    this.update();
    this.updateMatrixWorld(true);
  }
  raycast(raycaster, intersects) {
    this._inner.raycast(raycaster, intersects);
  }
  setRenderOrder(inner, border) {
    this._inner.renderOrder = inner;
    this._outer.renderOrder = border;
  }
}
function updateResolution(material, renderer) {
  // We have to specify the screen size to be able to properly render
  // lines that have a width in pixels. Note that this should be automatically done
  // by three.js in the future, but for now we have to do it manually.
  const {
    width,
    height
  } = renderer.getRenderTarget() ?? renderer.getContext().canvas;
  material.resolution.set(width, height);
}
function setOnBeforeRender(material) {
  return renderer => {
    updateResolution(material, renderer);
  };
}
class Label extends CSS2DObject {
  type = 'Label';
  isLabel = true;
  get pickable() {
    return this.span.style.pointerEvents !== 'none';
  }
  set pickable(v) {
    this.span.style.pointerEvents = v ? 'auto' : 'none';
  }
  constructor(container, span) {
    super(container);
    this.span = span;
  }
}

/**
 * Represents a line with a border.
 * This is displayed using two lines with different
 * render orders and thickness to simulate the border.
 */
class LineWithBorder extends Group {
  isLineWithBorder = true;
  type = 'LineWithBorder';
  userData = {
    midPoint: new Vector3(),
    length: 0
  };
  constructor(lineMaterial, borderMaterial, points) {
    super();
    const geom = new LineGeometry();
    const positions = new Float32Array(points.length * 3);
    const first = points[0];

    // Let's have relative point to avoid jittering
    for (let i = 0; i < points.length; i++) {
      positions[i * 3 + 0] = points[i].x - first.x;
      positions[i * 3 + 1] = points[i].y - first.y;
      positions[i * 3 + 2] = points[i].z - first.z;
    }
    geom.setPositions(positions);
    geom.computeBoundingSphere();
    geom.computeBoundingBox();
    this._innerLine = new Line2(geom, lineMaterial);
    this._outerLine = new Line2(geom, borderMaterial);
    this._innerLine.computeLineDistances();
    this._outerLine.computeLineDistances();
    this.add(this._innerLine);
    this.add(this._outerLine);
    this._innerLine.onBeforeRender = setOnBeforeRender(lineMaterial);
    this._outerLine.onBeforeRender = setOnBeforeRender(borderMaterial);
    this.position.copy(first);
  }
  setRenderOrder(main, border) {
    this._innerLine.renderOrder = main;
    this._outerLine.renderOrder = border;
  }
  removeFromParent() {
    this._innerLine.geometry.dispose();
    return super.removeFromParent();
  }
  updateMaterialResolution(renderer) {
    // Even though it's also done in onBeforeRender, this is not sufficient,
    // because for raycasting purposes we need to have the correct resolution set,
    // even for objects not rendered (out of screen).
    updateResolution(this._innerLine.material, renderer);
    updateResolution(this._outerLine.material, renderer);
  }
  raycast(raycaster, intersects) {
    this._innerLine.raycast(raycaster, intersects);
  }
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
export default class Shape extends Entity3D {
  isShape = true;
  type = 'Shape';
  _points = [];
  _segments = [];

  // Formatters
  _formatLine = defaultLengthFormatter;
  _formatSegment = defaultLengthFormatter;
  _formatVerticalLine = defaultVerticalLineFormatter;
  _formatSurface = defaultAreaFormatter;
  _surfaceLabelPlacement = defaultLabelPlacement;
  _formatVertex = defaultVertexFormatter;

  // Style
  _lineWidth = DEFAULT_LINE_WIDTH;
  _borderWidth = DEFAULT_BORDER_WIDTH;
  _depthTest = false;
  _color = new Color(DEFAULT_COLOR);
  _contrastColor = new Color(getContrastColor(this._color));
  _fontSize = DEFAULT_FONT_SIZE;
  _fontWeight = 'bold';

  // Labels
  _pickableLabels = false;
  _lengthLabels = [];
  _vertexLabels = [];
  _heightLabels = [];
  _showSegmentLabels = false;
  _showVerticalLineLabels = false;
  _showLineLabel = false;
  _showSurfaceLabel = false;
  _showVertexLabels = false;
  _labelOpacity = 1;

  // Line

  _showLine = DEFAULT_SHOW_LINE;
  // Secondary lines common options
  _floorElevation = 0;

  // Floor lines

  _showFloorLine = DEFAULT_SHOW_FLOOR_LINE;

  // Vertical lines
  _verticalLines = [];
  _showVerticalLines = DEFAULT_SHOW_VERTICAL_LINES;

  // Surface (polygon)

  _showSurface = DEFAULT_SHOW_SURFACE;
  _surfaceOpacity = DEFAULT_SURFACE_OPACITY;

  // Vertices
  _vertexRadius = DEFAULT_VERTEX_RADIUS;
  // Regular vertices
  _showVertices = DEFAULT_SHOW_VERTICES;
  _vertices = [];

  // Floor vertices
  _showFloorVertices = DEFAULT_SHOW_FLOOR_VERTICES;
  _floorVertices = [];

  // Hooks

  /**
   * Creates a {@link Shape}.
   * @param options - The constructor options.
   */
  constructor(options) {
    super(new Group());
    this._showVertices = options?.showVertices ?? this._showVertices;
    this._showFloorVertices = options?.showFloorVertices ?? this._showFloorVertices;
    this._showLine = options?.showLine ?? this._showLine;
    this._showFloorLine = options?.showFloorLine ?? this._showFloorLine;
    this._showVerticalLines = options?.showVerticalLines ?? this._showVerticalLines;
    this._showSurface = options?.showSurface ?? this._showSurface;
    this._labelOpacity = options?.labelOpacity ?? this._labelOpacity;
    this._pickableLabels = options?.pickableLabels ?? this._pickableLabels;
    this._showVerticalLineLabels = options?.showVerticalLineLabels ?? this._showVerticalLineLabels;
    this._showSegmentLabels = options?.showSegmentLabels ?? this._showSegmentLabels;
    this._showLineLabel = options?.showLineLabel ?? this._showLineLabel;
    this._showSurfaceLabel = options?.showSurfaceLabel ?? this._showSurfaceLabel;
    this._showVertexLabels = options?.showVertexLabels ?? this._showVertexLabels;
    this._color = options?.color != null ? new Color(options.color) : this._color;
    this._contrastColor = new Color(getContrastColor(this._color));
    this._vertexRadius = options?.vertexRadius ?? this._vertexRadius;
    this._lineWidth = options?.lineWidth ?? this._lineWidth;
    this._borderWidth = options?.borderWidth ?? this._borderWidth;
    this._fontSize = options?.fontSize ?? this._fontSize;
    this._fontWeight = options?.fontWeight ?? this._fontWeight;
    this._innerLineMaterial = new LineMaterial({
      linewidth: this._lineWidth,
      worldUnits: false,
      color: this._color,
      transparent: true
    });
    this._outerLineMaterial = new LineMaterial({
      linewidth: this._lineWidth + this._borderWidth * 2,
      worldUnits: false,
      color: this._contrastColor,
      transparent: true
    });
    this._innerSecondaryLineMaterial = new LineMaterial({
      linewidth: this._lineWidth,
      worldUnits: false,
      color: this._color,
      dashed: true,
      dashScale: 1,
      dashSize: 10,
      gapSize: 10,
      transparent: true
    });
    this._outerSecondaryLineMaterial = new LineMaterial({
      linewidth: this._lineWidth + this._borderWidth * 2,
      worldUnits: false,
      color: this._contrastColor,
      dashed: true,
      dashScale: 1,
      dashSize: 10,
      gapSize: 10,
      transparent: true
    });
    this._innerVertexMaterial = new MeshBasicMaterial({
      color: this._color,
      transparent: true
    });
    this._outerVertexMaterial = new MeshBasicMaterial({
      color: this._contrastColor,
      side: FrontSide,
      transparent: true
    });
    this._surfaceOpacity = options?.surfaceOpacity ?? this._surfaceOpacity;
    this._surfaceMaterial = new MeshBasicMaterial({
      color: this._color,
      opacity: this._surfaceOpacity,
      side: DoubleSide,
      transparent: true
    });
    this._formatLine = options?.lineLabelFormatter ?? this._formatLine;
    this._formatSurface = options?.surfaceLabelFormatter ?? this._formatSurface;
    this._surfaceLabelPlacement = options?.surfaceLabelPlacement ?? this._surfaceLabelPlacement;
    this._formatVertex = options?.vertexLabelFormatter ?? this._formatVertex;
    this._formatSegment = options?.segmentLabelFormatter ?? this._formatSegment;
    this._formatVerticalLine = options?.verticalLineLabelFormatter ?? this._formatVerticalLine;
    this._beforeRemovePoint = options?.beforeRemovePoint;
    this._afterRemovePoint = options?.afterRemovePoint;
    this._beforeUpdatePoint = options?.beforeUpdatePoint;
    this._afterUpdatePoint = options?.afterUpdatePoint;
    this._beforeInsertPoint = options?.beforeInsertPoint;
    this._afterInsertPoint = options?.afterInsertPoint;
  }

  /**
   * Gets or sets the specific opacity factor of the surface.
   * The final opacity of the surface is the product of this value with {@link opacity}.
   */
  get surfaceOpacity() {
    return this._surfaceOpacity;
  }
  set surfaceOpacity(v) {
    if (this._surfaceOpacity !== v) {
      this._surfaceOpacity = v;
      this._surfaceMaterial.opacity = this.opacity * v;
      if (this.showSurface && this._surface) {
        this.notifyChange();
      }
    }
  }

  /**
   * Gets or sets the opacity factor of the labels.
   * The final opacity of the label is the product of this value with {@link opacity}.
   */
  get labelOpacity() {
    return this._labelOpacity;
  }
  set labelOpacity(v) {
    if (this._labelOpacity !== v) {
      this._labelOpacity = v;
      this.updateOpacity();
    }
  }

  /**
   * Toggles depth test on or off.
   */
  get depthTest() {
    return this._depthTest;
  }
  set depthTest(v) {
    if (this._depthTest !== v) {
      this._depthTest = v;
      this.updateDepthTest();
    }
  }

  /**
   * Gets or sets the radius of the vertices, in pixels.
   */
  get vertexRadius() {
    return this._vertexRadius;
  }
  set vertexRadius(radius) {
    if (this._vertexRadius !== radius) {
      this._vertexRadius = radius;
      this.visitVertices(v => v.radius = radius);
      this.notifyChange();
    }
  }

  /**
   * Gets or sets the color of the shape.
   */
  get color() {
    return this._color;
  }
  set color(c) {
    const newColor = new Color(c);
    if (!this._color.equals(newColor)) {
      this._color = new Color(c);
      this._contrastColor = new Color(getContrastColor(this._color));
      this._innerLineMaterial.color.copy(this._color);
      this._outerLineMaterial.color.copy(this._contrastColor);
      this._innerVertexMaterial.color.copy(this._color);
      this._outerVertexMaterial.color.copy(this._contrastColor);
      this._surfaceMaterial.color.copy(this._color);
      this._innerSecondaryLineMaterial.color.copy(this._color);
      this._outerSecondaryLineMaterial.color.copy(this._contrastColor);
      this.updateLabels();
      this.notifyChange();
    }
  }

  /**
   * Toggle the display of vertical distances (distances from each vertex to a defined elevation).
   */
  get showVerticalLines() {
    return this._showVerticalLines;
  }
  set showVerticalLines(show) {
    if (this._showVerticalLines !== show) {
      this._showVerticalLines = show;
      this.rebuildGeometries();
    }
  }

  /**
   * Toggle the display of floor line.
   */
  get showFloorLine() {
    return this._showFloorLine;
  }
  set showFloorLine(show) {
    if (this._showFloorLine !== show) {
      this._showFloorLine = show;
      this.rebuildGeometries();
    }
  }

  /**
   * Toggle the dash on lines.
   */
  get dashed() {
    return this._innerSecondaryLineMaterial.dashed;
  }
  set dashed(dashed) {
    this._innerSecondaryLineMaterial.dashed = dashed;
    this._outerSecondaryLineMaterial.dashed = dashed;
    this.notifyChange();
  }

  /**
   * The dash size.
   */
  get dashSize() {
    return this._innerSecondaryLineMaterial.dashSize;
  }
  set dashSize(size) {
    if (size !== this.dashSize) {
      this._innerSecondaryLineMaterial.dashSize = size;
      this._outerSecondaryLineMaterial.dashSize = size;
      this._innerSecondaryLineMaterial.gapSize = size;
      this._outerSecondaryLineMaterial.gapSize = size;
      this.notifyChange();
    }
  }

  /**
   * The floor elevation for the vertical lines.
   */
  get floorElevation() {
    return this._floorElevation;
  }
  set floorElevation(floor) {
    if (this._floorElevation !== floor) {
      this._floorElevation = floor;
      this.rebuildGeometries();
    }
  }

  /**
   * Toggle the display of vertices.
   */
  get showVertices() {
    return this._showVertices;
  }
  set showVertices(show) {
    if (this._showVertices !== show) {
      this._showVertices = show;
      this.rebuildGeometries();
    }
  }

  /**
   * Toggle the display of floor vertices.
   */
  get showFloorVertices() {
    return this._showFloorVertices;
  }
  set showFloorVertices(show) {
    if (this._showFloorVertices !== show) {
      this._showFloorVertices = show;
      this.rebuildGeometries();
    }
  }

  /**
   * Gets or sets the line width, in pixels.
   */
  get lineWidth() {
    return this._lineWidth;
  }
  set lineWidth(width) {
    if (this._lineWidth !== width) {
      this._lineWidth = width;
      this._innerLineMaterial.linewidth = width;
      this._outerLineMaterial.linewidth = width + this._borderWidth * 2;
      this._innerSecondaryLineMaterial.linewidth = width * VERTICAL_LINE_WIDTH_FACTOR;
      this._outerSecondaryLineMaterial.linewidth = this._innerSecondaryLineMaterial.linewidth + this._borderWidth * 2;
      this.notifyChange();
    }
  }

  /**
   * Gets or sets the font weight.
   * @defaultValue {@link DEFAULT_FONT_WEIGHT}
   */
  get fontWeight() {
    return this._fontWeight;
  }
  set fontWeight(v) {
    if (this._fontWeight !== v) {
      this._fontWeight = v;
      this.updateLabels();
    }
  }

  /**
   * Gets or sets the font size, in pixels.
   * @defaultValue {@link DEFAULT_FONT_SIZE}
   */
  get fontSize() {
    return this._fontSize;
  }
  set fontSize(v) {
    if (this._fontSize !== v) {
      this._fontSize = v;
      this.updateLabels();
    }
  }

  /**
   * Gets or sets the border width, in pixels.
   */
  get borderWidth() {
    return this._borderWidth;
  }
  set borderWidth(width) {
    if (this._borderWidth !== width) {
      this._borderWidth = width;
      this._outerLineMaterial.linewidth = this.lineWidth + this._borderWidth * 2;
      this._outerSecondaryLineMaterial.linewidth = this._innerSecondaryLineMaterial.linewidth + this._borderWidth * 2;
      this._vertices.forEach(v => {
        v.borderWidth = this._borderWidth;
      });
      this._floorVertices.forEach(v => {
        v.borderWidth = this._borderWidth;
      });
      this.notifyChange();
    }
  }

  /**
   * Toggle display of the line.
   */
  get showLine() {
    return this._showLine;
  }
  set showLine(show) {
    if (this._showLine !== show) {
      this._showLine = show;
      this.rebuildGeometries();
    }
  }

  /**
   * Returns the current vertex collection as a read-only array.
   *
   * Note: to modify the point collection, use {@link setPoints} instead.
   */
  get points() {
    return this._points;
  }

  /**
   * Inserts a point at the specified index.
   * @param index - The point index.
   * @param position - The position of the point.
   */
  insertPoint(index, position) {
    if (this._beforeInsertPoint != null && !this._beforeInsertPoint({
      shape: this,
      index,
      position
    })) {
      return;
    }
    this._points.splice(index, 0, position);
    this._segments.length = 0;
    this.rebuildGeometries();
    if (this._afterInsertPoint != null) {
      this._afterInsertPoint({
        shape: this,
        index,
        position
      });
    }
  }

  /**
   * Removes the point at the given index.
   * @param index - The index of the point to update.
   */
  removePoint(index) {
    if (this._points.length < index - 1) {
      return;
    }
    const position = this._points[index];
    if (this._beforeRemovePoint != null && !this._beforeRemovePoint({
      shape: this,
      index,
      position
    })) {
      return;
    }
    this._points.splice(index, 1);
    this._segments.length = 0;
    this.rebuildGeometries();
    if (this._afterRemovePoint != null) {
      this._afterRemovePoint({
        shape: this,
        index,
        position
      });
    }
  }

  /**
   * Sets the position of an existing point.
   * @param index - The index of the point to update.
   * @param newPosition - The new position of the point.
   */
  updatePoint(index, newPosition) {
    if (this._points.length < index - 1) {
      return;
    }
    const oldPosition = this._points[index];
    if (oldPosition.equals(newPosition)) {
      return;
    }
    if (this._beforeUpdatePoint != null && !this._beforeUpdatePoint({
      shape: this,
      index,
      oldPosition,
      newPosition
    })) {
      return;
    }
    this._points[index] = newPosition.clone();
    this._segments.length = 0;
    this.rebuildGeometries();
    if (this._afterUpdatePoint) {
      this._afterUpdatePoint({
        shape: this,
        index,
        oldPosition,
        newPosition
      });
    }
  }

  /**
   * Sets the points of the shape.
   * @param points - The points. If `null`, all points are removed.
   */
  setPoints(points) {
    if (points == null || points.length === 0) {
      this._points.length = 0;
    } else {
      this._points.splice(0, this._points.length, ...points.map(p => p.clone()));
    }
    this._segments.length = 0;
    this.rebuildGeometries();
  }

  /**
   * Returns the point just before the specified index, taking into account closed lines.
   * @param index - The point index.
   * @returns The location of the previous point, if any, otherwise `null`.
   *
   * Note: if the line is not closed, requesting the point before index zero will return null,
   * but if the line is closed, it will return the point before the last one.
   */
  getPreviousPoint(index) {
    const isClosed = this.isClosed;
    if (index === 0 && !this.isClosed) {
      return null;
    }
    if (index !== 0) {
      return this._points[index - 1];
    } else {
      if (isClosed) {
        return this._points[this._points.length - 2];
      } else {
        return null;
      }
    }
  }

  /**
   * Returns the point just after the specified index, taking into account closed lines.
   * @param index - The point index.
   * @returns The location of the next point, if any, otherwise `null`.
   *
   * Note: if the line is not closed, requesting the point after index (n - 1) will return null,
   * but if the line is closed, it will return the point after the first one.
   */
  getNextPoint(index) {
    const isClosed = this.isClosed;
    const lastIndex = this._points.length - 1;
    if (index === lastIndex && !this.isClosed) {
      return null;
    }
    if (index !== lastIndex) {
      return this._points[index + 1];
    } else {
      if (isClosed) {
        return this._points[1];
      } else {
        return null;
      }
    }
  }

  /**
   * Gets the area of this shape, if any.
   *
   * Note: if the shape is not a closed shape, returns `null`.
   * @returns The area, in CRS units.
   */
  getArea() {
    if (this.isClosed) {
      const result = computeArea(this._points, false);
      return result.area ?? null;
    } else {
      return null;
    }
  }

  /**
   * Gets the length of the line of this shape, if any. If the shape has less than 2 points,
   * returns `null`.
   *
   * Note: if the shape is a closed shape, this equals the perimeter of the shape.
   *
   * @returns The length, in CRS units.
   */
  getLength() {
    if (this._points.length < 2) {
      return null;
    }
    let length = 0;
    for (let i = 0; i < this._points.length - 1; i++) {
      const p0 = this._points[i + 0];
      const p1 = this._points[i + 1];
      length += p0.distanceTo(p1);
    }
    return length;
  }

  /**
   * Make labels pickable.
   */
  get pickableLabels() {
    return this._pickableLabels;
  }
  set pickableLabels(v) {
    if (this._pickableLabels !== v) {
      this._pickableLabels = v;
      this.visitLabels(label => label.pickable = v);
    }
  }

  /**
   * Toggle the labels for each segment.
   */
  get showSegmentLabels() {
    return this._showSegmentLabels;
  }
  set showSegmentLabels(show) {
    if (this._showSegmentLabels !== show) {
      this._showSegmentLabels = show;
      this.rebuildLineLabels();
    }
  }

  /**
   * Toggle the vertical line labels (one label per vertical line).
   */
  get showVerticalLineLabels() {
    return this._showVerticalLineLabels;
  }
  set showVerticalLineLabels(show) {
    if (this._showVerticalLineLabels !== show) {
      this._showVerticalLineLabels = show;
      this.rebuildVerticalLineLabels();
    }
  }

  /**
   * Toggle the label for the entire line.
   */
  get showLineLabel() {
    return this._showLineLabel;
  }
  set showLineLabel(show) {
    if (this._showLineLabel !== show) {
      this._showLineLabel = show;
      this.rebuildLineLabels();
    }
  }

  /**
   * Toggle the surface label.
   */
  get showSurfaceLabel() {
    return this._showSurfaceLabel;
  }
  set showSurfaceLabel(show) {
    if (this._showSurfaceLabel !== show) {
      this._showSurfaceLabel = show;
      this.rebuildSurfaceLabel();
    }
  }

  /**
   * Toggle the vertex labels.
   */
  get showVertexLabels() {
    return this._showVertexLabels;
  }
  set showVertexLabels(show) {
    if (this._showVertexLabels !== show) {
      this._showVertexLabels = show;
      this.rebuildVertexLabels();
    }
  }

  /**
   * Toggle the display of the surface.
   */
  get showSurface() {
    return this._showSurface;
  }
  set showSurface(show) {
    if (this._showSurface !== show) {
      this._showSurface = show;
      this.rebuildSurface();
    }
  }

  /**
   * Ensures that the line makes a closed ring, by duplicating
   * the first point as the last point, if necessary.
   */
  makeClosed() {
    if (this._points.length > 2 && !this._points[0].equals(this._points[this._points.length - 1])) {
      this._points.push(this._points[0].clone());
      this.rebuildGeometries();
    }
  }

  /**
   * Gets whether the line is closed.
   *
   * Note: To close the line, use {@link makeClosed}.
   */
  get isClosed() {
    if (this._points.length >= 3) {
      return this._points[0].equals(this._points[this._points.length - 1]);
    }
    return false;
  }
  updateRenderOrder() {
    const main = this.renderOrder + 2;
    const border = this.renderOrder + 1;
    const surface = this.renderOrder;
    this.visitVertices(vertex => vertex.setRenderOrder(main, border));
    this.visitLines(line => line.setRenderOrder(main, border));
    if (this._surface) {
      this._surface.renderOrder = surface;
    }
  }
  updateVisibility() {
    // Setting the root object's visibility is not enough
    // to set the visibility of CSS2DObjects (labels).
    this.object3d.traverse(o => {
      o.visible = this.visible;
    });
  }
  updateLabelOpacity() {
    const cssOpacity = `${this.opacity * this._labelOpacity * 100}%`;
    this.visitLabels(label => label.element.style.opacity = cssOpacity);
  }
  updateOpacity() {
    setOpacity(this._innerLineMaterial, this.opacity);
    setOpacity(this._outerLineMaterial, this.opacity);
    setOpacity(this._innerSecondaryLineMaterial, this.opacity);
    setOpacity(this._outerSecondaryLineMaterial, this.opacity);
    setOpacity(this._innerVertexMaterial, this.opacity);
    setOpacity(this._outerVertexMaterial, this.opacity);
    setOpacity(this._surfaceMaterial, this.opacity * this._surfaceOpacity);
    this.updateLabelOpacity();
  }

  /**
   * Rebuilds all labels. Useful if the formatter functions have changed.
   */
  rebuildLabels() {
    this.rebuildLineLabels();
    this.rebuildVerticalLineLabels();
    this.rebuildSurfaceLabel();
    this.rebuildVertexLabels();
  }

  /**
   * Returns the closest point on the line to the specified point.
   * @param point - The point to test.
   * @returns An object containing the location of the closest point, as well as the index of the
   * first point that makes the segment in which the point was found.
   */
  getClosestPointOnLine(point) {
    this.buildSegmentListIfNecessary();
    const result = new Vector3();
    const tmpVec3 = new Vector3();
    let distance = +Infinity;
    let index = 0;
    let previousPointIndex = -1;
    for (const segment of this._segments) {
      const current = segment.closestPointToPoint(point, true, tmpVec3);
      const newDistance = current.distanceToSquared(point);
      if (newDistance < distance) {
        result.copy(current);
        distance = newDistance;
        previousPointIndex = index;
      }
      index += 1;
    }
    return {
      point: result,
      previousPointIndex
    };
  }
  pick(canvasCoordinates) {
    const normalized = this.instance.canvasToNormalizedCoords(canvasCoordinates, tmpNDC);
    const raycaster = new Raycaster();
    raycaster.params.Line2 = {
      threshold: this.lineWidth * 8
    };
    raycaster.setFromCamera(normalized, this.instance.view.camera);
    const pickedVertexIndex = this.raycastVertices(raycaster);
    if (this.pickableLabels) {
      tmpIntersectList.length = 0;
      const pickedLabel = this.pickLabels(raycaster);
      if (pickedLabel) {
        const pickResult = {
          isShapePickResult: true,
          entity: this,
          pickedLabel: true,
          point: pickedLabel.position,
          object: pickedLabel,
          distance: pickedLabel.position.distanceTo(raycaster.ray.origin)
        };
        return [pickResult];
      }
    }
    if (pickedVertexIndex != null) {
      const point = this._points[pickedVertexIndex];
      const pickResult = {
        isShapePickResult: true,
        entity: this,
        pickedVertexIndex,
        point,
        object: this._vertices[pickedVertexIndex],
        distance: point.distanceTo(raycaster.ray.origin)
      };
      return [pickResult];
    }
    if (this._mainLine) {
      const segment = this.raycastMainLine(raycaster);
      if (segment) {
        const pickResult = {
          isShapePickResult: true,
          entity: this,
          pickedSegment: segment.previousPointIndex,
          point: segment.point,
          object: this._mainLine,
          distance: segment.point.distanceTo(raycaster.ray.origin)
        };
        return [pickResult];
      }
    }
    if (this._showSurface && this._surface) {
      tmpIntersectList.length = 0;
      this._surface.raycast(raycaster, tmpIntersectList);
      if (tmpIntersectList.length > 0) {
        const pickResult = {
          isShapePickResult: true,
          entity: this,
          pickedSurface: true,
          point: tmpIntersectList[0].point,
          object: this._surface,
          distance: tmpIntersectList[0].distance
        };
        return [pickResult];
      }
    }
    return [];
  }

  /**
   * Returns the GeoJSON (in WGS84 coordinates) feature equivalent to this shape.
   */
  toGeoJSON(options) {
    const actualOptions = {
      includeAltitudes: options?.includeAltitudes ?? true
    };
    return {
      type: 'Feature',
      id: this.id,
      geometry: this.getGeoJSONGeometry(actualOptions),
      properties: {}
    };
  }

  /**
   * Returns the OpenLayers feature (in WGS84 coordinates) equivalent to this shape.
   */
  toOpenLayersFeature(options) {
    return GeoJSONUtils.getOpenLayersFeature(this.toGeoJSON(options));
  }
  visitMaterials(visitor) {
    visitor(this._innerLineMaterial);
    visitor(this._outerLineMaterial);
    visitor(this._innerVertexMaterial);
    visitor(this._outerVertexMaterial);
    visitor(this._surfaceMaterial);
    visitor(this._innerSecondaryLineMaterial);
    visitor(this._outerSecondaryLineMaterial);
  }
  updateDepthTest() {
    const depthTest = this._depthTest;
    this.visitMaterials(m => {
      m.depthTest = depthTest;
      m.depthWrite = false;
    });
    this.notifyChange();
  }
  visitVertices(callback) {
    this._floorVertices.forEach(callback);
    this._vertices.forEach(callback);
  }
  visitLines(callback) {
    if (this._mainLine) {
      callback(this._mainLine);
    }
    if (this._floorLine) {
      callback(this._floorLine);
    }
    this._verticalLines.forEach(callback);
  }
  preUpdate() {
    this.visitLines(line => line.updateMaterialResolution(this.instance.renderer));
    return null;
  }
  visitLabels(callback) {
    if (this._areaLabel) {
      callback(this._areaLabel);
    }
    this._heightLabels.forEach(callback);
    this._lengthLabels.forEach(callback);
    this._vertexLabels.forEach(callback);
  }
  updateLabels() {
    this.visitLabels(label => {
      this.updateStyle(label.span);
    });
  }
  makeVertex(position) {
    const symbol = new Vertex(this._innerVertexMaterial, this._outerVertexMaterial);
    this.onObjectCreated(symbol);
    symbol.radius = this.vertexRadius;
    symbol.borderWidth = this.borderWidth;
    symbol.position.copy(position);
    return symbol;
  }
  rebuildVertices() {
    this._vertices.forEach(vertex => {
      vertex.removeFromParent();
    });
    this._floorVertices.forEach(vertex => {
      vertex.removeFromParent();
    });
    this._vertices.length = 0;
    this._floorVertices.length = 0;
    if (this._showVertices && this._points.length > 0) {
      this._points.forEach(p => {
        const vertex = this.makeVertex(p);
        this.object3d.add(vertex);
        vertex.updateMatrixWorld(true);
        this._vertices.push(vertex);
      });
    }
    if (this._showFloorVertices && this._points.length > 0) {
      this._points.forEach(p => {
        const vertex = this.makeVertex(p.clone().setZ(this._floorElevation));
        this.object3d.add(vertex);
        vertex.updateMatrixWorld(true);
        this._floorVertices.push(vertex);
      });
    }
    this.notifyChange();
  }
  onObjectCreated(obj) {
    // note: we use traverse() because the object might have its own sub-hierarchy as well.

    this.traverse(o => {
      // To be able to link an object to its parent entity (e.g for picking purposes)
      o.userData.parentEntity = this;
    }, obj);

    // Setup materials
    this.traverseMaterials(material => {
      material.clippingPlanes = this.clippingPlanes;
    }, obj);
  }
  rebuildLine() {
    if (this._mainLine) {
      this._mainLine.removeFromParent();
    }
    this._mainLine = undefined;
    if (this._showLine && this._points.length > 1) {
      this._mainLine = new LineWithBorder(this._innerLineMaterial, this._outerLineMaterial, this._points);
      this._mainLine.name = 'line';
      this.onObjectCreated(this._mainLine);
      this.object3d.add(this._mainLine);
      this._mainLine.updateMatrixWorld(true);
    }
  }
  updateStyle(span) {
    const sRgb = sRGB.copyLinearToSRGB(this._color);
    const contrastColor = `#${this._contrastColor.getHexString()}`;
    span.style.backgroundColor = `rgb(${sRgb.r * 255} ${sRgb.g * 255} ${sRgb.b * 255})`;
    span.style.borderWidth = '1px';
    span.style.borderStyle = 'solid';
    span.style.borderColor = contrastColor;
    span.style.borderRadius = `${MathUtils.clamp(this.fontSize - 4, 5, 10)}px`;
    span.style.color = contrastColor;
    const padding = MathUtils.clamp(Math.round(this.fontSize / 4), 2, 10);
    span.style.padding = `${padding}px ${padding}px ${padding}px ${padding}px`;
    span.style.fontSize = `${this.fontSize}px`;
    span.style.fontWeight = this.fontWeight;
    span.style.pointerEvents = this._pickableLabels ? 'auto' : 'none';
  }
  createLabel(formattedValue, options) {
    const container = document.createElement('div');
    const span = document.createElement('span');
    this.updateStyle(span);
    span.innerText = formattedValue;
    const innerContainer = document.createElement('div');
    container.appendChild(innerContainer);
    innerContainer.appendChild(span);
    if (options?.alignment === 'right') {
      container.style.paddingBottom = '3rem';
    }
    if (options?.vertical === true) {
      innerContainer.style.rotate = '90deg';
    }
    const object = new Label(container, span);
    container.addEventListener('mouseover', () => object.userData.hover = true);
    container.addEventListener('mouseleave', () => object.userData.hover = false);
    return object;
  }
  rebuildSurface() {
    if (this._surface) {
      this._surface.geometry?.dispose();
      this._surface.removeFromParent();
      this._surface = undefined;
    }
    if (this._showSurface) {
      const {
        geometry,
        origin
      } = computeArea(this._points, true);
      if (geometry && origin) {
        this._surface = new Mesh(geometry, this._surfaceMaterial);
        this._surface.name = 'surface';
        this.object3d.add(this._surface);
        this._surface.position.copy(origin);
        this._surface.updateMatrixWorld(true);
      }
    }
    this.notifyChange();
  }
  rebuildSurfaceLabel() {
    if (this._areaLabel) {
      this._areaLabel.removeFromParent();
      this._areaLabel = undefined;
    }
    if (this._showSurfaceLabel && this._points.length > 2) {
      const {
        area
      } = computeArea(this._points, false);
      if (area != null) {
        const labelText = this._formatSurface({
          shape: this,
          defaultFormatter: defaultAreaFormatter,
          area
        });
        if (labelText != null) {
          const label = this.createLabel(labelText);
          this._areaLabel = label;
          const labelPlacement = this._surfaceLabelPlacement({
            shape: this
          });
          this.object3d.add(this._areaLabel);
          this._areaLabel.position.copy(labelPlacement);
          this._areaLabel.updateMatrixWorld(true);
        }
      }
    }
    this.notifyChange();
  }
  rebuildVerticalLineLabels() {
    this._heightLabels.forEach(l => {
      l.element.remove();
      l.removeFromParent();
    });
    this._heightLabels.length = 0;
    if (this._showVerticalLineLabels) {
      for (let i = 0; i < this._verticalLines.length; i++) {
        const line = this._verticalLines[i];
        const length = line.userData.length;
        if (length > 0) {
          const formattedLength = this._formatVerticalLine({
            shape: this,
            defaultFormatter: defaultVerticalLineFormatter,
            vertexIndex: i,
            length
          });
          if (formattedLength != null) {
            const label = this.createLabel(formattedLength, {
              vertical: true
            });
            label.name = 'height';
            label.position.copy(line.userData.midPoint);
            this.object3d.add(label);
            label.updateMatrixWorld(true);
            this._heightLabels.push(label);
          }
        }
      }
    }
    this.notifyChange();
  }
  rebuildLineLabels() {
    this._lengthLabels.forEach(l => {
      l.element.remove();
      l.removeFromParent();
    });
    this._lengthLabels.length = 0;
    if ((this._showSegmentLabels || this._showLineLabel) && this._points.length > 1) {
      const curve = this._showLineLabel ? new CurvePath() : undefined;
      for (let i = 0; i < this._points.length - 1; i++) {
        const start = this._points[i];
        const end = this._points[i + 1];
        const length = start.distanceTo(end);
        if (this._showSegmentLabels) {
          const midPoint = tmpMidPoint.lerpVectors(start, end, 0.5);
          const labelText = this._formatSegment({
            shape: this,
            defaultFormatter: defaultLengthFormatter,
            length,
            start,
            end
          });
          if (labelText != null) {
            const label = this.createLabel(labelText);
            label.name = labelText;
            label.position.copy(midPoint);
            this.object3d.add(label);
            label.updateMatrixWorld(true);
            this._lengthLabels.push(label);
          }
        }
        if (this._showLineLabel && curve) {
          const lineCurve = new LineCurve3(start, end);
          curve.add(lineCurve);
        }
      }
      if (this._showLineLabel && curve) {
        const labelText = this._formatLine({
          shape: this,
          defaultFormatter: defaultLengthFormatter,
          length: curve.getLength()
        });
        if (labelText != null) {
          const label = this.createLabel(labelText);
          this._lengthLabels.push(label);
          label.name = 'total length';
          const midpoint = curve.getPointAt(0.5);
          this.object3d.add(label);
          label.position.copy(midpoint);
          label.updateMatrixWorld(true);
        }
      }
    }
    this.notifyChange();
  }
  rebuildVertexLabels() {
    this._vertexLabels.forEach(l => {
      l.element.remove();
      l.removeFromParent();
    });
    this._vertexLabels.length = 0;
    if (this.showVertices && this.showVertexLabels && this._points.length > 0) {
      for (let index = 0; index < this._points.length; index++) {
        const position = this._points[index];
        const labelText = this._formatVertex({
          shape: this,
          defaultFormatter: defaultVertexFormatter,
          index,
          position
        });
        if (labelText != null) {
          const label = this.createLabel(labelText, {
            alignment: 'right'
          });
          label.name = 'label';
          label.position.copy(position);
          this.object3d.add(label);
          label.updateMatrixWorld(true);
          this._vertexLabels.push(label);
        }
      }
    }
    this.notifyChange();
  }
  rebuildFloorLine() {
    if (this._floorLine) {
      this._floorLine.removeFromParent();
    }
    this._floorLine = undefined;
    if (this._showFloorLine && this._points.length > 1) {
      const points = this._points.map(p => new Vector3(p.x, p.y, this._floorElevation));
      this._floorLine = new LineWithBorder(this._innerSecondaryLineMaterial, this._outerSecondaryLineMaterial, points);
      this.onObjectCreated(this._floorLine);
      this.object3d.add(this._floorLine);
      this._floorLine.updateMatrixWorld(true);
    }
  }
  rebuildVerticalLines() {
    this._verticalLines.forEach(line => {
      line.removeFromParent();
    });
    this._verticalLines.length = 0;
    function makeVerticalLine(point, floor) {
      const start = point;
      const end = point.clone().setZ(floor);
      return {
        start,
        end,
        length: Math.abs(floor - point.z),
        midPoint: new Vector3().lerpVectors(start, end, 0.5)
      };
    }
    if (this._showVerticalLines) {
      for (const point of this._points) {
        const {
          start,
          end,
          length,
          midPoint
        } = makeVerticalLine(point, this._floorElevation);
        const line = new LineWithBorder(this._innerSecondaryLineMaterial, this._outerSecondaryLineMaterial, [start, end]);
        line.userData.midPoint.copy(midPoint);
        line.userData.length = length;
        this.onObjectCreated(line);
        this._verticalLines.push(line);
        this.object3d.add(line);
        line.updateMatrixWorld(true);
      }
    }
  }
  rebuildGeometries() {
    this.rebuildVertices();
    this.rebuildLine();
    this.rebuildFloorLine();
    this.rebuildSurface();
    this.rebuildVerticalLines();
    this.rebuildLabels();
    this.updateRenderOrder();
    this.updateOpacity();
    this.updateVisibility();
    this.updateDepthTest();
    this.notifyChange();
  }
  buildSegmentListIfNecessary() {
    if (this._segments.length === 0) {
      for (let i = 0; i < this._points.length - 1; i++) {
        const start = this._points[i + 0];
        const end = this._points[i + 1];
        const segment = new Line3(start, end);
        this._segments.push(segment);
      }
    }
  }
  pickLabels(raycaster) {
    let pickedLabel = null;
    this.visitLabels(label => {
      if (pickedLabel == null) {
        tmpIntersectList.length = 0;
        this.raycastLabel(label, raycaster, tmpIntersectList);
        if (tmpIntersectList.length > 0) {
          pickedLabel = label;
        }
      }
    });
    return pickedLabel;
  }
  raycastLabel(label, raycaster, intersects) {
    if (label.userData.hover === true) {
      intersects.push({
        object: label,
        point: label.position,
        distance: label.position.distanceTo(raycaster.ray.origin)
      });
    }
  }

  /**
   * Raycast each vertex and returns the index of the first intersected vertex, or null if none.
   */
  raycastVertices(raycaster) {
    const vertexRadius = this.vertexRadius + this.borderWidth;
    for (let index = 0; index < this._points.length; index++) {
      const position = this._points[index];
      const radius = MathUtils.clamp(this.showVertices ? vertexRadius * 2 : DEFAULT_PICKING_RADIUS, DEFAULT_PICKING_RADIUS, +Infinity);

      // We are not actually intersecting the vertex meshes because
      // they might not be visible, so we are using a sphere instead.
      tmpSphere.center = position;
      tmpSphere.radius = getWorldSpaceRadius(this.instance.renderer, raycaster.camera, position, radius);
      const intersection = raycaster.ray.intersectSphere(tmpSphere, tmpIntersection);
      if (intersection != null) {
        return index;
      }
    }
    return null;
  }
  raycastMainLine(raycaster) {
    const intersects = [];
    this._mainLine?.raycast(raycaster, intersects);
    if (intersects.length > 0) {
      const first = intersects[0];
      return this.getClosestPointOnLine(first.point);
    }
    return null;
  }
  getMemoryUsage(context) {
    if (this._surface) {
      getGeometryMemoryUsage(context, this._surface.geometry);
    }
  }

  /**
   * Disposes the shape.
   */
  dispose() {
    this._innerLineMaterial.dispose();
    this._outerLineMaterial.dispose();
    this._innerSecondaryLineMaterial.dispose();
    this._outerSecondaryLineMaterial.dispose();
    this._innerVertexMaterial.dispose();
    this._outerVertexMaterial.dispose();
    this._mainLine?.removeFromParent();
    if (this._surface) {
      this._surface.geometry.dispose();
    }
    this.object3d.clear();
  }
  getGeoJSONGeometry(options) {
    const src = proj.Proj(this.instance.referenceCrs);
    const dst = proj.Proj('EPSG:4326');
    const tmp = {
      x: 0,
      y: 0,
      z: 0
    };
    function toWGS84(p) {
      tmp.x = p.x;
      tmp.y = p.y;
      tmp.z = p.z;
      const {
        x,
        y,
        z
      } = proj.transform(src, dst, tmp);
      if (options?.includeAltitudes === true) {
        return [x, y, z];
      } else {
        return [x, y];
      }
    }
    if (this._points.length === 1) {
      return {
        type: 'Point',
        coordinates: toWGS84(this._points[0])
      };
    }
    if (this.isClosed) {
      if (this.showSurface) {
        return {
          type: 'Polygon',
          coordinates: [this._points.map(toWGS84)]
        };
      }
    } else {
      if (!this.showLine) {
        return {
          type: 'MultiPoint',
          coordinates: this._points.map(toWGS84)
        };
      }
    }
    return {
      type: 'LineString',
      coordinates: this._points.map(toWGS84)
    };
  }
}

/**
 * A type predicate to test if the object is a {@link Shape}.
 */
export function isShape(o) {
  if (o == null) {
    return false;
  }
  return o.isShape;
}