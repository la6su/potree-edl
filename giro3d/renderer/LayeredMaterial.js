import { Color, GLSL3, NoBlending, NormalBlending, RGBAFormat, ShaderMaterial, Uniform, UnsignedByteType, Vector2, Vector3, Vector4 } from 'three';
import OffsetScale from '../core/OffsetScale';
import Rect from '../core/Rect';
import { getColor } from '../utils/predicates';
import TextureGenerator from '../utils/TextureGenerator';
import { nonNull } from '../utils/tsutils';
import WebGLComposer from './composition/WebGLComposer';
import EmptyTexture from './EmptyTexture';
import MaterialUtils from './MaterialUtils';
import MemoryTracker from './MemoryTracker';
import RenderingState from './RenderingState';
/* babel-plugin-inline-import './shader/TileFS.glsl' */
const TileFS = "#include <giro3d_precision_qualifiers>\n#include <giro3d_fragment_shader_header>\n#include <giro3d_common>\n\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n#include <fog_pars_fragment>\n\n/**\n * Map tile fragment shader.\n */\n\n/**\n * Rendering states are modes that change the kind of data that the fragment shader outputs.\n * - FINAL : the FS outputs the regular object's color and aspect. This is the default.\n * - PICKING : the FS outputs (ID, Z, U, V) as Float32 color\n */\nconst int STATE_FINAL = 0;\nconst int STATE_PICKING = 1;\n\nvarying vec2        vUv; // The input UV\nvarying vec3        wPosition; // The input world position\nvarying vec3        vViewPosition;\n\nuniform int         renderingState; // Current rendering state (default is STATE_FINAL)\nuniform int         uuid;           // The ID of the tile mesh (used for the STATE_PICKING rendering state)\n\nuniform float       opacity;        // The entire map opacity\nuniform vec4        backgroundColor; // The background color\nuniform vec3        brightnessContrastSaturation; // Brightness/contrast/saturation for the entire map\n\n#include <giro3d_colormap_pars_fragment>\n#include <giro3d_outline_pars_fragment>\n#include <giro3d_graticule_pars_fragment>\n#include <giro3d_compose_layers_pars_fragment>\n#include <giro3d_contour_line_pars_fragment>\n\n#if defined(ENABLE_ELEVATION_RANGE)\nuniform vec2        elevationRange; // Optional elevation range for the whole tile. Not to be confused with elevation range per layer.\n#endif\n\n#if defined(ENABLE_HILLSHADING)\nuniform Hillshading hillshading;\n#endif\n\nuniform vec2        tileDimensions; // The dimensions of the tile, in CRS units\n\n#if defined(ELEVATION_LAYER)\nuniform sampler2D   elevationTexture;\nuniform LayerInfo   elevationLayer;\nuniform ColorMap    elevationColorMap;  // The elevation layer's optional color map\n#endif\n\nvoid applyHillshading(float hillshade) {\n    // Hillshading expects an sRGB color space, so we have to convert the color\n    // temporarily to sRGB, then back to sRGB-linear. Otherwise the result\n    // looks washed out and lacks contrast.\n    gl_FragColor = sRGBTransferOETF(gl_FragColor);\n    gl_FragColor.rgb *= hillshade;\n    gl_FragColor = sRGBToLinear(gl_FragColor);\n}\n\nvoid main() {\n    #include <clipping_planes_fragment>\n\n    // Step 0 : discard fragment in trivial cases of transparency\n    if (opacity == 0.) {\n        discard;\n    }\n\n    float height = 0.;\n\n#if defined(ELEVATION_LAYER)\n    vec2 elevUv = computeUv(vUv, elevationLayer.offsetScale.xy, elevationLayer.offsetScale.zw);\n    height = getElevation(elevationTexture, elevUv);\n#endif\n\n#if defined(ENABLE_ELEVATION_RANGE)\n    if (clamp(height, elevationRange.x, elevationRange.y) != height) {\n        discard;\n    }\n#endif\n\n    // Step 1 : discard fragment if the elevation texture is transparent\n#if defined(DISCARD_NODATA_ELEVATION)\n#if defined(ELEVATION_LAYER)\n    // Let's discard transparent pixels in the elevation texture\n    // Important note : if there is no elevation texture, all fragments are discarded\n    // because the default value for texture pixels is zero.\n    if (isNoData(elevationTexture, elevUv)) {\n        discard;\n    }\n#else\n    // No elevation layer present, discard completely.\n    discard;\n#endif\n#endif\n\n    // Step 2 : start with the background color\n    gl_FragColor = backgroundColor;\n\n#if defined(ELEVATION_LAYER)\n    // Step 3 : if the elevation layer has a color map, use it as the background color.\n    if (elevationColorMap.mode != COLORMAP_MODE_DISABLED) {\n        vec4 rgba = computeColorMap(\n            tileDimensions,\n            elevationLayer,\n            elevationTexture,\n            elevationColorMap,\n            colorMapAtlas,\n            vUv);\n        gl_FragColor = blend(rgba, gl_FragColor);\n    }\n#endif\n\n    float hillshade = 1.;\n\n#if defined(ELEVATION_LAYER)\n    // Step 5 : compute shading\n#if defined(ENABLE_HILLSHADING)\n    hillshade = calcHillshade(\n        tileDimensions,\n        hillshading,\n        elevationLayer.offsetScale,\n        elevationTexture,\n        elevUv\n    );\n#endif\n#endif\n\n// Shading can be applied either:\n// - before the color layers (i.e only the background pixels will be shaded)\n// - or after the color layers (i.e all pixels will be shaded).\n#if defined(APPLY_SHADING_ON_COLORLAYERS)\n#else\n    applyHillshading(hillshade);\n#endif\n\n    // Step 4 : process all color layers (either directly sampling the atlas texture, or use a color map).\n    // Note: this was originally an included chunk (giro3d_compose_layers_pars_fragment), but due to\n    // the limitation described by https://github.com/mrdoob/three.js/issues/28020,\n    // we have to inline the code so that it can be patched from the material.\n#if VISIBLE_COLOR_LAYER_COUNT\n    float maskOpacity = 1.;\n\n    LayerInfo layer;\n    ColorMap colorMap;\n    vec4 rgba;\n    vec4 blended;\n    vec2 range;\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < COLOR_LAYERS_LOOP_END; i++ ) {\n        layer = layers[UNROLLED_LOOP_INDEX];\n        if (layer.color.a > 0.) {\n            colorMap = layersColorMaps[UNROLLED_LOOP_INDEX];\n\n        // If we are using an atlas texture, then all color layers will get their pixels from this shared texture.\n        #if defined(USE_ATLAS_TEXTURE)\n            rgba = computeColorLayer(tileDimensions, atlasTexture, colorMapAtlas, layer, colorMap, vUv);\n        // Otherwise each color layer will get their pixels from their own texture.\n        #else\n            // We have to unroll the loop because we are accessing an array of samplers without a constant index (i.e UNROLLED_LOOP_INDEX)\n            rgba = computeColorLayer(tileDimensions, colorTextures[UNROLLED_LOOP_INDEX], colorMapAtlas, layer, colorMap, vUv);\n        #endif\n\n        // Let's blend the layer color to the composited color.\n        #if defined(ENABLE_LAYER_MASKS)\n            if (layer.mode == LAYER_MODE_MASK) {\n                // Mask layers do not contribute to the composition color.\n                // instead, they contribute to the overall opacity of the map.\n                maskOpacity *= rgba.a;\n                blended = gl_FragColor;\n            } else if (layer.mode == LAYER_MODE_MASK_INVERTED) {\n                maskOpacity *= (1. - rgba.a);\n                blended = gl_FragColor;\n            } else if (layer.mode == LAYER_MODE_NORMAL) {\n                blended = applyBlending(rgba, gl_FragColor, layer.blendingMode);\n            }\n        #else\n            blended = applyBlending(rgba, gl_FragColor, layer.blendingMode);\n        #endif\n\n#if defined(ENABLE_ELEVATION_RANGE)\n            range = layer.elevationRange;\n            if (clamp(height, range.x, range.y) == height) {\n                gl_FragColor = blended;\n            }\n#else\n            gl_FragColor = blended;\n#endif\n        }\n    }\n    #pragma unroll_loop_end\n\n    gl_FragColor.a *= maskOpacity;\n#endif\n\n    if (gl_FragColor.a <= 0.0) {\n        discard;\n    }\n\n#if defined(ELEVATION_LAYER)\n    // Contour lines\n    #include <giro3d_contour_line_fragment>\n#endif\n\n#if defined(APPLY_SHADING_ON_COLORLAYERS)\n    applyHillshading(hillshade);\n#endif\n\n    gl_FragColor.a *= opacity;\n\n    // Step 6 : apply backface processing.\n    if (!gl_FrontFacing) {\n        // Display the backside in a desaturated, darker tone, to give visual feedback that\n        // we are, in fact, looking at the map from the \"wrong\" side.\n        gl_FragColor.rgb = desaturate(gl_FragColor.rgb, 1.) * 0.5;\n    }\n\n    // Step 7 : draw tile outlines\n    #include <giro3d_outline_fragment>\n\n    #include <giro3d_graticule_fragment>\n\n    #include <logdepthbuf_fragment>\n\n    // Final step : process rendering states.\n    if (gl_FragColor.a <= 0.) {\n        // The fragment is transparent, discard it to short-circuit rendering state evaluation.\n        discard;\n    } else if (renderingState == STATE_FINAL) {\n        gl_FragColor.rgb = adjustBrightnessContrastSaturation(gl_FragColor.rgb, brightnessContrastSaturation);\n        #include <colorspace_fragment>\n        #include <fog_fragment>\n    } else if (renderingState == STATE_PICKING) {\n        float id = float(uuid);\n        float z = height;\n        float u = vUv.x;\n        float v = vUv.y;\n        // Requires a float32 render target\n        gl_FragColor = vec4(id, z, u, v);\n    }\n}\n";
/* babel-plugin-inline-import './shader/TileVS.glsl' */
const TileVS = "#include <giro3d_precision_qualifiers>\n#include <giro3d_common>\n\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n#include <fog_pars_vertex>\n\nuniform sampler2D   elevationTexture;\nuniform LayerInfo   elevationLayer;\n\n#if defined(STITCHING)\nstruct Neighbour {\n    vec4            offsetScale;\n    float           diffLevel;\n};\n\nuniform Neighbour   neighbours[8];\nuniform float       segments;\nuniform vec2        tileDimensions;\nuniform sampler2D   neighbourTextures[8];\n#endif\n\n// Outputs\nvarying vec2        vUv;\nvarying vec3        wPosition; // World space position\nvarying vec3        vViewPosition;\n\nconst int   NULL = -1;\nconst int   NO_CORNER_NEIGHBOUR = 0;\nconst int   ALL_NEIGHBOURS_ARE_SAME_SIZE = 1;\nconst int   SOME_NEIGHBOURS_ARE_BIGGER = 2;\nconst float NO_NEIGHBOUR = -99.;\nconst int   INNER_VERTEX = -1;\n\nconst int TOP = 0;\nconst int TOP_RIGHT = 1;\nconst int RIGHT = 2;\nconst int BOTTOM_RIGHT = 3;\nconst int BOTTOM = 4;\nconst int BOTTOM_LEFT = 5;\nconst int LEFT = 6;\nconst int TOP_LEFT = 7;\n\n#if defined(STITCHING)\nstruct CornerNeighbour {\n    int location;\n    float diffLevel;\n};\n\nbool isEdge(int location) {\n    return mod(float(location), 2.) == 0.;\n}\n\nfloat readNeighbourElevation(vec2 uv, int neighbour, float defaultElevation) {\n    // We don't want UV outside the unit square\n    vec2 vv = clamp01(uv);\n\n    vec4 offsetScale = neighbours[neighbour].offsetScale;\n    vec2 neighbourUv = computeUv(vv, offsetScale.xy, offsetScale.zw);\n\n    // Why can't we simply do neighbourTextures[neighbour] ?\n    // It's because of a limitation of GLSL ES : texture arrays cannot be indexed dynamically.\n    // They must be indexed by a constant expression (a literal or a constant).\n    // See https://stackoverflow.com/a/60110986/2704779\n    if (neighbour == TOP)\n        return getElevationOrDefault(neighbourTextures[TOP], neighbourUv, defaultElevation);\n    if (neighbour == TOP_RIGHT)\n        return getElevationOrDefault(neighbourTextures[TOP_RIGHT], neighbourUv, defaultElevation);\n    if (neighbour == RIGHT)\n        return getElevationOrDefault(neighbourTextures[RIGHT], neighbourUv, defaultElevation);\n    if (neighbour == BOTTOM_RIGHT)\n        return getElevationOrDefault(neighbourTextures[BOTTOM_RIGHT], neighbourUv, defaultElevation);\n    if (neighbour == BOTTOM)\n        return getElevationOrDefault(neighbourTextures[BOTTOM], neighbourUv, defaultElevation);\n    if (neighbour == BOTTOM_LEFT)\n        return getElevationOrDefault(neighbourTextures[BOTTOM_LEFT], neighbourUv, defaultElevation);\n    if (neighbour == LEFT)\n        return getElevationOrDefault(neighbourTextures[LEFT], neighbourUv, defaultElevation);\n    if (neighbour == TOP_LEFT)\n        return getElevationOrDefault(neighbourTextures[TOP_LEFT], neighbourUv, defaultElevation);\n}\n\n// Returns the seam or corner that this UV belongs to.\n// If this UV does not belong to a seam nor a corner, returns INNER_VERTEX\nint locateVertex(vec2 uv) {\n    const float ONE = 1.;\n    const float ZERO = 0.;\n\n    uv = clamp01(uv);\n\n    float x = uv.x;\n    float y = uv.y;\n\n    if (y == ONE) {\n        if (x == ZERO) {\n            return TOP_LEFT;\n        } else if (x == ONE) {\n            return TOP_RIGHT;\n        } else {\n            return TOP;\n        }\n    } else if (y == ZERO) {\n        if (x == ZERO) {\n            return BOTTOM_LEFT;\n        } else if (x == ONE) {\n            return BOTTOM_RIGHT;\n        } else {\n            return BOTTOM;\n        }\n    } else if (x == ONE) {\n        return RIGHT;\n    } else if (x == ZERO) {\n        return LEFT;\n    } else {\n        return INNER_VERTEX;\n    }\n}\n\n/**\n * Computes the offsets of vertex position and UV coordinate to apply to this vertex\n * in order to fuse it with a neighbouring vertex.\n */\nbool computeXYStitchingOffsets(\n    // the UV of the vertex\n    vec2 uv,\n    // the location of the vertex (seam, corner, or inner)\n    int location,\n    // the resulting offset to apply to the vertex local space position\n    out vec3 vertexOffset,\n    // the resulting offset to apply to the vertex UV\n    out vec2 uvOffset) {\n\n    vec3 factor;\n    float axis;\n\n    const vec2 NO_UV_OFFSET = vec2(0, 0);\n    const vec3 NO_POS_OFFSET = vec3(0, 0, 0);\n\n    if (location == RIGHT || location == LEFT) {\n        factor = vec3(0, 1, 0);\n        axis = uv.y;\n    } else if (location == TOP || location == BOTTOM) {\n        factor = vec3(1, 0, 0);\n        axis = uv.x;\n    } else {\n        // we only move vertices that do belong to seams and nothing else.\n        vertexOffset = NO_POS_OFFSET;\n        uvOffset = NO_UV_OFFSET;\n        return false;\n    }\n\n    float diffLevel = neighbours[location].diffLevel;\n    if (diffLevel == NO_NEIGHBOUR) {\n        vertexOffset = NO_POS_OFFSET;\n        uvOffset = NO_UV_OFFSET;\n        return false;\n    }\n\n    // XY-stitching only concerns tiles smaller than their neighbour.\n    if (diffLevel < 0.) {\n        float neighbourFactor = pow(2.0, abs(diffLevel));\n        float modulo = neighbourFactor / segments;\n        float offset = fract(axis / modulo) * modulo;\n        uvOffset = offset * factor.xy;\n        vertexOffset = offset * factor * vec3(tileDimensions, 0);\n        return true;\n    } else {\n        vertexOffset = NO_POS_OFFSET;\n        uvOffset = NO_UV_OFFSET;\n        return false;\n    }\n}\n\nCornerNeighbour getNeighbour(int location) {\n    float diffLevel = neighbours[location].diffLevel;\n    CornerNeighbour result;\n\n    if (diffLevel != NO_NEIGHBOUR) {\n        result.location = location;\n        result.diffLevel = diffLevel;\n    } else {\n        result.location = NULL;\n        result.diffLevel = NO_NEIGHBOUR;\n    }\n\n    return result;\n}\n\n/**\n * Returns the locations of the three possible neighbours of this corner location.\n * If a neighbour is not present, its value is NULL.\n * If a neighbour is bigger than us, short-circuit and return only this neighbour.\n * Returns true if at least one corner neighbour exists.\n */\nivec4 getCornerNeighbours(int location) {\n    int result = ALL_NEIGHBOURS_ARE_SAME_SIZE;\n\n    int n0 = NULL;\n    int n1 = NULL;\n    int n2 = NULL;\n\n    CornerNeighbour cn0;\n    CornerNeighbour cn1;\n    CornerNeighbour cn2;\n\n    float biggerDiffLevel = 0.;\n\n    bool atLeastOne = false;\n\n    float floc = float(location);\n\n    // one of the neighbour is the location itself of course\n    cn0 = getNeighbour(location);\n    if (cn0.diffLevel != NO_NEIGHBOUR) {\n        biggerDiffLevel = min(biggerDiffLevel, cn0.diffLevel);\n        atLeastOne = true;\n    }\n\n    int next = int(mod(floc + 1., 8.));\n    cn1 = getNeighbour(next);\n    if (cn1.diffLevel != NO_NEIGHBOUR) {\n        biggerDiffLevel = min(biggerDiffLevel, cn1.diffLevel);\n        atLeastOne = true;\n    }\n\n    int prev = int(mod(floc - 1., 8.));\n    cn2 = getNeighbour(prev);\n    if (cn2.diffLevel != NO_NEIGHBOUR) {\n        biggerDiffLevel = min(biggerDiffLevel, cn2.diffLevel);\n        atLeastOne = true;\n    }\n\n    if (atLeastOne) {\n        // Eliminate corners that are smaller than the others\n        if (cn0.location != NULL && cn0.diffLevel != biggerDiffLevel) {\n            cn0.location = NULL;\n            result = SOME_NEIGHBOURS_ARE_BIGGER;\n        }\n        if (cn1.location != NULL && cn1.diffLevel != biggerDiffLevel) {\n            cn1.location = NULL;\n            result = SOME_NEIGHBOURS_ARE_BIGGER;\n        }\n        if (cn2.location != NULL && cn2.diffLevel != biggerDiffLevel) {\n            cn2.location = NULL;\n            result = SOME_NEIGHBOURS_ARE_BIGGER;\n        }\n\n        n0 = cn0.location;\n        n1 = cn1.location;\n        n2 = cn2.location;\n\n        return ivec4(result, n0, n1, n2);\n    }\n\n    return ivec4(NO_CORNER_NEIGHBOUR, NULL, NULL, NULL);\n}\n\nfloat computeZStitchedElevation(vec2 uv, int location, float currentElevation) {\n    // First case : the vertex is on an edge\n    if (isEdge(location)) {\n        float diffLevel = neighbours[location].diffLevel;\n\n        // We don't have any neighbour at this location\n        if (diffLevel == NO_NEIGHBOUR) {\n            return currentElevation;\n        }\n\n        // If our neighbour has the same level (hence size), we average the two elevations\n        // This neighbour will do the same in its own vertex shader with our elevation, and\n        // the two vertices will have the same height.\n        float neighbourElevation = readNeighbourElevation(uv, location, currentElevation);\n        if (diffLevel == 0.) {\n            return mix(currentElevation, neighbourElevation, 0.5);\n        } else if (diffLevel < 0.) {\n            // If our neighbour is bigger than us, we don't average. Instead, we take its elevation.\n            // The reason for this behaviour is that it's not possible for the bigger neighbour to\n            // average with our elevation, as the bigger neighbour can have more than one neighbour\n            // for the same edge, making the computation really impractical.\n            return neighbourElevation;\n        }\n    } else {\n        // Corner case (pun intended). This case is more complicated as we can have up to 3 neighbours,\n        // and the rule differ whether one neighbour is bigger than us.\n        // If all the neighbours of this corner have the same depth, we average, otherwise we take the\n        // elevation of the biggest neighbour.\n\n        // First, we need to collect the theoretical neighbours, then eliminate the absent ones.\n        ivec4 corners = getCornerNeighbours(location);\n\n        int cornerSituation = corners[0];\n\n        // First, check that we have at least one corner neighbour.\n        if (cornerSituation != NO_CORNER_NEIGHBOUR) {\n            int n0, n1, n2;\n\n            n0 = corners[1];\n            n1 = corners[2];\n            n2 = corners[3];\n\n            float sum;\n            float weight;\n\n            if (cornerSituation == ALL_NEIGHBOURS_ARE_SAME_SIZE) {\n                // Now compute the weighted average between existing (same level) neighbours.\n                sum = currentElevation;\n                weight = 1.;\n            } else {\n                // If the neighbour(s) are bigger, we don't average with our own elevation, but\n                // we only consider the neighbours' elevation.\n                sum = 0.;\n                weight = 0.;\n            }\n\n            if (n0 != NULL) {\n                sum += readNeighbourElevation(uv, n0, currentElevation);\n                weight += 1.;\n            }\n            if (n1 != NULL) {\n                sum += readNeighbourElevation(uv, n1, currentElevation);\n                weight += 1.;\n            }\n            if (n2 != NULL) {\n                sum += readNeighbourElevation(uv, n2, currentElevation);\n                weight += 1.;\n            }\n\n            return sum / weight;\n        }\n    }\n\n    return currentElevation;\n}\n\n#endif\n\nvoid main() {\n    vUv = uv;\n    #include <begin_vertex>\n\n    float elevation = 0.0;\n\n#if defined(TERRAIN_DEFORMATION)\n#if defined(ELEVATION_LAYER)\n    if(elevationLayer.offsetScale.z > 0.) {\n        vec2 vVv = computeUv(vUv, elevationLayer.offsetScale.xy, elevationLayer.offsetScale.zw);\n\n        elevation = getElevation(elevationTexture, vVv);\n\n#if defined(STITCHING)\n        /*\n            Stitching aims to eliminate visible cracks between neighbouring tiles, that are caused\n            by slight discrepancies in elevation and a different level of detail (LOD).\n\n            This process contains 2 steps : XY-stitching and Z-stitching.\n\n            XY-stitching\n            ============\n\n            XY-stitching works on the horizontal plane and is used to weld seams for neighbour tiles\n            that have a different levels.\n\n            The smallest tile (with the highest level) has a higher vertex density along the seam.\n            Meaning that some vertices will not have an equivalent vertex in the neighbour, leading\n            to visible cracks.\n\n            In this figure, XY-stitching moves vertex A along the seam to the position of B.\n            A and B have now exactly the same position in space, and the crack is removed.\n\n            +------B------+------+      +------A+B----+------+\n            |      |             |      |    / |             |\n            |      |             |      | /    |             |\n            +------A             +  =>  +      |             |\n            |      |             |      |      |             |\n            |      |             |      |      |             |\n            +------+------+------+      +------+------+------+\n\n            Note : XY-stitching only moves intermediate vertices of the seams, not corner vertices.\n\n            Z-stitching\n            ============\n\n            Z-stitching is used to reconcile the variations in elevation (on the Z-axis) between the\n            neighbouring seams, due to the fact that elevation pixels may have slightly different\n            values on each side of the seam.\n        */\n\n        // Locate the vertex (is it on a seam, on a corner, or an inner vertex ?)\n        int location = locateVertex(uv);\n\n        // Don't perform stitching on vertices that are not on borders\n        if (location != INNER_VERTEX) {\n            vec3 vertexOffset;\n            vec2 uvOffset;\n\n            // Is there XY-stiching ?\n            if (computeXYStitchingOffsets(\n                    vUv,\n                    location,\n                    vertexOffset,\n                    uvOffset)) {\n\n                // move the UV and the vertex to perform XY-stitching\n                vUv -= uvOffset;\n                transformed -= vertexOffset;\n\n                // sanitize the UV to fight off potential rounding errors (we don't want the UV to\n                // be outside the unit square)\n                vUv = clamp01(vUv);\n\n                // The vertex has moved, maybe now it location has changed (from seam to corner)\n                location = locateVertex(vUv);\n            }\n\n            // Get the elevation of our vertex in our texture\n            vec2 elevUv = computeUv(vUv, elevationLayer.offsetScale.xy, elevationLayer.offsetScale.zw);\n            float currentElevation = getElevation(elevationTexture, elevUv);\n\n            // Then apply Z-stitching\n            elevation = computeZStitchedElevation(vUv, location, currentElevation);\n        }\n#endif // STITCHING\n    }\n#endif // ELEVATION_LAYER\n#endif // TERRAIN_DEFORMATION\n\n    transformed.z = elevation;\n\n    #include <project_vertex>\n    #include <fog_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n\n    wPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;\n    vViewPosition = -mvPosition.xyz;\n}\n";
const EMPTY_IMAGE_SIZE = 16;
const emptyTexture = new EmptyTexture();
const COLORMAP_DISABLED = 0;
const DISABLED_ELEVATION_RANGE = new Vector2(-999999, 999999);
class TextureInfo {
  constructor(layer) {
    this.layer = layer;
    this.opacity = layer.opacity;
    this.visible = layer.visible;
    this.offsetScale = new OffsetScale(0, 0, 0, 0);
    this.originalOffsetScale = new OffsetScale(0, 0, 0, 0);
    this.texture = emptyTexture;
    this.color = new Color(1, 1, 1);
    this.brightnessContrastSaturation = new Vector3(0, 1, 1);
  }
  get mode() {
    return this.layer.maskMode ?? 0;
  }
}
export const DEFAULT_OUTLINE_COLOR = 'red';
export const DEFAULT_HILLSHADING_INTENSITY = 1;
export const DEFAULT_HILLSHADING_ZFACTOR = 1;
export const DEFAULT_AZIMUTH = 135;
export const DEFAULT_ZENITH = 45;
export const DEFAULT_GRATICULE_COLOR = new Color(0, 0, 0);
export const DEFAULT_GRATICULE_STEP = 500; // meters
export const DEFAULT_GRATICULE_THICKNESS = 1;
function drawImageOnAtlas(width, height, composer, atlasInfo, texture) {
  const dx = atlasInfo.x;
  const dy = atlasInfo.y + nonNull(atlasInfo.offset);
  const rect = new Rect(dx, dx + width, dy, dy + height);
  composer.draw(texture, rect);
}
function updateOffsetScale(imageSize, atlas, originalOffsetScale, width, height, target) {
  if (originalOffsetScale.z === 0 || originalOffsetScale.w === 0) {
    target.set(0, 0, 0, 0);
    return;
  }
  // compute offset / scale
  const xRatio = imageSize.width / width;
  const yRatio = imageSize.height / height;
  target.set(atlas.x / width + originalOffsetScale.x * xRatio, (atlas.y + nonNull(atlas.offset)) / height + originalOffsetScale.y * yRatio, originalOffsetScale.z * xRatio, originalOffsetScale.w * yRatio);
}
function repeat(value, count) {
  const result = new Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = {
      ...value
    };
  }
  return result;
}
class LayeredMaterial extends ShaderMaterial {
  isMemoryUsage = true;
  _colorLayers = [];
  _elevationLayer = null;
  _mustUpdateUniforms = true;
  _needsSorting = true;
  _needsAtlasRepaint = false;
  _composer = null;
  _colorMapAtlas = null;
  _composerDataType = UnsignedByteType;

  // @ts-expect-error property is not assignable.

  defines = {
    VISIBLE_COLOR_LAYER_COUNT: 0
  };
  _hasElevationLayer = false;
  getMemoryUsage(context) {
    // We only consider textures that this material owns. That excludes layer textures.
    const atlas = this._texturesInfo.color.atlasTexture;
    if (atlas) {
      TextureGenerator.getMemoryUsage(context, atlas);
    }
  }
  constructor(params) {
    super({
      clipping: true,
      glslVersion: GLSL3
    });
    this._atlasInfo = params.atlasInfo;
    this.fog = true;
    this._maxTextureImageUnits = params.maxTextureImageUnits;
    this._getIndexFn = params.getIndexFn;
    const options = params.options;
    MaterialUtils.setDefine(this, 'USE_ATLAS_TEXTURE', false);
    MaterialUtils.setDefine(this, 'STITCHING', options.terrain.stitching);
    MaterialUtils.setDefine(this, 'TERRAIN_DEFORMATION', options.terrain.enabled);
    MaterialUtils.setDefine(this, 'DISCARD_NODATA_ELEVATION', options.discardNoData);
    MaterialUtils.setDefine(this, 'ENABLE_ELEVATION_RANGE', options.elevationRange != null);
    MaterialUtils.setDefineValue(this, 'VISIBLE_COLOR_LAYER_COUNT', 0);
    this.fragmentShader = TileFS;
    this.vertexShader = TileVS;
    this._texturesInfo = {
      color: {
        infos: [],
        atlasTexture: null
      },
      elevation: {
        offsetScale: new OffsetScale(0, 0, 0, 0),
        texture: null
      }
    };
    this.side = options.side;
    this._renderer = params.renderer;
    this._forceTextureAtlas = options.forceTextureAtlases ?? false;
    this._hasElevationLayer = params.hasElevationLayer;
    this._composerDataType = params.textureDataType;
    this._colorMapAtlas = options.colorMapAtlas ?? null;
    const elevationRange = options.elevationRange ? new Vector2(options.elevationRange.min, options.elevationRange.max) : DISABLED_ELEVATION_RANGE;
    const elevInfo = this._texturesInfo.elevation;
    this.uniforms = {
      hillshading: new Uniform({
        zenith: DEFAULT_ZENITH,
        azimuth: DEFAULT_AZIMUTH,
        intensity: DEFAULT_HILLSHADING_INTENSITY,
        zFactor: DEFAULT_HILLSHADING_ZFACTOR
      }),
      tileOutlineColor: new Uniform(new Color(DEFAULT_OUTLINE_COLOR)),
      fogDensity: new Uniform(0.00025),
      fogNear: new Uniform(1),
      fogFar: new Uniform(2000),
      fogColor: new Uniform(new Color(0xffffff)),
      segments: new Uniform(options.segments ?? 8),
      contourLines: new Uniform({
        thickness: 1,
        primaryInterval: 100,
        secondaryInterval: 20,
        color: new Vector4(0, 0, 0, 1)
      }),
      graticule: new Uniform({
        color: new Vector4(0, 0, 0, 1),
        thickness: DEFAULT_GRATICULE_THICKNESS,
        position: new Vector4(0, 0, DEFAULT_GRATICULE_STEP, DEFAULT_GRATICULE_STEP)
      }),
      elevationRange: new Uniform(elevationRange),
      renderingState: new Uniform(RenderingState.FINAL),
      tileDimensions: new Uniform(new Vector2()),
      brightnessContrastSaturation: new Uniform(new Vector3(0, 1, 1)),
      neighbours: new Uniform(repeat({
        diffLevel: 0,
        offsetScale: null
      }, 8)),
      neighbourTextures: new Uniform([null, null, null, null, null, null, null, null]),
      // Elevation texture
      elevationTexture: new Uniform(elevInfo.texture),
      elevationLayer: new Uniform({
        brightnessContrastSaturation: new Vector3(0, 1, 1),
        color: new Vector4(0, 0, 0, 0),
        elevationRange: new Vector2(0, 0),
        offsetScale: new OffsetScale(0, 0, 0, 0),
        textureSize: new Vector2(0, 0)
      }),
      // Color textures's layer
      atlasTexture: new Uniform(this._texturesInfo.color.atlasTexture),
      colorTextures: new Uniform([]),
      // Describe the properties of each color layer (offsetScale, color...).
      layers: new Uniform([]),
      layersColorMaps: new Uniform([]),
      colorMapAtlas: new Uniform(null),
      elevationColorMap: new Uniform({
        mode: 0,
        offset: 0,
        max: 0,
        min: 0
      }),
      uuid: new Uniform(0),
      backgroundColor: new Uniform(new Vector4()),
      opacity: new Uniform(1.0)
    };
    this.uniformsNeedUpdate = true;
    this.update(options);
    MemoryTracker.track(this, 'LayeredMaterial');
  }

  /**
   * @param v - The number of segments.
   */
  set segments(v) {
    this.uniforms.segments.value = v;
  }
  updateNeighbour(neighbour, diffLevel, offsetScale, texture) {
    this.uniforms.neighbours.value[neighbour].diffLevel = diffLevel;
    this.uniforms.neighbours.value[neighbour].offsetScale = offsetScale;
    this.uniforms.neighbourTextures.value[neighbour] = texture;
  }
  onBeforeCompile(parameters) {
    // This is a workaround due to a limitation in three.js, documented
    // here: https://github.com/mrdoob/three.js/issues/28020
    // Normally, we would not have to do this and let the loop unrolling do its job.
    // However, in our case, the loop end index is not an integer, but a define.
    // We have to patch the fragment shader ourselves because three.js will not do it
    // before the loop is unrolled, leading to a compilation error.
    parameters.fragmentShader = parameters.fragmentShader.replaceAll('COLOR_LAYERS_LOOP_END', `${this.defines.VISIBLE_COLOR_LAYER_COUNT}`);
  }
  updateColorLayerUniforms() {
    const useAtlas = this.defines.USE_ATLAS_TEXTURE === 1;
    this.sortLayersIfNecessary();
    if (this._mustUpdateUniforms) {
      const layersUniform = [];
      const infos = this._texturesInfo.color.infos;
      const textureUniforms = this.uniforms.colorTextures.value;
      textureUniforms.length = 0;
      for (const info of infos) {
        const layer = info.layer;
        // Ignore non-visible layers
        if (!layer.visible) {
          continue;
        }

        // If we use an atlas, the offset/scale is different.
        const offsetScale = useAtlas ? info.offsetScale : info.originalOffsetScale;
        const tex = info.texture;
        let textureSize = new Vector2(0, 0);
        const image = tex.image;
        if (image != null) {
          textureSize = new Vector2(image.width, image.height);
        }
        const rgb = info.color;
        const a = info.visible ? info.opacity : 0;
        const color = new Vector4(rgb.r, rgb.g, rgb.b, a);
        const elevationRange = info.elevationRange || DISABLED_ELEVATION_RANGE;
        const uniform = {
          offsetScale,
          color,
          textureSize,
          elevationRange,
          mode: info.mode,
          blendingMode: layer.blendingMode,
          brightnessContrastSaturation: info.brightnessContrastSaturation
        };
        layersUniform.push(uniform);
        if (!useAtlas) {
          textureUniforms.push(tex);
        }
      }
      this.uniforms.layers.value = layersUniform;
    }
  }
  dispose() {
    this.dispatchEvent({
      type: 'dispose'
    });
    for (const layer of this._colorLayers) {
      const index = this.indexOfColorLayer(layer);
      if (index === -1) {
        continue;
      }
      delete this._texturesInfo.color.infos[index];
    }
    this._colorLayers.length = 0;
    this._composer?.dispose();
    this._texturesInfo.color.atlasTexture?.dispose();
  }
  getColorTexture(layer) {
    const index = this.indexOfColorLayer(layer);
    if (index === -1) {
      return null;
    }
    return this._texturesInfo.color.infos[index].texture;
  }
  countIndividualTextures() {
    let totalTextureUnits = 0;
    if (this._elevationLayer) {
      totalTextureUnits++;
      if (this.defines.STITCHING) {
        // We use 8 neighbour textures for stit-ching
        totalTextureUnits += 8;
      }
    }
    if (this._colorMapAtlas) {
      totalTextureUnits++;
    }
    const visibleColorLayers = this.getVisibleColorLayerCount();
    // Count only visible color layers
    totalTextureUnits += visibleColorLayers;
    return {
      totalTextureUnits,
      visibleColorLayers
    };
  }
  onBeforeRender() {
    this.updateOpacityParameters(this.opacity);
    if (this.defines.USE_ATLAS_TEXTURE && this._needsAtlasRepaint) {
      this.repaintAtlas();
      this._needsAtlasRepaint = false;
    }
    this.updateColorWrite();
    this.updateColorLayerUniforms();
    this.updateColorMaps();
  }

  /**
   * Determine if this material should write to the color buffer.
   */
  updateColorWrite() {
    if (this._texturesInfo.elevation.texture == null && this.defines.DISCARD_NODATA_ELEVATION) {
      // No elevation texture means that every single fragment will be discarded,
      // which is an illegal operation in WebGL (raising warnings).
      this.colorWrite = false;
    } else {
      this.colorWrite = true;
    }
  }
  repaintAtlas() {
    this.rebuildAtlasIfNecessary();
    const composer = nonNull(this._composer);
    composer.clear();

    // Redraw all visible color layers on the canvas
    for (const l of this._colorLayers) {
      if (!l.visible) {
        continue;
      }
      const idx = this.indexOfColorLayer(l);
      const atlas = nonNull(this._atlasInfo.atlas)[l.id];
      const layerTexture = this._texturesInfo.color.infos[idx].texture;
      const w = layerTexture?.image?.width ?? EMPTY_IMAGE_SIZE;
      const h = layerTexture?.image?.height ?? EMPTY_IMAGE_SIZE;
      updateOffsetScale(new Vector2(w, h), atlas, this._texturesInfo.color.infos[idx].originalOffsetScale, this.composerWidth, this.composerHeight, this._texturesInfo.color.infos[idx].offsetScale);
      if (layerTexture != null) {
        drawImageOnAtlas(w, h, nonNull(composer), atlas, layerTexture);
      }
    }
    const rendered = composer.render();
    rendered.name = 'LayeredMaterial - Atlas';
    MemoryTracker.track(rendered, rendered.name);

    // Even though we asked the composer to reuse the same texture, sometimes it has
    // to recreate a new texture when some parameters change, such as pixel format.
    if (rendered.uuid !== this._texturesInfo.color.atlasTexture?.uuid) {
      this.rebuildAtlasTexture(rendered);
    }
    this.uniforms.atlasTexture.value = this._texturesInfo.color.atlasTexture;
  }
  setColorTextures(layer, textureAndPitch) {
    const index = this.indexOfColorLayer(layer);
    if (index < 0) {
      this.pushColorLayer(layer);
    }
    const {
      pitch,
      texture
    } = textureAndPitch;
    this._texturesInfo.color.infos[index].originalOffsetScale.copy(pitch);
    this._texturesInfo.color.infos[index].texture = texture;
    const currentSize = TextureGenerator.getBytesPerChannel(this._composerDataType);
    const textureSize = TextureGenerator.getBytesPerChannel(texture.type);
    if (textureSize > currentSize) {
      // The new layer uses a bigger data type, we need to recreate the atlas
      this._composerDataType = texture.type;
    }
    this._needsAtlasRepaint = true;
  }
  pushElevationLayer(layer) {
    this._elevationLayer = layer;
    this._hasElevationLayer = true;
  }
  removeElevationLayer() {
    this._elevationLayer = null;
    this.uniforms.elevationTexture.value = null;
    this._texturesInfo.elevation.texture = null;
    this._hasElevationLayer = false;
    MaterialUtils.setDefine(this, 'ELEVATION_LAYER', false);
  }
  setElevationTexture(layer, {
    texture,
    pitch
  }, isFinal) {
    this._elevationLayer = layer;
    MaterialUtils.setDefine(this, 'ELEVATION_LAYER', true);
    this.uniforms.elevationTexture.value = texture;
    this._texturesInfo.elevation.texture = texture;
    texture.isFinal = isFinal;
    this._texturesInfo.elevation.offsetScale.copy(pitch);
    const uniform = this.uniforms.elevationLayer.value;
    uniform.offsetScale = pitch;
    uniform.textureSize = new Vector2(texture.image.width, texture.image.height);
    uniform.color = new Vector4(1, 1, 1, 1);
    uniform.brightnessContrastSaturation = new Vector3(1, 1, 1);
    uniform.elevationRange = new Vector2();
    this.updateColorMaps();
    return Promise.resolve(true);
  }
  pushColorLayer(newLayer) {
    if (this._colorLayers.includes(newLayer)) {
      return;
    }
    this._colorLayers.push(newLayer);
    const info = new TextureInfo(newLayer);
    if (newLayer.type === 'MaskLayer') {
      MaterialUtils.setDefine(this, 'ENABLE_LAYER_MASKS', true);
    }

    // Optional feature: limit color layer display within an elevation range
    if (newLayer.elevationRange != null) {
      MaterialUtils.setDefine(this, 'ENABLE_ELEVATION_RANGE', true);
      const {
        min,
        max
      } = newLayer.elevationRange;
      info.elevationRange = new Vector2(min, max);
    }
    this._texturesInfo.color.infos.push(info);
    this.updateColorLayerCount();
    this.updateColorMaps();
    this.needsUpdate = true;
  }
  getVisibleColorLayerCount() {
    let result = 0;
    for (let i = 0; i < this._colorLayers.length; i++) {
      const layer = this._colorLayers[i];
      if (layer.visible) {
        result++;
      }
    }
    return result;
  }
  reorderLayers() {
    this._needsSorting = true;
  }
  sortLayersIfNecessary() {
    const idx = this._getIndexFn;
    if (this._needsSorting) {
      this._colorLayers.sort((a, b) => idx(a) - idx(b));
      this._texturesInfo.color.infos.sort((a, b) => idx(a.layer) - idx(b.layer));
      this._needsSorting = false;
    }
  }
  removeColorLayer(layer) {
    const index = this.indexOfColorLayer(layer);
    if (index === -1) {
      return;
    }
    // NOTE: we cannot dispose the texture here, because it might be cached for later.
    this._texturesInfo.color.infos.splice(index, 1);
    this._colorLayers.splice(index, 1);
    this.updateColorMaps();
    this.updateColorLayerCount();
  }

  /**
   * Sets the colormap atlas.
   *
   * @param atlas - The atlas.
   */
  setColorMapAtlas(atlas) {
    this._colorMapAtlas = atlas;
  }
  updateColorMaps() {
    this.sortLayersIfNecessary();
    const atlas = this._colorMapAtlas;
    const elevationColorMap = this._elevationLayer?.colorMap;
    const elevationUniform = this.uniforms.elevationColorMap;
    if (elevationColorMap?.active === true) {
      elevationUniform.value.mode = elevationColorMap?.mode ?? COLORMAP_DISABLED;
      elevationUniform.value.min = elevationColorMap?.min ?? 0;
      elevationUniform.value.max = elevationColorMap?.max ?? 0;
      elevationUniform.value.offset = atlas?.getOffset(elevationColorMap) ?? 0;
    } else {
      elevationUniform.value.mode = COLORMAP_DISABLED;
      elevationUniform.value.min = 0;
      elevationUniform.value.max = 0;
    }
    const colorLayers = this._texturesInfo.color.infos;
    const uniforms = [];
    for (let i = 0; i < colorLayers.length; i++) {
      const texInfo = colorLayers[i];
      if (!texInfo.layer.visible) {
        continue;
      }
      const colorMap = texInfo.layer.colorMap;
      const uniform = {
        mode: colorMap?.active === true ? colorMap.mode : COLORMAP_DISABLED,
        min: colorMap?.min ?? 0,
        max: colorMap?.max ?? 0,
        offset: colorMap ? atlas?.getOffset(colorMap) ?? 0 : 0
      };
      uniforms.push(uniform);
    }
    this.uniforms.layersColorMaps = new Uniform(uniforms);
    if (atlas?.texture) {
      const luts = atlas.texture ?? null;
      this.uniforms.colorMapAtlas.value = luts;
    }
  }
  update(materialOptions) {
    if (materialOptions) {
      this._options = materialOptions;
      this.depthTest = materialOptions.depthTest;
      if (this._colorMapAtlas) {
        this.updateColorMaps();
      }

      // Background
      const a = materialOptions.backgroundOpacity;
      const c = materialOptions.backgroundColor;
      const vec4 = new Vector4(c.r, c.g, c.b, a);
      this.uniforms.backgroundColor.value.copy(vec4);

      // Graticule
      const options = materialOptions.graticule;
      const enabled = options.enabled ?? false;
      MaterialUtils.setDefine(this, 'ENABLE_GRATICULE', enabled);
      if (enabled) {
        const uniform = this.uniforms.graticule.value;
        uniform.thickness = options.thickness;
        uniform.position.set(options.xOffset, options.yOffset, options.xStep, options.yStep);
        const rgb = getColor(options.color);
        uniform.color.set(rgb.r, rgb.g, rgb.b, options.opacity ?? 0);
      }

      // Colorimetry
      const opts = materialOptions.colorimetry;
      this.uniforms.brightnessContrastSaturation.value.set(opts.brightness, opts.contrast, opts.saturation);

      // Contour lines
      const contourLines = materialOptions.contourLines;
      if (contourLines.enabled) {
        const c = getColor(contourLines.color);
        const a = contourLines.opacity;
        this.uniforms.contourLines.value = {
          thickness: contourLines.thickness ?? 1,
          primaryInterval: contourLines.interval ?? 100,
          secondaryInterval: contourLines.secondaryInterval ?? 0,
          color: new Vector4(c.r, c.g, c.b, a)
        };
      }
      MaterialUtils.setDefine(this, 'ENABLE_CONTOUR_LINES', contourLines.enabled);
      if (materialOptions.elevationRange) {
        const {
          min,
          max
        } = materialOptions.elevationRange;
        this.uniforms.elevationRange.value.set(min, max);
      }
      MaterialUtils.setDefine(this, 'ELEVATION_LAYER', this._elevationLayer?.visible);
      MaterialUtils.setDefine(this, 'ENABLE_OUTLINES', materialOptions.showTileOutlines);
      if (materialOptions.showTileOutlines) {
        this.uniforms.tileOutlineColor.value = getColor(materialOptions.tileOutlineColor);
      }
      MaterialUtils.setDefine(this, 'DISCARD_NODATA_ELEVATION', materialOptions.discardNoData);
      MaterialUtils.setDefine(this, 'TERRAIN_DEFORMATION', materialOptions.terrain.enabled);
      MaterialUtils.setDefine(this, 'STITCHING', materialOptions.terrain.stitching);
      const hillshadingParams = materialOptions.hillshading;
      const uniform = this.uniforms.hillshading.value;
      uniform.zenith = hillshadingParams.zenith ?? DEFAULT_ZENITH;
      uniform.azimuth = hillshadingParams.azimuth ?? DEFAULT_AZIMUTH;
      uniform.intensity = hillshadingParams.intensity ?? 1;
      uniform.zFactor = hillshadingParams.zFactor ?? 1;
      MaterialUtils.setDefine(this, 'ENABLE_HILLSHADING', hillshadingParams.enabled);
      MaterialUtils.setDefine(this, 'APPLY_SHADING_ON_COLORLAYERS', !hillshadingParams.elevationLayersOnly);
      const newSide = materialOptions.side;
      if (this.side !== newSide) {
        this.side = newSide;
        this.needsUpdate = true;
      }
    }
    if (this._colorLayers.length === 0) {
      return true;
    }
    return this.rebuildAtlasIfNecessary();
  }
  updateColorLayerCount() {
    // If we have fewer textures than allowed by WebGL max texture units,
    // then we can directly use those textures in the shader.
    // Otherwise we have to reduce the number of color textures by aggregating
    // them in a texture atlas. Note that doing so will have a performance cost,
    // both increasing memory consumption and GPU time, since each color texture
    // must rendered into the atlas.
    const {
      totalTextureUnits,
      visibleColorLayers
    } = this.countIndividualTextures();
    const shouldUseAtlas = this._forceTextureAtlas || totalTextureUnits > this._maxTextureImageUnits;
    MaterialUtils.setDefine(this, 'USE_ATLAS_TEXTURE', shouldUseAtlas);

    // If the number of visible layers has changed, we need to repaint the
    // atlas because it only shows visible layers.
    if (MaterialUtils.setDefineValue(this, 'VISIBLE_COLOR_LAYER_COUNT', visibleColorLayers)) {
      this._mustUpdateUniforms = true;
      this._needsAtlasRepaint = true;
      this.needsUpdate = true;
    }
  }
  customProgramCacheKey() {
    return (this.defines.VISIBLE_COLOR_LAYER_COUNT ?? 0).toString();
  }
  createComposer() {
    const newComposer = new WebGLComposer({
      extent: new Rect(0, this._atlasInfo.maxX, 0, this._atlasInfo.maxY),
      width: this._atlasInfo.maxX,
      height: this._atlasInfo.maxY,
      reuseTexture: true,
      webGLRenderer: this._renderer,
      pixelFormat: RGBAFormat,
      textureDataType: this._composerDataType
    });
    return newComposer;
  }
  get composerWidth() {
    return this._composer?.width ?? 0;
  }
  get composerHeight() {
    return this._composer?.height ?? 0;
  }
  rebuildAtlasIfNecessary() {
    if (this._composer == null || this._atlasInfo.maxX > this.composerWidth || this._atlasInfo.maxY > this.composerHeight || this._composer.dataType !== this._composerDataType) {
      const newComposer = this.createComposer();
      let newTexture = null;
      const currentTexture = this._texturesInfo.color.atlasTexture;
      if (this._composer && currentTexture && this.composerWidth > 0) {
        // repaint the old canvas into the new one.
        newComposer.draw(currentTexture, new Rect(0, this.composerWidth, 0, this.composerHeight));
        newTexture = newComposer.render();
      }
      this._composer?.dispose();
      currentTexture?.dispose();
      this._composer = newComposer;
      const atlases = nonNull(this._atlasInfo.atlas);
      for (let i = 0; i < this._colorLayers.length; i++) {
        const layer = this._colorLayers[i];
        const atlas = atlases[layer.id];
        const pitch = this._texturesInfo.color.infos[i].originalOffsetScale;
        const texture = this._texturesInfo.color.infos[i].texture;

        // compute offset / scale
        const w = texture?.image?.width ?? EMPTY_IMAGE_SIZE;
        const h = texture?.image?.height ?? EMPTY_IMAGE_SIZE;
        const xRatio = w / this.composerWidth;
        const yRatio = h / this.composerHeight;
        this._texturesInfo.color.infos[i].offsetScale = new OffsetScale(atlas.x / this.composerWidth + pitch.x * xRatio, (atlas.y + nonNull(atlas.offset)) / this.composerHeight + pitch.y * yRatio, pitch.z * xRatio, pitch.w * yRatio);
      }
      this.rebuildAtlasTexture(newTexture);
    }
    return this.composerWidth > 0;
  }
  rebuildAtlasTexture(newTexture) {
    if (newTexture) {
      newTexture.name = 'LayeredMaterial - Atlas';
    }
    this._texturesInfo.color.atlasTexture?.dispose();
    this._texturesInfo.color.atlasTexture = newTexture;
    this.uniforms.atlasTexture.value = this._texturesInfo.color.atlasTexture;
  }
  changeState(state) {
    if (this.uniforms.renderingState.value === state) {
      return;
    }
    this.uniforms.renderingState.value = state;
    this.updateOpacityParameters(this.opacity);
    this.updateBlendingMode();
    this.needsUpdate = true;
  }
  updateBlendingMode() {
    const state = this.uniforms.renderingState.value;
    if (state === RenderingState.FINAL) {
      const background = this._options?.backgroundOpacity ?? 1;
      this.transparent = this.opacity < 1 || background < 1;
      this.needsUpdate = true;
      this.blending = NormalBlending;
    } else {
      // We cannot use alpha blending with custom rendering states because the alpha component
      // of the fragment in those modes has nothing to do with transparency at all.
      this.blending = NoBlending;
      this.transparent = false;
      this.needsUpdate = true;
    }
  }
  hasColorLayer(layer) {
    return this.indexOfColorLayer(layer) !== -1;
  }
  hasElevationLayer(layer) {
    return this._elevationLayer !== layer;
  }
  indexOfColorLayer(layer) {
    return this._colorLayers.indexOf(layer);
  }
  updateOpacityParameters(opacity) {
    this.uniforms.opacity.value = opacity;
    this.updateBlendingMode();
  }
  setLayerOpacity(layer, opacity) {
    const index = this.indexOfColorLayer(layer);
    this._texturesInfo.color.infos[index].opacity = opacity;
    this._mustUpdateUniforms = true;
  }
  setLayerVisibility(layer, visible) {
    const index = this.indexOfColorLayer(layer);
    this._texturesInfo.color.infos[index].visible = visible;
    this._mustUpdateUniforms = true;
    this.needsUpdate = true;
    this.reorderLayers();
    this.updateColorLayerCount();
  }
  setLayerElevationRange(layer, range) {
    if (range != null) {
      MaterialUtils.setDefine(this, 'ENABLE_ELEVATION_RANGE', true);
    }
    const index = this.indexOfColorLayer(layer);
    const value = range ? new Vector2(range.min, range.max) : DISABLED_ELEVATION_RANGE;
    this._texturesInfo.color.infos[index].elevationRange = value;
    this._mustUpdateUniforms = true;
  }
  setColorimetry(layer, brightness, contrast, saturation) {
    const index = this.indexOfColorLayer(layer);
    this._texturesInfo.color.infos[index].brightnessContrastSaturation.set(brightness, contrast, saturation);
  }
  canProcessColorLayer() {
    if (!this._elevationLayer) {
      return true;
    }
    if (!this._elevationLayer.visible) {
      return true;
    }
    return this.isElevationLayerTextureLoaded();
  }
  isElevationLayerTextureLoaded() {
    if (!this._hasElevationLayer) {
      return true;
    }
    const texture = this._texturesInfo.elevation.texture;
    return texture != null && texture.isFinal === true;
  }
  getElevationTexture() {
    return this._texturesInfo.elevation.texture;
  }
  getElevationOffsetScale() {
    return this._texturesInfo.elevation.offsetScale;
  }
  isColorLayerTextureLoaded(layer) {
    const index = this.indexOfColorLayer(layer);
    if (index < 0) {
      return false;
    }
    return this._texturesInfo.color.infos[index].texture !== emptyTexture;
  }

  /**
   * Gets the number of layers on this material.
   *
   * @returns The number of layers present on this material.
   */
  getLayerCount() {
    return (this._elevationLayer ? 1 : 0) + this._colorLayers.length;
  }

  /**
   * Gets the progress of the loading of textures on this material.
   * The progress is the number of currently present textures divided
   * by the number of expected textures.
   */
  get progress() {
    let total = 0;
    let weight = 0;
    if (this._elevationLayer != null) {
      if (this.isElevationLayerTextureLoaded()) {
        total += 1;
      }
      weight += 1;
    }
    for (const layer of this._colorLayers) {
      if (this.isColorLayerTextureLoaded(layer)) {
        total += 1;
      }
      weight += 1;
    }
    if (weight === 0) {
      // No layer present
      return 1;
    }
    return total / weight;
  }
  get loading() {
    return this.progress < 1;
  }
  setUuid(uuid) {
    this.uniforms.uuid.value = uuid;
  }
}
export default LayeredMaterial;