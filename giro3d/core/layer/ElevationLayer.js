import { FloatType, NoColorSpace, RGFormat } from 'three';
import { isFiniteNumber } from '../../utils/predicates';
import { nonNull } from '../../utils/tsutils';
import Layer from './Layer';
/**
 * A layer that provides elevation data to display terrains.
 */
class ElevationLayer extends Layer {
  /**
   * Read-only flag to check if a given object is of type ElevationLayer.
   */
  isElevationLayer = true;

  /**
   * Creates an elevation layer.
   * See the example for more information on layer creation.
   *
   * @param options - The layer options.
   */
  constructor(options) {
    super({
      ...options,
      noDataOptions: options.noDataOptions ?? {
        replaceNoData: false
      },
      computeMinMax: options.computeMinMax ?? true,
      // If min/max is not provided, we *have* to preload images
      // to compute the min/max during preprocessing.
      preloadImages: options.preloadImages ?? options.minmax == null
    });
    if (options.minmax) {
      this.minmax = options.minmax;
    } else {
      this.minmax = {
        min: 0,
        max: 0,
        isDefault: true
      };
    }
    this.type = 'ElevationLayer';
  }
  getRenderTargetDataType() {
    return FloatType;
  }
  getRenderTargetPixelFormat() {
    // Elevation textures need two channels:
    // - The elevation values
    // - A bitmask to indicate no-data values
    // The closest format that suits those needs is the RGFormat,
    // although we have to be aware that the bitmask is not located
    // in the alpha channel, but in the green channel.
    return RGFormat;
  }
  adjustExtent(extent) {
    // If we know the extent of the source/layer, we can additionally
    // crop the margin extent to ensure it does not overflow the layer extent.
    // This is necessary for elevation layers as they do not use an atlas.
    const thisExtent = this.getExtent();
    if (thisExtent && extent.intersectsExtent(thisExtent)) {
      extent.intersect(thisExtent);
    }
    return extent;
  }
  async onInitialized() {
    // Compute a min/max approximation using the background images that
    // are already present on the composer.
    if (this.minmax == null || this.minmax.isDefault === true) {
      const extent = nonNull(this.getExtent(), 'neither this layer nor the source has an extent');
      const {
        min,
        max
      } = nonNull(this._composer).getMinMax(extent);
      this.minmax = {
        min,
        max
      };
    }
  }
  canFetchImages() {
    return true;
  }
  unregisterNode(node) {
    super.unregisterNode(node);
    node.removeElevationTexture();
    node.material.removeElevationLayer();
  }
  getMinMax(texture) {
    const min = isFiniteNumber(texture.min) ? texture.min : this.minmax.min;
    const max = isFiniteNumber(texture.max) ? texture.max : this.minmax.max;

    // Refine the min/max values using the new texture.
    this.minmax.min = Math.min(min, this.minmax.min);
    this.minmax.max = Math.max(max, this.minmax.max);
    return {
      min,
      max
    };
  }
  applyTextureToNode(textureAndPitch, target, isLastRender) {
    const {
      texture,
      pitch
    } = textureAndPitch;
    const {
      min,
      max
    } = this.getMinMax(texture);
    const node = target.node;
    if (!node.material.hasElevationLayer(this)) {
      node.material.pushElevationLayer(this);
    }
    node.setElevationTexture(this, {
      ...{
        texture,
        pitch,
        min,
        max
      },
      renderTarget: nonNull(target.renderTarget)
    }, isLastRender);
  }
  applyEmptyTextureToNode(target) {
    target.node.removeElevationTexture();
  }
  onTextureCreated(texture) {
    // Elevation textures not being color textures, they must not be
    // subjected to colorspace transformations that would alter their values.
    // See https://threejs.org/docs/#manual/en/introduction/Color-management
    texture.colorSpace = NoColorSpace;
  }
}

/**
 * Returns `true` if the given object is a {@link ElevationLayer}.
 */
export function isElevationLayer(obj) {
  return typeof obj === 'object' && obj?.isElevationLayer;
}
export default ElevationLayer;