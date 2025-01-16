import { Texture, UnsignedByteType } from 'three';
import OffsetScale from '../OffsetScale';
import ColorLayer from './ColorLayer';
/**
 * Modes of the mask layer.
 */
var MaskMode = /*#__PURE__*/function (MaskMode) {
  MaskMode[MaskMode["Normal"] = 1] = "Normal";
  MaskMode[MaskMode["Inverted"] = 2] = "Inverted";
  return MaskMode;
}(MaskMode || {});
const EMPTY_TEXTURE = new Texture();
const DEFAULT_PITCH = OffsetScale.identity();
/**
 * A {@link ColorLayer} that can be used to mask parts of
 * a map. The source can be any source supported by the color layers.
 *
 */
class MaskLayer extends ColorLayer {
  /**
   * Read-only flag to check if a given object is of type MaskLayer.
   */
  isMaskLayer = true;

  /**
   * Creates a mask layer.
   * It should be added in a `Map` to be displayed in the instance.
   * See the example for more information on layer creation.
   *
   * @param options - The layer options.
   */
  constructor(options) {
    super(options);
    this.isMaskLayer = true;
    this.type = 'MaskLayer';
    this._maskMode = options.maskMode ?? MaskMode.Normal;
  }

  /**
   * Gets or set the mask mode.
   */
  get maskMode() {
    return this._maskMode;
  }
  set maskMode(v) {
    this._maskMode = v;
  }
  getRenderTargetDataType() {
    return UnsignedByteType;
  }
  applyEmptyTextureToNode(target) {
    const material = target.node.material;
    if (!material.hasColorLayer(this)) {
      material.pushColorLayer(this, target.extent);
    }

    // We cannot remove the layer from the material, contrary to what is done for
    // other layer types, because since this layer acts as a mask, it must be defined
    // for the entire map.
    material.setColorTextures(this, {
      texture: EMPTY_TEXTURE,
      pitch: DEFAULT_PITCH
    });
  }
  getVectorFeaturesAtCoordinate() {
    return [];
  }
  getVectorFeaturesInExtent() {
    return [];
  }
}
function isMaskLayer(obj) {
  return obj?.isMaskLayer;
}
export default MaskLayer;
export { isMaskLayer, MaskMode };