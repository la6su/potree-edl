import { ClampToEdgeWrapping, Color, LinearFilter, MathUtils, Mesh, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, Texture, UnsignedByteType, Vector4, WebGLRenderTarget } from 'three';
import Interpretation from '../../core/layer/Interpretation';
import Rect from '../../core/Rect';
import Capabilities from '../../core/system/Capabilities';
import { isMesh, isTexture } from '../../utils/predicates';
import TextureGenerator from '../../utils/TextureGenerator';
import MemoryTracker from '../MemoryTracker';
import ComposerTileMaterial, { isComposerTileMaterial } from './ComposerTileMaterial';
let SHARED_PLANE_GEOMETRY = null;
const IMAGE_Z = -10;
const textureOwners = new Map();
const NEAR = 1;
const FAR = 100;
const DEFAULT_CLEAR = new Color(0, 0, 0);
function processTextureDisposal(event) {
  const texture = event.target;
  texture.removeEventListener('dispose', processTextureDisposal);
  const owner = textureOwners.get(texture.uuid);
  if (owner) {
    owner.dispose();
    textureOwners.delete(texture.uuid);
  } else {
    // This should never happen
    console.error('no owner for ', texture);
  }
}
/**
 * Composes images together using a three.js scene and an orthographic camera.
 */
class WebGLComposer {
  /**
   * Creates an instance of WebGLComposer.
   *
   * @param options - The options.
   */
  constructor(options) {
    this._showImageOutlines = options.showImageOutlines ?? false;
    this._showEmptyTextures = options.showEmptyTextures ?? false;
    this._extent = options.extent;
    this.width = options.width;
    this.height = options.height;
    this._renderer = options.webGLRenderer;
    this._reuseTexture = options.reuseTexture ?? false;
    this._clearColor = options.clearColor;
    const defaultFilter = TextureGenerator.getCompatibleTextureFilter(LinearFilter, options.textureDataType, options.webGLRenderer);
    this._minFilter = options.minFilter || defaultFilter;
    this._magFilter = options.magFilter || defaultFilter;
    this.dataType = options.textureDataType;
    this.pixelFormat = options.pixelFormat;
    this._expandRGB = options.expandRGB ?? false;
    if (!SHARED_PLANE_GEOMETRY) {
      SHARED_PLANE_GEOMETRY = new PlaneGeometry(1, 1, 1, 1);
      MemoryTracker.track(SHARED_PLANE_GEOMETRY, 'WebGLComposer - PlaneGeometry');
    }

    // An array containing textures that this composer has created, to be disposed later.
    this._ownedTextures = [];
    this._scene = new Scene();

    // Define a camera centered on (0, 0), with its
    // orthographic size matching size of the extent.
    this._camera = new OrthographicCamera();
    this._camera.near = NEAR;
    this._camera.far = FAR;
    if (this._extent) {
      this.setCameraRect(this._extent);
    }
  }

  /**
   * Sets the camera frustum to the specified rect.
   *
   * @param rect - The rect.
   */
  setCameraRect(rect) {
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    this._camera.position.set(rect.centerX, rect.centerY, 0);
    this._camera.left = -halfWidth;
    this._camera.right = +halfWidth;
    this._camera.top = +halfHeight;
    this._camera.bottom = -halfHeight;
    this._camera.updateProjectionMatrix();
  }
  createRenderTarget(type, format, width, height) {
    const result = new WebGLRenderTarget(width, height, {
      format,
      anisotropy: Capabilities.getMaxAnisotropy(),
      magFilter: this._magFilter,
      minFilter: this._minFilter,
      type,
      depthBuffer: false,
      generateMipmaps: true
    });

    // Normally, the render target "owns" the texture, and whenever this target
    // is disposed, the texture is disposed with it.
    // However, in our case, we cannot rely on this behaviour because the owner is the composer
    // itself, whose lifetime can be shorter than the texture it created.
    textureOwners.set(result.texture.uuid, result);
    result.texture.addEventListener('dispose', processTextureDisposal);
    result.texture.name = 'WebGLComposer texture';
    MemoryTracker.track(result, 'WebGLRenderTarget');
    MemoryTracker.track(result.texture, 'WebGLRenderTarget.texture');
    return result;
  }

  /**
   * Draws an image to the composer.
   *
   * @param image - The image to add.
   * @param extent - The extent of this texture in the composition space.
   * @param options - The options.
   */
  draw(image, extent, options = {}) {
    // @ts-expect-error the material is assigned just after
    const plane = new Mesh(SHARED_PLANE_GEOMETRY, null);
    MemoryTracker.track(plane, 'WebGLComposer - mesh');
    plane.scale.set(extent.width, extent.height, 1);
    this._scene.add(plane);
    const x = extent.centerX;
    const y = extent.centerY;
    plane.position.set(x, y, 0);
    return this.drawMesh(image, plane, options);
  }

  /**
   * Draws a texture on a custom mesh to the composer.
   *
   * @param image - The image to add.
   * @param mesh - The custom mesh.
   * @param options - Options.
   */
  drawMesh(image, mesh, options = {}) {
    let texture;
    if (!isTexture(image)) {
      texture = new Texture(image);
      texture.needsUpdate = true;
      this._ownedTextures.push(texture);
      MemoryTracker.track(texture, 'WebGLComposer - owned texture');
    } else {
      texture = image;
    }
    TextureGenerator.ensureCompatibility(texture, this._renderer);
    const interpretation = options.interpretation ?? Interpretation.Raw;
    const material = ComposerTileMaterial.acquire({
      texture,
      noDataOptions: {
        enabled: options.fillNoData ?? false,
        radius: options.fillNoDataRadius,
        replacementAlpha: options.fillNoDataAlphaReplacement
      },
      interpretation,
      flipY: options.flipY ?? false,
      transparent: options.transparent ?? false,
      showEmptyTexture: this._showEmptyTextures,
      showImageOutlines: this._showImageOutlines,
      expandRGB: options.expandRGB ?? this._expandRGB,
      convertRGFloatToRGBAUnsignedByte: options.convertRGFloatToRGBAUnsignedByte ?? null
    });
    MemoryTracker.track(material, 'WebGLComposer - material');
    mesh.material = material;
    mesh.renderOrder = options.renderOrder ?? 0;
    mesh.position.setZ(IMAGE_Z);
    this._scene.add(mesh);
    mesh.updateMatrixWorld(true);
    mesh.matrixAutoUpdate = false;
    mesh.matrixWorldAutoUpdate = false;
    return mesh;
  }
  remove(mesh) {
    ComposerTileMaterial.release(mesh.material);
    this._scene.remove(mesh);
  }

  /**
   * Resets the composer to a blank state.
   */
  clear() {
    this.removeTextures();
    this.removeObjects();
  }
  removeObjects() {
    this._scene.traverse(obj => {
      if (isMesh(obj) && isComposerTileMaterial(obj.material)) {
        ComposerTileMaterial.release(obj.material);
      }
    });
    this._scene.clear();
  }
  saveState() {
    return {
      clearAlpha: this._renderer.getClearAlpha(),
      renderTarget: this._renderer.getRenderTarget(),
      scissorTest: this._renderer.getScissorTest(),
      scissor: this._renderer.getScissor(new Vector4()),
      clearColor: this._renderer.getClearColor(new Color()),
      viewport: this._renderer.getViewport(new Vector4())
    };
  }
  restoreState(state) {
    this._renderer.setClearAlpha(state.clearAlpha);
    this._renderer.setRenderTarget(state.renderTarget);
    this._renderer.setScissorTest(state.scissorTest);
    this._renderer.setScissor(state.scissor);
    this._renderer.setClearColor(state.clearColor, state.clearAlpha);
    this._renderer.setViewport(state.viewport);
  }

  /**
   * Renders the composer into a texture.
   *
   * @param opts - The options.
   * @returns The texture of the render target.
   */
  render(opts = {}) {
    const width = opts.target?.width ?? opts.width ?? this.width;
    const height = opts.target?.height ?? opts.height ?? this.height;
    if (width == null || height == null) {
      throw new Error('this composer does not have preset width/height and none was provided');
    }

    // Should we reuse the same render target or create a new one ?
    let target;
    if (opts.target) {
      target = opts.target;
    } else if (!this._reuseTexture) {
      // We create a new render target for this render
      target = this.createRenderTarget(this.dataType, this.pixelFormat, width, height);
    } else {
      if (!this._renderTarget) {
        if (this.width == null || this.height == null) {
          throw new Error('cannot reuse render target without height/width defined ');
        }
        this._renderTarget = this.createRenderTarget(this.dataType, this.pixelFormat, this.width, this.height);
      }
      target = this._renderTarget;
    }
    const previousState = this.saveState();
    if (this._clearColor != null) {
      this._renderer.setClearColor(this._clearColor);
    } else {
      this._renderer.setClearColor(DEFAULT_CLEAR, 0);
    }
    this._renderer.setRenderTarget(target);
    this._renderer.setViewport(0, 0, target.width, target.height);
    this._renderer.clear();
    const rect = opts.rect ?? this._extent;
    if (!rect) {
      throw new Error('no rect provided and no default rect to setup camera');
    }
    this.setCameraRect(rect);

    // If the requested rectangle is not the same as the extent of this composer,
    // then it is a partial render.
    // We need to scissor the output in order to render only the overlap between
    // the requested extent and the extent of this composer.
    if (this._extent && opts.rect && !opts.rect.equals(this._extent)) {
      this._renderer.setScissorTest(true);
      const intersection = this._extent.getIntersection(opts.rect);
      const sRect = Rect.getNormalizedRect(intersection, opts.rect);

      // The pixel margin is necessary to avoid bleeding
      // when textures use linear interpolation.
      const pixelMargin = 1;
      const sx = Math.floor(sRect.x * width - pixelMargin);
      const sy = Math.floor((1 - sRect.y - sRect.h) * height - pixelMargin);
      const sw = Math.ceil(sRect.w * width + 2 * pixelMargin);
      const sh = Math.ceil(sRect.h * height + 2 * pixelMargin);
      this._renderer.setScissor(MathUtils.clamp(sx, 0, width), MathUtils.clamp(sy, 0, height), MathUtils.clamp(sw, 0, width), MathUtils.clamp(sh, 0, height));
    }
    this._renderer.render(this._scene, this._camera);
    target.texture.wrapS = ClampToEdgeWrapping;
    target.texture.wrapT = ClampToEdgeWrapping;
    target.texture.generateMipmaps = false;
    this.restoreState(previousState);
    return target.texture;
  }
  removeTextures() {
    this._ownedTextures.forEach(t => t.dispose());
    this._ownedTextures.length = 0;
  }

  /**
   * Disposes all unmanaged resources in this composer.
   */
  dispose() {
    this.removeTextures();
    this.removeObjects();
    if (this._renderTarget) {
      this._renderTarget.dispose();
    }
  }
}

/**
 * Transfers the pixels of a RenderTarget in the RG format and float32 data type into a RGBA / 8bit.
 */
export function readRGRenderTargetIntoRGBAU8Buffer(options) {
  const {
    renderTarget: originalRenderTarget,
    outputWidth,
    outputHeight,
    renderer
  } = options;
  let type = originalRenderTarget.texture.type;
  let format = originalRenderTarget.texture.format;

  // WebGL mandates that only Unsigned 8-bit RGBA textures be readable,
  // all other combinations are optional and implementation defined.
  // https://registry.khronos.org/webgl/specs/latest/1.0/#5.14.12
  const shouldConvert = type !== UnsignedByteType && format !== RGBAFormat;
  const buffer = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  let target = originalRenderTarget;
  if (shouldConvert) {
    format = RGBAFormat;
    type = UnsignedByteType;
    const rect = new Rect(0, 1, 0, 1);

    // Use the WebGLComposer to convert the render target into the proper format.
    // Note that the output render target is different than the input one.
    const composer = new WebGLComposer({
      textureDataType: type,
      pixelFormat: format,
      webGLRenderer: renderer,
      reuseTexture: false
    });
    composer.draw(originalRenderTarget.texture, rect, {
      convertRGFloatToRGBAUnsignedByte: {
        precision: options.precision,
        offset: options.offset
      }
    });
    target = new WebGLRenderTarget(outputWidth, outputHeight, {
      format,
      type
    });
    composer.render({
      rect,
      target
    });
    composer.dispose();
  }

  // Transfer the elevation raster to CPU memory so that it can be sampled.
  renderer.readRenderTargetPixels(target, 0, 0, outputWidth, outputHeight, buffer);
  if (originalRenderTarget !== target) {
    target.dispose();
  }
  return buffer;
}
export default WebGLComposer;