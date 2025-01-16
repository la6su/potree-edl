import { Color, GLSL3, Matrix4, NoBlending, NormalBlending, ShaderMaterial, Uniform, Vector2, Vector3, Vector4 } from 'three';
import ColorMap from '../core/ColorMap';
import OffsetScale from '../core/OffsetScale';
import MaterialUtils from './MaterialUtils';
/* babel-plugin-inline-import './shader/PointsFS.glsl' */
const PointsFS = "#include <giro3d_precision_qualifiers>\n#include <giro3d_fragment_shader_header>\n#include <giro3d_common>\n\n#include <common>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n#include <fog_pars_fragment>\n\nvarying vec4 vColor;\nuniform vec3 brightnessContrastSaturation;\n\nconst float HALF_LENGTH = 0.5;\nconst vec2 POINT_CENTER = vec2(HALF_LENGTH, HALF_LENGTH);\nconst float HALF_LENGTH_SQUARED = HALF_LENGTH * HALF_LENGTH;\n\nfloat sqLength(in vec2 v) {\n    return v.x * v.x + v.y * v.y;\n}\n\nvoid main() {\n    if (vColor.a < 0.001) {\n        discard;\n        return;\n    }\n\n    // circular point rendering\n    if (sqLength(gl_PointCoord - POINT_CENTER) > HALF_LENGTH_SQUARED){\n        discard;\n        return;\n    }\n\n    #include <clipping_planes_fragment>\n\n    gl_FragColor = vec4(adjustBrightnessContrastSaturation(vColor.rgb, brightnessContrastSaturation), vColor.a);\n\n    #include <colorspace_fragment>\n    #include <fog_fragment>\n    #include <logdepthbuf_fragment>\n}\n";
/* babel-plugin-inline-import './shader/PointsVS.glsl' */
const PointsVS = "#include <giro3d_precision_qualifiers>\n#include <giro3d_common>\n\n#include <common>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n#include <fog_pars_vertex>\n\n#define EPSILON 1e-6\n\nuniform float size;\n\nuniform uint pickingId;\nuniform int mode;\nuniform float opacity;\nuniform vec4 overlayColor;\nattribute vec3 color;\n\nstruct PointCloudColorMap {\n    float min;\n    float max;\n    sampler2D lut;\n};\n\nuniform PointCloudColorMap colorMap;\n\n#if defined(INTENSITY)\n// INTENSITY_TYPE is a define macro\nattribute INTENSITY_TYPE intensity;\n#endif\n\n#if defined(CLASSIFICATION)\nstruct Classification {\n    vec3 color;\n    bool visible;\n};\n\nuniform Classification[256] classifications;\nattribute uint classification;\n#endif\n\n#if defined(NORMAL_OCT16)\nattribute vec2 oct16Normal;\n#elif defined(NORMAL_SPHEREMAPPED)\nattribute vec2 sphereMappedNormal;\n#endif\n\nuniform sampler2D overlayTexture;\nuniform int decimation;\nuniform float hasOverlayTexture;\nuniform vec4 offsetScale;\nuniform vec2 extentBottomLeft;\nuniform vec2 extentSize;\n\nvarying vec4 vColor;\n\n// see https://web.archive.org/web/20150303053317/http://lgdv.cs.fau.de/get/1602\n// and implementation in PotreeConverter (BINPointReader.cpp) and potree (BinaryDecoderWorker.js)\n#if defined(NORMAL_OCT16)\nvec3 decodeOct16Normal(vec2 encodedNormal) {\n    vec2 nNorm = 2. * (encodedNormal / 255.) - 1.;\n    vec3 n;\n    n.z = 1. - abs(nNorm.x) - abs(nNorm.y);\n    if (n.z >= 0.) {\n        n.x = nNorm.x;\n        n.y = nNorm.y;\n    } else {\n        n.x = sign(nNorm.x) - sign(nNorm.x) * sign(nNorm.y) * nNorm.y;\n        n.y = sign(nNorm.y) - sign(nNorm.y) * sign(nNorm.x) * nNorm.x;\n    }\n    return normalize(n);\n}\n#elif defined(NORMAL_SPHEREMAPPED)\n// see http://aras-p.info/texts/CompactNormalStorage.html method #4\n// or see potree's implementation in BINPointReader.cpp\nvec3 decodeSphereMappedNormal(vec2 encodedNormal) {\n    vec2 fenc = 2. * encodedNormal / 255. - 1.;\n    float f = dot(fenc,fenc);\n    float g = 2. * sqrt(1. - f);\n    vec3 n;\n    n.xy = fenc * g;\n    n.z = 1. - 2. * f;\n    return n;\n}\n#endif\n\n#ifdef DEFORMATION_SUPPORT\nuniform int enableDeformations;\nstruct Deformation {\n    mat4 transformation;\n    vec3 vec;\n    vec2 origin;\n    vec2 influence;\n    vec4 colors;\n};\n\nuniform Deformation deformations[NUM_TRANSFO];\n#endif\n\nvoid main() {\n    if (decimation > 1 && gl_VertexID % decimation != 0) {\n        // Move the vertex out of the render area to prevent calling the fragment shader for\n        // this point, saving a lot of GPU processing time when millions of points are displayed.\n        gl_PointSize = 0.0;\n        gl_Position = vec4(-9999.0, -9999.0, -9999.0, 0.0);\n        return;\n    }\n\n#if defined(NORMAL_OCT16)\n    vec3  normal = decodeOct16Normal(oct16Normal);\n#elif defined(NORMAL_SPHEREMAPPED)\n    vec3 normal = decodeSphereMappedNormal(sphereMappedNormal);\n#elif defined(NORMAL)\n    // nothing to do\n#else\n    // default to color\n    vec3 normal = color;\n#endif\n\n    if (pickingId > uint(0)) {\n        // In picking mode, we simply output the point id in the red channel and the object id in the green channel.\n        // No need to encode them because we are rendering to a float texture.\n        vColor = vec4(float(gl_VertexID), float(pickingId), 0, 1);\n#if defined(INTENSITY)\n    } else if (mode == MODE_INTENSITY) {\n        vColor = sampleColorMap(float(intensity), colorMap.min, colorMap.max, colorMap.lut, 0.0);\n        vColor.a *= opacity;\n#endif\n    } else if (mode == MODE_NORMAL) {\n        vColor = vec4(abs(normal), opacity);\n    } else if (mode == MODE_TEXTURE) {\n        vec2 pp = (modelMatrix * vec4(position, 1.0)).xy;\n        // offsetScale is from bottomleft\n        pp.x -= extentBottomLeft.x;\n        pp.y -= extentBottomLeft.y;\n        pp *= offsetScale.zw / extentSize;\n        pp += offsetScale.xy;\n        vec3 textureColor = texture2D(overlayTexture, pp).rgb;\n        vColor = vec4(mix(textureColor, overlayColor.rgb, overlayColor.a), opacity * hasOverlayTexture);\n    } else if (mode == MODE_ELEVATION) {\n        float z = (modelMatrix * vec4(position, 1.0)).z;\n        vColor = sampleColorMap(z, colorMap.min, colorMap.max, colorMap.lut, 0.0);\n        vColor.a *= opacity;\n#if defined(CLASSIFICATION)\n    } else if (mode == MODE_CLASSIFICATION) {\n        Classification classif = classifications[classification];\n        vColor.rgb = classif.color;\n        vColor.a = classif.visible ? opacity : 0.0;\n#endif\n    } else {\n        // default to color mode\n\n        // We need to convert to linear color space because the colors are in sRGB and they\n        // are not automatically converted to sRGB-linear. This is due to the fact that those\n        // colors come from a vertex buffer and not from a texture (automatically converted)\n        // or a single color uniform (also automatically converted).\n        vec4 linear = sRGBToLinear(vec4(color, 1.0));\n        vColor = vec4(mix(linear.rgb, overlayColor.rgb, overlayColor.a), opacity);\n    }\n\n    mat4 mvMatrix = modelViewMatrix;\n\n    #ifdef DEFORMATION_SUPPORT\n    if (!pickingMode) {\n        vColor = enableDeformations > 0 ?\n            vec4(0.0, 1.0, 1.0, 1.0):\n            vec4(1.0, 0.0, 1.0, 1.0);\n    }\n    if (enableDeformations > 0) {\n        vec4 mPosition = modelMatrix * vec4(position, 1.0);\n        float minDistance = 1000.0;\n        int bestChoice = -1;\n        for (int i = 0; i < NUM_TRANSFO; i++) {\n            if (i >= enableDeformations) {\n                break;\n            }\n            vec2 v = deformations[i].vec.xy;\n            float length = deformations[i].vec.z;\n            float depassement_x =\n                length * (deformations[i].influence.x - 1.0);\n\n            vec2 diff = mPosition.xy - origin[i];\n            float distance_x = dot(diff, v);\n\n            if (-depassement_x <= distance_x &&\n                    distance_x <= (length + depassement_x)) {\n                vec2 normal = vec2(-v.y, v.x);\n                float d = abs(dot(diff, normal));\n                if (d < minDistance && d <= deformations[i].influence.y) {\n                    minDistance = d;\n                    bestChoice = i;\n                }\n            }\n        }\n\n        if (bestChoice >= 0) {\n            // override modelViewMatrix\n            mvMatrix = deformations[bestChoice].transformation;\n            vColor = mix(\n                deformations[bestChoice].color,\n                vec4(color, 1.0),\n                0.5);\n        }\n    }\n    #endif\n\n    #include <begin_vertex>\n    #include <project_vertex>\n\n    if (size > 0.) {\n        gl_PointSize = size;\n    } else {\n        gl_PointSize = clamp(-size / gl_Position.w, 3.0, 10.0);\n    }\n\n    #include <fog_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n}\n";
const tmpDims = new Vector2();

/**
 * Specifies the way points are colored.
 */
export let MODE = /*#__PURE__*/function (MODE) {
  MODE[MODE["COLOR"] = 0] = "COLOR";
  MODE[MODE["INTENSITY"] = 1] = "INTENSITY";
  MODE[MODE["CLASSIFICATION"] = 2] = "CLASSIFICATION";
  MODE[MODE["NORMAL"] = 3] = "NORMAL";
  MODE[MODE["TEXTURE"] = 4] = "TEXTURE";
  MODE[MODE["ELEVATION"] = 5] = "ELEVATION";
  return MODE;
}({});
const NUM_TRANSFO = 16;

/**
 * Paremeters for a point cloud classification.
 */
export class Classification {
  /**
   * The color of this classification.
   */

  /**
   * Toggles the visibility of points with this classification.
   */

  constructor(color, visible = true) {
    this.color = new Color(color);
    this.visible = visible;
  }

  /**
   * Clones this classification.
   * @returns The cloned object.
   */
  clone() {
    return new Classification(this.color.clone(), this.visible);
  }
}

/**
 * A set of 256 pre-defined classifications following the ASPRS scheme, with pre-defined colors for
 * classifications 0 to 18. The remaining classifications have the default color (#FF8100)
 *
 * See https://www.asprs.org/wp-content/uploads/2010/12/LAS_Specification.pdf
 */
export const ASPRS_CLASSIFICATIONS = new Array(256);
const DEFAULT_CLASSIFICATION = new Classification(0xff8100);
for (let i = 0; i < ASPRS_CLASSIFICATIONS.length; i++) {
  ASPRS_CLASSIFICATIONS[i] = DEFAULT_CLASSIFICATION.clone();
}
ASPRS_CLASSIFICATIONS[0] = new Classification('#858585'); // Created, never classified
ASPRS_CLASSIFICATIONS[1] = new Classification('#bfbfbf'); // Unclassified
ASPRS_CLASSIFICATIONS[2] = new Classification('#834000'); // Ground
ASPRS_CLASSIFICATIONS[3] = new Classification('#008100'); // Low vegetation
ASPRS_CLASSIFICATIONS[4] = new Classification('#00bf00'); // Medium vegetation
ASPRS_CLASSIFICATIONS[5] = new Classification('#00ff00'); // High vegetation
ASPRS_CLASSIFICATIONS[6] = new Classification('#0081c1'); // Building
ASPRS_CLASSIFICATIONS[7] = new Classification('#ff0000'); // Low point (noise)
ASPRS_CLASSIFICATIONS[8] = DEFAULT_CLASSIFICATION.clone(); // Reserved
ASPRS_CLASSIFICATIONS[9] = new Classification('#0000ff'); // Water
ASPRS_CLASSIFICATIONS[10] = new Classification('#606d73'); // Rail
ASPRS_CLASSIFICATIONS[11] = new Classification('#858585'); // Road surface
ASPRS_CLASSIFICATIONS[12] = DEFAULT_CLASSIFICATION.clone(); // Reserved
ASPRS_CLASSIFICATIONS[13] = new Classification('#ede440'); // Wire - Guard (Shield)
ASPRS_CLASSIFICATIONS[14] = new Classification('#ed6840'); // Wire - Conductor (Phase)
ASPRS_CLASSIFICATIONS[15] = new Classification('#29fff8'); // Transmission Tower
ASPRS_CLASSIFICATIONS[16] = new Classification('#5e441d'); // Wire Structure connector (e.g Insulator)
ASPRS_CLASSIFICATIONS[17] = new Classification('#7992c7'); // Bridge Deck
ASPRS_CLASSIFICATIONS[18] = new Classification('#cd27d6'); // High Noise

function createDefaultColorMap() {
  const colors = [new Color('black'), new Color('white')];
  return new ColorMap({
    colors,
    min: 0,
    max: 1000
  });
}

/**
 * Material used for point clouds.
 */
class PointCloudMaterial extends ShaderMaterial {
  isPointCloudMaterial = true;
  disposed = false;
  _colorMap = createDefaultColorMap();

  /**
   * @internal
   */
  // @ts-expect-error property is not assignable.

  /**
   * @internal
   */

  /**
   * Gets or sets the point size.
   */
  get size() {
    return this.uniforms.size.value;
  }
  set size(value) {
    this.uniforms.size.value = value;
  }

  /**
   * Gets or sets the point decimation value.
   * A decimation value of N means that we take every Nth point and discard the rest.
   */
  get decimation() {
    return this.uniforms.decimation.value;
  }
  set decimation(value) {
    this.uniforms.decimation.value = value;
  }

  /**
   * Gets or sets the display mode (color, classification...)
   */
  get mode() {
    return this.uniforms.mode.value;
  }
  set mode(mode) {
    this.uniforms.mode.value = mode;
  }

  /**
   * @internal
   */
  get pickingId() {
    return this.uniforms.pickingId.value;
  }

  /**
   * @internal
   */
  set pickingId(id) {
    this.uniforms.pickingId.value = id;
  }

  /**
   * Gets or sets the overlay color (default color).
   */
  get overlayColor() {
    return this.uniforms.overlayColor.value;
  }
  set overlayColor(color) {
    this.uniforms.overlayColor.value = color;
  }

  /**
   * Gets or sets the brightness of the points.
   */
  get brightness() {
    return this.uniforms.brightnessContrastSaturation.value.x;
  }
  set brightness(v) {
    this.uniforms.brightnessContrastSaturation.value.setX(v);
  }

  /**
   * Gets or sets the contrast of the points.
   */
  get contrast() {
    return this.uniforms.brightnessContrastSaturation.value.y;
  }
  set contrast(v) {
    this.uniforms.brightnessContrastSaturation.value.setY(v);
  }

  /**
   * Gets or sets the saturation of the points.
   */
  get saturation() {
    return this.uniforms.brightnessContrastSaturation.value.z;
  }
  set saturation(v) {
    this.uniforms.brightnessContrastSaturation.value.setZ(v);
  }

  /**
   * Gets or sets the classifications of the points.
   * Up to 256 values are supported (i.e classifications in the range 0-255).
   * @defaultValue {@link ASPRS_CLASSIFICATIONS} (see https://www.asprs.org/wp-content/uploads/2010/12/LAS_Specification.pdf)
   */
  get classifications() {
    if (this.uniforms.classifications == null) {
      // Initialize with default values
      this.uniforms.classifications = new Uniform(ASPRS_CLASSIFICATIONS);
    }
    return this.uniforms.classifications.value;
  }
  set classifications(classifications) {
    let actual = classifications;
    if (classifications.length > 256) {
      actual = classifications.slice(0, 256);
      console.warn('The provided classification array has been truncated to 256 elements');
    } else if (classifications.length < 256) {
      actual = new Array(256);
      for (let i = 0; i < actual.length; i++) {
        if (i < classifications.length) {
          actual[i] = classifications[i];
        } else {
          actual[i] = DEFAULT_CLASSIFICATION.clone();
        }
      }
    }
    if (this.uniforms.classifications == null) {
      // Initialize with default values
      this.uniforms.classifications = new Uniform(actual);
    }
    this.uniforms.classifications.value = actual;
  }

  /**
   * @internal
   */
  get enableClassification() {
    return this.defines.CLASSIFICATION !== undefined;
  }

  /**
   * @internal
   */
  set enableClassification(enable) {
    MaterialUtils.setDefine(this, 'CLASSIFICATION', enable);
    if (enable && this.uniforms.classifications == null) {
      // Initialize with default values
      this.uniforms.classifications = new Uniform(ASPRS_CLASSIFICATIONS);
    }
  }
  get colorMap() {
    return this._colorMap;
  }
  set colorMap(colorMap) {
    this._colorMap = colorMap;
  }

  /**
   * Creates a PointsMaterial using the specified options.
   *
   * @param options - The options.
   */
  constructor(options = {}) {
    super({
      clipping: true,
      glslVersion: GLSL3
    });
    this.vertexShader = PointsVS;
    this.fragmentShader = PointsFS;

    // Default
    this.defines = {
      INTENSITY_TYPE: 'uint'
    };
    for (const key of Object.keys(MODE)) {
      if (Object.prototype.hasOwnProperty.call(MODE, key)) {
        // @ts-expect-error a weird pattern indeed
        this.defines[`MODE_${key}`] = MODE[key];
      }
    }
    this.fog = true;
    this.colorLayer = null;
    this.needsUpdate = true;
    this.uniforms = {
      fogDensity: new Uniform(0.00025),
      fogNear: new Uniform(1),
      fogFar: new Uniform(2000),
      decimation: new Uniform(1),
      fogColor: new Uniform(new Color(0xffffff)),
      classifications: new Uniform(ASPRS_CLASSIFICATIONS),
      // Texture-related uniforms
      extentBottomLeft: new Uniform(new Vector2(0, 0)),
      extentSize: new Uniform(new Vector2(0, 0)),
      overlayTexture: new Uniform(null),
      hasOverlayTexture: new Uniform(0),
      offsetScale: new Uniform(new OffsetScale(0, 0, 1, 1)),
      colorMap: new Uniform({
        lut: this.colorMap.getTexture(),
        min: this.colorMap.min,
        max: this.colorMap.max
      }),
      size: new Uniform(options.size ?? 0),
      mode: new Uniform(options.mode ?? MODE.COLOR),
      pickingId: new Uniform(0),
      opacity: new Uniform(this.opacity),
      overlayColor: new Uniform(options.overlayColor ?? new Vector4(0, 0, 0, 0)),
      brightnessContrastSaturation: new Uniform(new Vector3(0, 1, 1)),
      enableDeformations: new Uniform(false),
      deformations: new Uniform([])
    };
    for (let i = 0; i < NUM_TRANSFO; i++) {
      this.uniforms.deformations.value.push({
        transformation: new Matrix4(),
        vec: new Vector3(),
        origin: new Vector2(),
        influence: new Vector2(),
        color: new Color()
      });
    }
  }
  dispose() {
    if (this.disposed) {
      return;
    }
    this.dispatchEvent({
      type: 'dispose'
    });
    this.disposed = true;
  }
  clone() {
    const cl = super.clone();
    cl.update(this);
    return cl;
  }

  /**
   * Internally used for picking.
   * @internal
   */
  enablePicking(picking) {
    this.pickingId = picking;
    this.blending = picking ? NoBlending : NormalBlending;
  }
  hasColorLayer(layer) {
    return this.colorLayer === layer;
  }
  updateUniforms() {
    this.uniforms.opacity.value = this.opacity;
    const colorMapUniform = this.uniforms.colorMap.value;
    colorMapUniform.min = this.colorMap.min;
    colorMapUniform.max = this.colorMap.max;
    colorMapUniform.lut = this.colorMap.getTexture();
  }
  onBeforeRender() {
    this.uniforms.opacity.value = this.opacity;
  }
  update(source) {
    if (source) {
      this.visible = source.visible;
      this.opacity = source.opacity;
      this.transparent = source.transparent;
      this.needsUpdate = true;
      this.size = source.size;
      this.mode = source.mode;
      this.overlayColor.copy(source.overlayColor);
      this.classifications = source.classifications;
      this.brightness = source.brightness;
      this.contrast = source.contrast;
      this.saturation = source.saturation;
      this.colorMap = source.colorMap;
      this.decimation = source.decimation;
    }
    this.updateUniforms();
    if (source) {
      Object.assign(this.defines, source.defines);
    }
    return this;
  }
  removeColorLayer() {
    this.mode = MODE.COLOR;
    this.colorLayer = null;
    this.uniforms.overlayTexture.value = null;
    this.needsUpdate = true;
    this.uniforms.hasOverlayTexture.value = 0;
  }
  pushColorLayer(layer, extent) {
    this.mode = MODE.TEXTURE;
    this.colorLayer = layer;
    this.uniforms.extentBottomLeft.value.set(extent.west, extent.south);
    const dim = extent.dimensions(tmpDims);
    this.uniforms.extentSize.value.copy(dim);
    this.needsUpdate = true;
  }
  indexOfColorLayer(layer) {
    if (layer === this.colorLayer) {
      return 0;
    }
    return -1;
  }
  getColorTexture(layer) {
    if (layer !== this.colorLayer) {
      return null;
    }
    return this.uniforms.overlayTexture?.value;
  }
  setColorTextures(layer, textureAndPitch) {
    const {
      texture
    } = textureAndPitch;
    this.uniforms.overlayTexture.value = texture;
    this.uniforms.hasOverlayTexture.value = 1;
  }
  setLayerVisibility() {
    // no-op
  }
  setLayerOpacity() {
    // no-op
  }
  setLayerElevationRange() {
    // no-op
  }
  setColorimetry() {
    // Not implemented because the points have their own BCS controls
  }

  /**
   * Unused for now.
   * @internal
   */
  enableTransfo(v) {
    if (v) {
      this.defines.DEFORMATION_SUPPORT = 1;
      this.defines.NUM_TRANSFO = NUM_TRANSFO;
    } else {
      delete this.defines.DEFORMATION_SUPPORT;
      delete this.defines.NUM_TRANSFO;
    }
    this.needsUpdate = true;
  }
  static isPointCloudMaterial = obj => obj?.isPointCloudMaterial;
}
export default PointCloudMaterial;