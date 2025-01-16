import { CanvasTexture, Vector2 } from 'three';
// Even if it's not explicited in the changelog
// https://github.com/openlayers/openlayers/blob/main/changelog/upgrade-notes.md
// Around OL6 the replay group mechanism was split into BuilderGroup to create the
// instructions and ExecutorGroup to run them.
// The mechanism was altered following
// https://github.com/openlayers/openlayers/issues/9215
// to make it work

import CanvasBuilderGroup from 'ol/render/canvas/BuilderGroup.js';
import ExecutorGroup from 'ol/render/canvas/ExecutorGroup.js';
import { getSquaredTolerance as getSquaredRenderTolerance, renderFeature as renderVectorFeature } from 'ol/renderer/vector.js';
import Vector from 'ol/source/Vector.js';
import { create as createTransform, reset as resetTransform, scale as scaleTransform, translate as translateTransform } from 'ol/transform.js';
import Extent from '../core/geographic/Extent';
import EmptyTexture from '../renderer/EmptyTexture';
import Fetcher from '../utils/Fetcher';
import OpenLayersUtils from '../utils/OpenLayersUtils';
import { nonNull } from '../utils/tsutils';
import ImageSource, { ImageResult } from './ImageSource';
const tmpExtent = new Array(4);
const tmpTransform = createTransform();
function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas;
}

/**
 * Renders a single feature into the builder group.
 *
 * @param feature - The feature to render.
 * @param squaredTolerance - Squared tolerance for geometry simplification.
 * @param styles - The style(s) of the feature.
 * @param builderGroup - The builder group.
 * @param onStyleChanged - A callback when the styles has changed (such as an image being loaded).
 */
function renderFeature(feature, squaredTolerance, styles, builderGroup, onStyleChanged) {
  if (styles == null) {
    return;
  }
  function doRender(style) {
    renderVectorFeature(builderGroup, feature, style, squaredTolerance, onStyleChanged);
  }
  if (Array.isArray(styles)) {
    for (let i = 0, ii = styles.length; i < ii; ++i) {
      doRender(styles[i]);
    }
  } else {
    doRender(styles);
  }
}

/**
 * Rasterizes the builder group into the canvas.
 *
 * @param canvas - The target canvas.
 * @param builderGroup - The builder group.
 * @param extent - The canvas extent.
 * @param size - The canvas size, in pixels.
 */
function rasterizeBuilderGroup(canvas, builderGroup, extent, size) {
  const pixelRatio = 1;
  const resX = extent.dimensions().x / size.width;
  const resY = extent.dimensions().y / size.height;
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true
  });
  if (!ctx) {
    throw new Error('could not acquire 2d context');
  }
  const transform = resetTransform(tmpTransform);
  scaleTransform(transform, pixelRatio / resX, -pixelRatio / resY);
  translateTransform(transform, -extent.west, -extent.north);
  const olExtent = OpenLayersUtils.toOLExtent(extent);
  const resolution = extent.dimensions().x / size.width;
  const executor = new ExecutorGroup(olExtent, resolution, pixelRatio, true, builderGroup.finish());
  executor.execute(ctx, [canvas.width, canvas.height], transform, 0, true);
}

/**
 * The data content. Can be:
 *  - The URL to a remote file and a {@link FeatureFormat} to parse the data,
 *  - The content of the source file (such as GeoJSON) and a {@link FeatureFormat} to parse the data,
 *  - A list of OpenLayers {@link Feature} (no format decoder required)
 */

/**
 * An image source that reads vector data. Internally, this wraps an OpenLayers' [VectorSource](https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html).
 * This uses OpenLayers' styles and features.
 *
 * Note: to assign a new style to the source, use {@link setStyle} instead of
 * the {@link style} property.
 *
 * @example
 * // To load a remote GeoJSON file
 * const source = new VectorSource(\{
 *      data: 'http://example.com/data.geojson',
 *      format: new GeoJSON(), // Pass the OpenLayers FeatureFormat here
 *      style: new Style(...), // Pass an OpenLayers style here
 * \});
 *
 * // To load a local GeoJSON
 * const source = new VectorSource(\{
 *      data: \{ "type": "FeatureCollection" ... \},
 *      format: new GeoJSON(), // Pass the OpenLayers FeatureFormat here
 *      style: new Style(...), // Pass an OpenLayers style here
 * \});
 *
 * // To load features directly (no need to pass a format as the features are already decoded.)
 * const source = new VectorSource(\{
 *      data: [new Feature(...)], // Pass the OpenLayers features here
 *      style: new Style(...), // Pass an OpenLayers style here
 * \});
 */
class VectorSource extends ImageSource {
  isVectorSource = true;
  type = 'VectorSource';

  // After initialization

  /**
   * The current style.
   * Note: to set a new style, use `setStyle()` instead.
   */

  /**
   * @param options - Options.
   */
  constructor(options) {
    super({
      ...options,
      synchronous: true
    });
    if (options.data == null) {
      throw new Error('"data" parameter is required');
    }
    this.data = options.data;
    this.source = new Vector();
    this.dataProjection = options.dataProjection;
    this.style = options.style;
  }

  /**
   * Change the style of this source. This triggers an update of the source.
   *
   * @param style - The style, or style function.
   */
  setStyle(style) {
    this.style = style;
    this.update();
  }
  loadFeaturesFromContent(content, format) {
    return format.readFeatures(content);
  }

  /**
   * Loads the features from this source, either from:
   * - the URL
   * - the data string (for example a GeoJSON string)
   * - the features array
   */
  async loadFeatures() {
    if (Array.isArray(this.data)) {
      this.source.addFeatures(this.data);
    } else if ('url' in this.data) {
      const {
        url,
        format
      } = this.data;
      const content = await Fetcher.text(url.toString(), {
        priority: this.priority
      });
      const features = this.loadFeaturesFromContent(content, format);
      this.source.addFeatures(features);
    } else if ('content' in this.data) {
      const {
        content,
        format
      } = this.data;
      const features = this.loadFeaturesFromContent(content, format);
      this.source.addFeatures(features);
    }
  }

  /**
   * Reprojects a feature from the source projection into the target (instance) projection.
   *
   * @param feature - The feature to reproject.
   */
  reproject(feature) {
    feature.getGeometry()?.transform(this.dataProjection, this._targetProjection);
  }
  async initialize(opts) {
    await this.loadFeatures();
    this._targetProjection = opts.targetProjection;
    const shouldReproject = this.dataProjection != null && this.dataProjection !== this._targetProjection;
    if (shouldReproject) {
      for (const feature of this.source.getFeatures()) {
        this.reproject(feature);
      }
    }
    this.source.on('addfeature', evt => {
      const feature = evt.feature;
      if (feature) {
        if (shouldReproject) {
          this.reproject(feature);
        }
        this.updateFeature(feature);
      }
    });
  }
  get featureCount() {
    return this.getFeatures().length;
  }

  /**
   * Returns an array with the feature in this source.
   *
   * @returns The features.
   */
  getFeatures() {
    return this.source.getFeatures();
  }

  /**
   * Adds a feature to this source.
   * @param feature - The feature to add.
   */
  addFeature(feature) {
    if (feature != null) {
      this.source.addFeature(feature);
    }
  }

  /**
   * Adds features to this source.
   * @param features - The features to add.
   */
  addFeatures(features) {
    if (features != null) {
      this.source.addFeatures(features);
    }
  }

  /**
   * Removes a feature from this source.
   * @param feature - The feature to remove.
   */
  removeFeature(feature) {
    if (feature != null) {
      this.source.removeFeature(feature);
    }
  }

  /**
   * Removes all feature in this source.
   */
  clear() {
    this.source.clear();
    this.update();
  }

  /**
   * Updates the region associated with the feature(s).
   * @param feature - The feature(s) to update.
   */
  updateFeature(...feature) {
    if (feature == null || feature.length === 0) {
      return;
    }
    let extent = null;
    const crs = nonNull(this._targetProjection);
    if (feature.length === 1) {
      extent = OpenLayersUtils.getFeatureExtent(feature[0], crs) ?? null;
    } else {
      feature = feature.filter(f => f != null);
      if (feature.length > 0) {
        const extents = feature.map(f => f != null ? OpenLayersUtils.getFeatureExtent(f, crs) : null).filter(e => e != null);
        extent = Extent.unionMany(...extents);
      }
    }
    if (extent) {
      this.update(extent);
    }
  }

  /**
   * Returns the feature with the specified id.
   *
   * @param id - The feature id.
   * @returns The feature.
   */
  getFeatureById(id) {
    return this.source.getFeatureById(id);
  }

  /**
   * Applies the callback for each feature in this source.
   *
   * @param callback - The callback.
   */
  forEachFeature(callback) {
    this.source.forEachFeature(callback);
  }
  getCrs() {
    // Note that since we are reprojecting vector _inside_ the source,
    // the source projection is the same as the target projection, indicating
    // that no projection needs to be done on images produced by this source.
    return this._targetProjection;
  }
  getExtent() {
    return this.getCurrentExtent();
  }
  getCurrentExtent() {
    const sourceExtent = this.source.getExtent(tmpExtent);
    if (!Number.isFinite(sourceExtent[0])) {
      return null;
    }
    return OpenLayersUtils.fromOLExtent(sourceExtent, nonNull(this._targetProjection));
  }

  /**
   * @param extent - The target extent.
   * @param size - The target pixel size.
   * @returns The builder group, or null if no features have been rendered.
   */
  createBuilderGroup(extent, size) {
    const pixelRatio = 1;

    // We collect features in a larger extent than the target, because the feature extent
    // does not take into account the thickness of lines or the size of icons.
    // Thus, icons and lines may appear cropped because they were geographically
    // outside the target extent, but visually within.
    const testExtent = extent.withRelativeMargin(1);
    const resolution = extent.dimensions().x / size.width;
    const olExtent = OpenLayersUtils.toOLExtent(testExtent, 0.001);
    const builderGroup = new CanvasBuilderGroup(0, olExtent, resolution, pixelRatio);
    const squaredTolerance = getSquaredRenderTolerance(resolution, pixelRatio);
    const defaultStyle = this.style;
    let used = false;
    const onStyleChanged = () => this.update();
    this.source.forEachFeatureInExtent(olExtent, function (feature) {
      let styles;
      const style = feature.getStyleFunction() || defaultStyle;
      if (typeof style === 'function') {
        styles = style(feature, resolution);
      } else {
        styles = defaultStyle;
      }
      if (styles != null) {
        renderFeature(feature, squaredTolerance, styles, builderGroup, onStyleChanged);
      }
      used = true;
    });
    if (used) {
      return builderGroup;
    }
    return null;
  }

  /**
   * @param id - The unique id of the request.
   * @param extent - The request extent.
   * @param size - The size in pixels of the request.
   * @returns The image result.
   */
  createImage(id, extent, size) {
    const builderGroup = this.createBuilderGroup(extent, size);
    let texture;
    if (!builderGroup) {
      texture = new EmptyTexture();
    } else {
      const canvas = createCanvas(size);
      rasterizeBuilderGroup(canvas, builderGroup, extent, size);
      texture = new CanvasTexture(canvas);
    }
    return new ImageResult({
      id,
      texture,
      extent
    });
  }
  intersects(extent) {
    // It's a bit an issue with vector sources, as they are dynamic : when the user adds
    // a feature, the extent changes. Thus we cannot cache the extent.
    const sourceExtent = this.getCurrentExtent();
    // The extent may be null if no features are present in the source.
    if (sourceExtent) {
      // We need to test against a larger extent because features may be geographically
      // outside the extent, but visual representation may be inside (due to styles not
      // being taken into account when computing the extent of a feature).
      const safetyExtent = extent.withRelativeMargin(1);
      return sourceExtent.intersectsExtent(safetyExtent);
    }
    return false;
  }
  getImages(options) {
    const {
      extent,
      width,
      height,
      id
    } = options;
    const size = new Vector2(width, height);
    const request = () => this.createImage(id, extent, size);
    return [{
      id,
      request
    }];
  }
}
export default VectorSource;