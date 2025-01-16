function isColor(o) {
  return o?.isColor ?? false;
}
function hasUUID(obj) {
  if (obj == null) {
    return false;
  }
  if (typeof obj !== 'object') {
    return false;
  }
  return 'uuid' in obj && typeof obj.uuid === 'string';
}

/**
 * The units used to define line width. If `"pixels"`, the line has a constant width expressed in
 * pixels. If `"world"`, the line has a variable apparent width expressed in CRS units, depending on
 * the distance from the camera to the line.
 */

export const DEFAULT_POINT_COLOR = 'white';
/**
 * The default point size, in pixels.
 */
export const DEFAULT_POINT_SIZE = 64;
export const DEFAULT_LINE_COLOR = '#4d69bf';
export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_LINE_WIDTH_UNITS = 'pixels';
export const DEFAULT_SURFACE_COLOR = '#87c6fa';

/**
 * Fill style for vector features.
 */

/**
 * Stroke style for vector features.
 */

/**
 * Point style for vector features.
 */

/**
 * Returns a fill style where every property is defined, if necessary with default values.
 * @param style - The partial style to process. If undefined, the default style is returned.
 */
export function getFullFillStyle(style) {
  const opacity = style?.opacity ?? 1;
  const color = style?.color ?? DEFAULT_SURFACE_COLOR;
  const depthTest = style?.depthTest ?? true;
  const renderOrder = style?.renderOrder ?? 0;
  return {
    opacity,
    color,
    depthTest,
    renderOrder
  };
}

/**
 * Returns a point style where every property is defined, if necessary with default values.
 * @param style - The partial style to process. If undefined, the default style is returned.
 */
export function getFullPointStyle(style) {
  const opacity = style?.opacity ?? 1;
  const color = style?.color ?? DEFAULT_POINT_COLOR;
  const pointSize = style?.pointSize ?? DEFAULT_POINT_SIZE;
  const sizeAttenuation = style?.sizeAttenuation ?? false;
  // Contrary to lines and surface, it makes sense to disable depth test by
  // default for floating symbols.
  const depthTest = style?.depthTest ?? false;
  const image = style?.image ?? null;
  const renderOrder = style?.renderOrder ?? 0;
  return {
    opacity,
    color,
    sizeAttenuation,
    pointSize,
    depthTest,
    image,
    renderOrder
  };
}

/**
 * Returns a stroke style where every property is defined, if necessary with default values.
 * @param style - The partial style to process. If undefined, then the default style is returned.
 */
export function getFullStrokeStyle(style) {
  const color = style?.color ?? DEFAULT_LINE_COLOR;
  const lineWidth = style?.lineWidth ?? DEFAULT_LINE_WIDTH;
  const opacity = style?.opacity ?? 1;
  const lineWidthUnits = style?.lineWidthUnits ?? 'pixels';
  const depthTest = style?.depthTest ?? true;
  const renderOrder = style?.renderOrder ?? 0;
  return {
    color,
    lineWidth,
    opacity,
    lineWidthUnits,
    depthTest,
    renderOrder
  };
}
function hash(obj) {
  if (obj == null) {
    return 'undefined';
  }
  switch (typeof obj) {
    case 'string':
      return obj;
    case 'number':
      return obj;
    case 'boolean':
      return obj ? 'true' : 'false';
  }
  if (isColor(obj)) {
    return obj.getHexString();
  }
  if (hasUUID(obj)) {
    return obj.uuid;
  }
  throw new Error('unimplemented hashable type:' + typeof obj);
}

/**
 * Returns a string that uniquely identify this style.
 */
export function hashStyle(prefix, style) {
  const items = [];
  for (const [k, v] of Object.entries(style)) {
    items.push(`${k}=${hash(v)}`);
  }
  return `${prefix}::${items.sort().join(',')}`;
}

/**
 * This callback is called just after a source data has been converted to a THREE.js Mesh, to
 * style individual meshes from OpenLayers
 * [Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html)s.
 *
 * @param feature - the feature to style
 * @returns The style of the current feature
 */

/**
 * This callback can be used to generate elevation for a given OpenLayer
 * [Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html) (typically from its properties).
 *
 * - If a single number is returned, it will be used for all vertices in the geometry.
 * - If an array is returned, each value will be used to determine the height of the corresponding vertex in the geometry.
 * Note that the cardinality of the array must be the same as the number of vertices in the geometry.
 */

/**
 * Callback used to generate extrusion to [ol.Feature](https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html).
 *
 * If one number is returned, it will be used for all vertices. If an array is returned, its
 * cardinality must match the number of vertices and each value will be used for each vertex in
 * order.
 */

/**
 * Generator function for surfaces.
 */

/**
 * Generator function for lines.
 */

/**
 * Generator function for points.
 */