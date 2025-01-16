import { FloatType, RGBAFormat } from 'three';
import OpenLayersUtils from '../../utils/OpenLayersUtils';
import { isFiniteNumber } from '../../utils/predicates';
import { defaultColorimetryOptions } from '../ColorimetryOptions';
import Extent from '../geographic/Extent';
import BlendingMode from './BlendingMode';
import { Mode as InterpretationMode } from './Interpretation';
import Layer from './Layer';
/**
 * A layer that produces color images, such as vector data, or satellite imagery.
 */
class ColorLayer extends Layer {
  _blendingMode = BlendingMode.Normal;

  /**
   * Read-only flag to check if a given object is of type ColorLayer.
   */
  isColorLayer = true;
  isPickableFeatures = true;
  _elevationRange = null;
  _colorimetry = defaultColorimetryOptions();

  /**
   * Creates a color layer.
   * See the example for more information on layer creation.
   *
   * @param options - The layer options.
   */
  constructor(options) {
    super(options);
    this.type = 'ColorLayer';
    this._elevationRange = options.elevationRange ?? null;
    this._opacity = options.opacity ?? 1;
    this._blendingMode = options.blendingMode ?? BlendingMode.Normal;
  }

  /**
   * Gets the elevation range of this layer, if any.
   */
  get elevationRange() {
    return this._elevationRange;
  }

  /**
   * Sets the elevation range of this layer. Setting it to null removes the elevation range.
   */
  set elevationRange(range) {
    this._elevationRange = range;
    this.dispatchEvent({
      type: 'elevationRange-property-changed',
      range
    });
  }

  /**
   * Gets or sets the blending mode of this layer.
   */
  get blendingMode() {
    return this._blendingMode;
  }
  set blendingMode(v) {
    if (this._blendingMode !== v) {
      this._blendingMode = v;
      this.dispatchEvent({
        type: 'blendingMode-property-changed',
        blendingMode: v
      });
    }
  }

  /**
   * Gets or sets the opacity of this layer.
   */
  get opacity() {
    return this._opacity;
  }
  set opacity(v) {
    if (this._opacity !== v) {
      this._opacity = v;
      this.dispatchEvent({
        type: 'opacity-property-changed',
        opacity: v
      });
    }
  }

  /**
   * Gets the colorimetry parameters of this layer.
   */
  get colorimetry() {
    return this._colorimetry;
  }

  /**
   * Gets or sets the brightness of this layer.
   */
  get brightness() {
    return this._colorimetry.brightness;
  }
  set brightness(v) {
    if (this._colorimetry.brightness !== v) {
      this._colorimetry.brightness = v;
      this.dispatchEvent({
        type: 'brightness-property-changed',
        brightness: v
      });
    }
  }

  /**
   * Gets or sets the contrast of this layer.
   */
  get contrast() {
    return this._colorimetry.contrast;
  }
  set contrast(v) {
    if (this._colorimetry.contrast !== v) {
      this._colorimetry.contrast = v;
      this.dispatchEvent({
        type: 'contrast-property-changed',
        contrast: v
      });
    }
  }

  /**
   * Gets or sets the saturation of this layer.
   */
  get saturation() {
    return this._colorimetry.saturation;
  }
  set saturation(v) {
    if (this._colorimetry.saturation !== v) {
      this._colorimetry.saturation = v;
      this.dispatchEvent({
        type: 'saturation-property-changed',
        saturation: v
      });
    }
  }
  updateMaterial(material) {
    if (material.hasColorLayer(this)) {
      // Update material parameters
      material.setLayerVisibility(this, this.visible);
      material.setLayerOpacity(this, this.opacity);
      material.setLayerElevationRange(this, this._elevationRange);
      material.setColorimetry(this, this._colorimetry.brightness, this._colorimetry.contrast, this._colorimetry.saturation);
    }
  }
  getRenderTargetDataType() {
    switch (this.interpretation.mode) {
      case InterpretationMode.ScaleToMinMax:
        return FloatType;
      default:
        return this.source.datatype;
    }
  }
  getRenderTargetPixelFormat() {
    return RGBAFormat;
  }
  canFetchImages(target) {
    // A special case for synchronous sources, since this optimization is not necessary
    // as synchronous sources can immediately return the image without actually loading
    // anything (i.e no HTTP requests). This is necessary to fix #525
    if (this.source.synchronous) {
      return true;
    }
    return target.node.canProcessColorLayer();
  }
  unregisterNode(node) {
    super.unregisterNode(node);
    const material = node.material;
    if (material != null) {
      if (material.indexOfColorLayer(this) !== -1) {
        material.removeColorLayer(this);
      }
    }
  }
  applyTextureToNode(result, target) {
    const material = target.node.material;
    if (!material.hasColorLayer(this)) {
      material.pushColorLayer(this, target.extent);
    }
    target.node.material.setColorTextures(this, result);
  }
  applyEmptyTextureToNode(target) {
    target.node.material.removeColorLayer(this);
  }
  pickFeaturesFrom(pickedResult, options) {
    const vectorOptions = {
      radius: options?.radius ?? 0,
      xTileRes: 0,
      yTileRes: 0
    };
    if (vectorOptions.radius > 0) {
      const tileExtent = pickedResult.object.extent.as(pickedResult.coord.crs).dimensions();
      vectorOptions.xTileRes = tileExtent.x / pickedResult.entity.imageSize.x;
      vectorOptions.yTileRes = tileExtent.y / pickedResult.entity.imageSize.y;
    }
    return this.getVectorFeaturesAtCoordinate(pickedResult.coord, vectorOptions).map(feature => ({
      isVectorPickFeature: true,
      layer: this,
      feature
    }));
  }

  /**
   * Returns all features at some coordinates, with an optional hit tolerance radius.
   *
   * @param coordinate - Coordinates
   * @param options - Options
   * @returns Array of features at coordinates (can be empty)
   */
  getVectorFeaturesAtCoordinate(coordinate, options) {
    const layerProjection = this.getExtent()?.crs;
    if (layerProjection == null) {
      return [];
    }
    const radius = options?.radius ?? 0;
    const xTileRes = options?.xTileRes;
    const yTileRes = options?.yTileRes;
    if (radius > 0) {
      if (!isFiniteNumber(xTileRes) || !isFiniteNumber(yTileRes)) {
        console.warn('Calling getVectorFeaturesAtCoordinate with radius but no tile resolution, this will return nothing');
        return [];
      }
      const results = [];
      // First, define a square extent around the point
      // We might get more features than wanted, so we'll need to filter them afterwards.
      const e = new Extent(coordinate.crs, coordinate.x - xTileRes * radius, coordinate.x + xTileRes * radius, coordinate.y - yTileRes * radius, coordinate.y + yTileRes * radius);
      const features = this.getVectorFeaturesInExtent(e);
      const coordinateLayer = coordinate.as(layerProjection);
      const coord = [coordinateLayer.x, coordinateLayer.y];
      for (const feat of features) {
        const geometry = feat.getGeometry();
        if (!geometry) {
          continue;
        }

        // Check the feature is really in the picking circle
        if (geometry.intersectsCoordinate(coord)) {
          results.push(feat);
          continue;
        }
        const closestPoint = geometry.getClosestPoint(coord);
        const distX = Math.abs(closestPoint[0] - coord[0]) / xTileRes;
        const distY = Math.abs(closestPoint[1] - coord[1]) / yTileRes;
        if (distX ** 2 + distY ** 2 <= radius ** 2) {
          results.push(feat);
          continue;
        }
      }
      return results;
    }
    if (this.source.isVectorSource && this.visible) {
      const coordinateLayer = coordinate.as(layerProjection);
      const coord = [coordinateLayer.x, coordinateLayer.y];
      const olSource = this.source.source;
      return olSource.getFeaturesAtCoordinate(coord);
    }
    return [];
  }

  /**
   * Get all features whose bounding box intersects the provided extent.
   * Note that this returns an array of all features intersecting the given extent in random order
   * (so it may include features whose geometries do not intersect the extent).
   *
   * @param extent - Extent
   * @returns Array of features intersecting the extent (can be empty)
   */
  getVectorFeaturesInExtent(extent) {
    if (this.source.isVectorSource && this.visible) {
      const layerProjection = this.getExtent()?.crs;
      if (layerProjection == null) {
        return [];
      }
      const extentLayer = extent.as(layerProjection);
      const olExtent = OpenLayersUtils.toOLExtent(extentLayer);
      const olSource = this.source.source;
      return olSource.getFeaturesInExtent(olExtent);
    }
    return [];
  }
}

/**
 * Returns `true` if the given object is a {@link ColorLayer}.
 */
export function isColorLayer(obj) {
  return typeof obj === 'object' && obj?.isColorLayer;
}
export default ColorLayer;