import { BufferGeometry, DepthTexture, Float32BufferAttribute, FloatType, Matrix4, Mesh, NearestFilter, NormalBlending, OrthographicCamera, RGBAFormat, Scene, ShaderMaterial, Vector2, WebGLRenderTarget } from 'three';
import { isOrthographicCamera, isPerspectiveCamera } from '../utils/predicates';
/* babel-plugin-inline-import './shader/BasicVS.glsl' */
const BasicVS = "varying vec2 vUv;\n\nvoid main() {\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n";
/* babel-plugin-inline-import './shader/pointcloud/EDLPassOneFS.glsl' */
const EDLPassOneFS = "#include <packing>\nuniform sampler2D depthTexture;\nuniform vec2 resolution;\nuniform float strength;\nuniform float cameraNear;\nuniform float cameraFar;\n\nuniform int n;\nuniform int directions;\nuniform float radius;\n\nvarying vec2 vUv;\n\nfloat readDepth (float fragCoordZ) {\n    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);\n    return log2(viewZToOrthographicDepth(viewZ, cameraNear, cameraFar));\n}\n\n// inspiration from https://tel.archives-ouvertes.fr/tel-00438464/document and Potree\nvoid main() {\n    float fragCoordZ = texture2D(depthTexture, vUv).x;\n    if (fragCoordZ == 1.0) {\n        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        return;\n    }\n\n    float zp = readDepth(fragCoordZ);\n    float s = 0.0;\n\n    const int max_k = 16;\n    const int max_n = 4;\n\n    float step = 2.0 * 3.1415926 / float(directions);\n\n    for (int i = 0; i < max_k; i++) {\n        if (i == directions) {\n            // workaround for loop index cannot be compared with non-constant expression\n            break;\n        }\n\n        for (int j = 1; j <= max_n; j++) {\n            if (j > n) {\n                // workaround for loop index cannot be compared with non-constant expression\n                break;\n            }\n\n            float distance = radius * float(j);\n            float rad = float(i) * step;\n\n            vec2 offset = vec2(\n                cos(rad) * distance,\n                sin(rad) * distance) / resolution;\n\n            float fz = texture2D(depthTexture, vUv + offset).x;\n            float zq = readDepth(fz);\n\n            s += max(0.0, -(zq - zp) / distance);\n        }\n    }\n    s = s / float(directions) / float(n);\n\n    float A = 300.0 * strength;\n\n    s = exp(-s * A);\n\n    gl_FragColor = vec4(s, s, s, 1.0);\n}\n";
/* babel-plugin-inline-import './shader/pointcloud/EDLPassTwoFS.glsl' */
const EDLPassTwoFS = "uniform sampler2D depthTexture;\nuniform sampler2D textureColor;\nuniform sampler2D textureEDL;\n\nvarying vec2 vUv;\nuniform float opacity;\n\nvoid main() {\n    float edl = texture2D(textureEDL, vUv).r;\n    // edl is 0 => no neighbours, so disable EDL to avoid drawing a black\n    // circle around individual points\n    vec4 source = texture2D(textureColor, vUv);\n    if (edl == 0.0) {\n        gl_FragColor = vec4(source.rgb, source.a);\n    } else {\n        gl_FragColor = vec4(source.rgb * edl, source.a);\n    }\n    gl_FragDepth = texture2D(depthTexture, vUv).r;\n}\n";
/* babel-plugin-inline-import './shader/pointcloud/EDLPassZeroFS.glsl' */
const EDLPassZeroFS = "uniform sampler2D depthTexture;\n\nvarying vec2 vUv;\n\nvoid main() {\n    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n    gl_FragDepth = texture2D(depthTexture, vUv).r;\n}\n";
/* babel-plugin-inline-import './shader/pointcloud/InpaintingFS.glsl' */
const InpaintingFS = "uniform sampler2D depthTexture;\nuniform sampler2D colorTexture;\n\nvarying vec2 vUv;\n\nuniform float m43;\nuniform float m33;\nuniform vec2 resolution;\nuniform float depth_contrib;\nuniform float opacity;\n\nuniform bool enableZAttenuation;\nuniform float zAttMax;\nuniform float zAttMin;\n\nfloat zview(float depth) {\n    // http://www.derschmale.com/2014/01/26/reconstructing-positions-from-the-depth-buffer/\n    float zndc = 2.0 * depth - 1.0;\n    return - m43 / (zndc + m33);\n}\n\nvoid main() {\n    float depth = texture2D(depthTexture, vUv).x;\n    gl_FragDepth = depth;\n\n    // non empty pixel\n    if (depth < 1.0) {\n        gl_FragColor = texture2D(colorTexture, vUv);\n        return;\n    }\n\n    // empty pixel\n    {\n        float total_weight = 0.0;\n        vec4 averageColor = vec4(0.0, 0.0, 0.0, 0.0);\n        float averageDepth = 0.;\n        const int kernel = 3;\n        for (int i=-kernel; i<=kernel; i++) {\n            for (int j=-kernel; j<=kernel; j++) {\n                if (i == 0 && j == 0) continue;\n                vec2 uv = vUv + vec2(float(i) / resolution.x, float(j) / resolution.y);\n                float d = texture2D(depthTexture, uv).x;\n\n                if (d < 1.0) {\n                    if (enableZAttenuation) {\n                        float z = -zview(d);\n                        // attenuation according to distance\n                        float zAttenuation = clamp((zAttMax - z) / (zAttMax - zAttMin), 0.0, 1.0); // I wish smoothstep was supported...\n                        if (abs(float(i))+abs(float(j)) > (float(kernel) * 2.0 * zAttenuation)) {\n                            continue;\n                        }\n                    }\n                    float r_ij = sqrt(float(i*i + j*j));\n                    float weight_ij = (float(kernel) - r_ij * 1.0)\n                        * (1.0 - min(1.0, abs(d - depth) / depth_contrib));\n                    if (weight_ij > 0.0) {\n                        averageColor += weight_ij * texture2D(colorTexture, uv);\n                        averageDepth += weight_ij * d;\n                        total_weight += weight_ij;\n                    }\n                }\n            }\n        }\n\n        if (total_weight > 0.0) {\n            gl_FragColor = averageColor / total_weight;\n            gl_FragDepth = averageDepth / total_weight;\n        } else {\n            gl_FragColor.a = 0.0;\n            discard;\n        }\n    }\n}\n";
/* babel-plugin-inline-import './shader/pointcloud/OcclusionFS.glsl' */
const OcclusionFS = "uniform sampler2D depthTexture;\nuniform sampler2D colorTexture;\n\nvarying vec2 vUv;\n\nuniform float m43;\nuniform float m33;\nuniform vec2 resolution;\nuniform mat4 invPersMatrix;\n\nuniform float threshold;\nuniform bool showRemoved;\n\nvec3 unproject (vec2 ptex, float d)\n{\n    vec2 pndc = ptex * 2.0 - 1.0;\n    vec3 pray = (invPersMatrix * vec4(pndc, 1.0, 1.0)).xyz;\n    return d * pray;\n}\n\n\nfloat zView(float depth) {\n    // http://www.derschmale.com/2014/01/26/reconstructing-positions-from-the-depth-buffer/\n    float zndc = 2.0 * depth - 1.0;\n    return - m43 / (zndc + m33);\n}\n\nvoid main() {\n   float depth = texture2D(depthTexture, vUv).x;\n\n    if (depth < 1.0) {\n        float sectors[8];\n        for (int i=0; i<8; i++) {\n            sectors[i] = -1.0;\n        }\n\n        vec3 p0 = unproject(gl_FragCoord.xy / resolution, -zView(depth));\n        vec3 v = -normalize(p0);\n\n        const int kernelSize = 7;\n        for (int i=-kernelSize; i<=kernelSize; i++) {\n            for (int j=-kernelSize; j<=kernelSize; j++) {\n                if (i == 0 && j == 0) {\n                    continue;\n                }\n                float d = texture2D(\n                    depthTexture,\n                    vUv + vec2(float(i) / resolution.x, float(j) / resolution.y)).x;\n\n                if (d == 1.0) {\n                    continue;\n                }\n\n                vec2 coord = (gl_FragCoord.xy + vec2(i, j)) / resolution;\n                vec3 pij = unproject(coord, - zView(d));\n                vec3 c = normalize(pij - p0);\n                float test = dot(v, c);\n\n                if (i >= 0) {\n                    if(abs(float(j)) <= abs(float(i))) {\n                        if (j >= 0) {\n                            sectors[0] = max(sectors[0], test);\n                        }\n                        if (j <= 0) {\n                            sectors[7] = max(sectors[7], test);\n                        }\n                    }\n                    if(abs(float(j)) >= abs(float(i))) {\n                        if (j >= 0) {\n                            sectors[1] = max(sectors[1], test);\n                        }\n                        if (j <= 0) {\n                            sectors[6] = max(sectors[6], test);\n                        }\n                    }\n                }\n                if (i <= 0) {\n                    if(abs(float(j)) <= abs(float(i))) {\n                        if (j >= 0) {\n                            sectors[3] = max(sectors[3], test);\n                        }\n                        if (j <= 0) {\n                            sectors[4] = max(sectors[4], test);\n                        }\n                    }\n                    if(abs(float(j)) >= abs(float(i))) {\n                        if (j >= 0) {\n                            sectors[2] = max(sectors[2], test);\n                        }\n                        if (j <= 0) {\n                            sectors[5] = max(sectors[5], test);\n                        }\n                    }\n                }\n            }\n        }\n\n        float m = 0.0;\n        for (int i=0; i< 8 ;i++) {\n            m += (1.0 + sectors[i]) * 0.5;\n        }\n        m /= 8.0;\n\n        if (m < threshold) {\n            gl_FragColor = texture2D(colorTexture, vUv);\n            gl_FragDepth = depth;\n        } else if (showRemoved) {\n            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n            gl_FragDepth = 1.0;\n        } else {\n            gl_FragColor.a = 0.0;\n            gl_FragDepth = 1.0;\n        }\n    } else {\n        gl_FragColor.a = 0.0;\n        gl_FragDepth = 1.0;\n    }\n}\n";
const RT = {
  FULL_RES_0: 0,
  FULL_RES_1: 1,
  EDL_VALUES: 2,
  EDL_ZERO: 3
};
/**
 * A post-processing renderer that adds effects to point clouds.
 */
class PointCloudRenderer {
  /**
   * Creates a point cloud renderer.
   *
   * @param webGLRenderer - The WebGL renderer.
   */
  constructor(webGLRenderer) {
    this.scene = new Scene();

    // create 1 big triangle covering the screen
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute([0, 0, -3, 2, 0, -3, 0, 2, -3], 3));
    geom.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    // @ts-expect-error material is assigned later in the pipeline
    this.mesh = new Mesh(geom, null);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    // our camera
    this.camera = new OrthographicCamera(0, 1, 1, 0, 0, 10);
    this.classic = {
      // FIXME
      // @ts-expect-error undefined is not allowed
      passes: [undefined],
      parameters: null,
      enabled: true,
      setup() {
        return {
          material: undefined
        };
      }
    };

    // E(ye)D(ome)L(ighting) setup
    // References:
    //    - https://tel.archives-ouvertes.fr/tel-00438464/document
    //    - Potree (https://github.com/potree/potree/)
    this.edl = {
      passes: [new ShaderMaterial({
        uniforms: {
          depthTexture: {
            value: null
          }
        },
        transparent: true,
        blending: NormalBlending,
        vertexShader: BasicVS,
        fragmentShader: EDLPassZeroFS
      }),
      // EDL 1st pass material
      // This pass is writing a single value per pixel, describing the depth
      // difference between one pixel and its neighbours.
      new ShaderMaterial({
        uniforms: {
          depthTexture: {
            value: null
          },
          resolution: {
            value: new Vector2(256, 256)
          },
          cameraNear: {
            value: 0.01
          },
          cameraFar: {
            value: 100
          },
          radius: {
            value: 0
          },
          strength: {
            value: 0
          },
          directions: {
            value: 0
          },
          n: {
            value: 0
          },
          opacity: {
            value: 1.0
          }
        },
        transparent: true,
        blending: NormalBlending,
        vertexShader: BasicVS,
        fragmentShader: EDLPassOneFS
      }),
      // EDL 2nd pass material
      // This pass combines the EDL value computed in pass 1 with pixels
      // colors from a normal rendering to compose the final pixel color
      new ShaderMaterial({
        uniforms: {
          depthTexture: {
            value: null
          },
          textureColor: {
            value: null
          },
          textureEDL: {
            value: null
          },
          opacity: {
            value: 1.0
          }
        },
        transparent: true,
        blending: NormalBlending,
        vertexShader: BasicVS,
        fragmentShader: EDLPassTwoFS
      })],
      enabled: true,
      // EDL tuning
      parameters: {
        radius: 1.5,
        strength: 0.7,
        directions: 8,
        n: 1
      },
      setup({
        targets,
        input,
        passIdx,
        camera
      }) {
        const m = this.passes[passIdx];
        const uniforms = m.uniforms;
        if (passIdx === 0) {
          // scale down depth texture
          uniforms.depthTexture.value = input.depthTexture;
          return {
            material: m,
            output: targets[RT.EDL_ZERO]
          };
        }
        if (passIdx === 1) {
          uniforms.depthTexture.value = targets[RT.EDL_ZERO].depthTexture;
          uniforms.resolution.value.set(input.width, input.height);
          uniforms.cameraNear.value = camera.near;
          uniforms.cameraFar.value = camera.far;
          uniforms.radius.value = this.parameters.radius;
          uniforms.strength.value = this.parameters.strength;
          uniforms.directions.value = this.parameters.directions;
          uniforms.n.value = this.parameters.n;
          return {
            material: m,
            output: targets[RT.EDL_VALUES]
          };
        }
        uniforms.textureColor.value = input.texture;
        uniforms.textureEDL.value = targets[RT.EDL_VALUES].texture;
        uniforms.depthTexture.value = input.depthTexture;
        return {
          material: m
        };
      }
    };

    // Screen-space occlusion
    // References: http://www.crs4.it/vic/data/papers/vast2011-pbr.pdf
    this.occlusion = {
      passes: [
      // EDL 1st pass material
      // This pass is writing a single value per pixel, describing the depth
      // difference between one pixel and its neighbours.
      new ShaderMaterial({
        uniforms: {
          depthTexture: {
            value: null
          },
          colorTexture: {
            value: null
          },
          m43: {
            value: 0
          },
          m33: {
            value: 0
          },
          resolution: {
            value: new Vector2(256, 256)
          },
          invPersMatrix: {
            value: new Matrix4()
          },
          threshold: {
            value: 0
          },
          showRemoved: {
            value: false
          }
        },
        transparent: true,
        blending: NormalBlending,
        vertexShader: BasicVS,
        fragmentShader: OcclusionFS
      })],
      enabled: true,
      // EDL tuning
      parameters: {
        threshold: 0.9,
        showRemoved: false
      },
      setup({
        input,
        camera
      }) {
        const m = this.passes[0];
        const n = camera.near;
        const f = camera.far;
        const mat = new Matrix4();
        mat.copy(camera.projectionMatrix).invert();
        const mU = m.uniforms;
        mU.colorTexture.value = input.texture;
        mU.depthTexture.value = input.depthTexture;
        mU.resolution.value.set(input.width, input.height);
        mU.m43.value = -(2 * f * n) / (f - n);
        mU.m33.value = -(f + n) / (f - n);
        mU.threshold.value = this.parameters.threshold;
        mU.showRemoved.value = this.parameters.showRemoved;
        mU.invPersMatrix.value.copy(camera.projectionMatrix).invert();
        return {
          material: m
        };
      }
    };

    // Screen-space filling
    // References: http://www.crs4.it/vic/data/papers/vast2011-pbr.pdf
    this.inpainting = {
      passes: [
      // Inpainting material
      new ShaderMaterial({
        uniforms: {
          depthTexture: {
            value: null
          },
          colorTexture: {
            value: null
          },
          resolution: {
            value: new Vector2(256, 256)
          },
          depth_contrib: {
            value: 0.5
          },
          opacity: {
            value: 1.0
          },
          m43: {
            value: 0
          },
          m33: {
            value: 0
          },
          enableZAttenuation: {
            value: false
          },
          zAttMax: {
            value: 0
          },
          zAttMin: {
            value: 0
          }
        },
        transparent: true,
        blending: NormalBlending,
        vertexShader: BasicVS,
        fragmentShader: InpaintingFS
      })],
      enabled: true,
      // EDL tuning
      parameters: {
        fill_steps: 2,
        depth_contrib: 0.5,
        enableZAttenuation: false,
        zAttMin: 10,
        zAttMax: 100
      },
      setup({
        input,
        camera
      }) {
        const m = this.passes[0];
        const n = camera.near;
        const f = camera.far;
        m.uniforms.m43.value = -(2 * f * n) / (f - n);
        m.uniforms.m33.value = -(f + n) / (f - n);
        m.uniforms.colorTexture.value = input.texture;
        m.uniforms.depthTexture.value = input.depthTexture;
        m.uniforms.resolution.value.set(input.width, input.height);
        m.uniforms.depth_contrib.value = this.parameters.depth_contrib;
        m.uniforms.enableZAttenuation.value = this.parameters.enableZAttenuation;
        m.uniforms.zAttMin.value = this.parameters.zAttMin;
        m.uniforms.zAttMax.value = this.parameters.zAttMax;
        return {
          material: m
        };
      }
    };
    this.renderer = webGLRenderer;
    this.renderTargets = null;
  }
  updateRenderTargets(renderTarget) {
    if (!this.renderTargets || renderTarget.width !== this.renderTargets[RT.FULL_RES_0].width || renderTarget.height !== this.renderTargets[RT.FULL_RES_0].height) {
      if (this.renderTargets) {
        // release old render targets
        this.renderTargets.forEach(rt => rt.dispose());
      }
      // build new ones
      this.renderTargets = this.createRenderTargets(renderTarget.width, renderTarget.height);
    }
    return this.renderTargets;
  }
  createRenderTarget(width, height, depthBuffer) {
    return new WebGLRenderTarget(width, height, {
      format: RGBAFormat,
      depthBuffer,
      stencilBuffer: true,
      generateMipmaps: false,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthTexture: depthBuffer ? new DepthTexture(width, height, FloatType) : undefined
    });
  }
  createRenderTargets(width, height) {
    const renderTargets = [];
    renderTargets.push(this.createRenderTarget(width, height, true));
    renderTargets.push(this.createRenderTarget(width, height, true));
    renderTargets.push(this.createRenderTarget(width, height, false));
    renderTargets.push(this.createRenderTarget(width, height, true));
    return renderTargets;
  }
  render(scene, camera, renderTarget) {
    const targets = this.updateRenderTargets(renderTarget);
    if (!isPerspectiveCamera(camera) && !isOrthographicCamera(camera)) {
      throw new Error('invalid camera');
    }
    const r = this.renderer;
    const stages = [];
    stages.push(this.classic);

    // EDL requires far & near properties on Camera, which may not exist
    const cameraHasFarNear = 'far' in camera && 'near' in camera;
    if (this.occlusion.enabled && cameraHasFarNear) {
      stages.push(this.occlusion);
    }
    if (this.inpainting.enabled && cameraHasFarNear) {
      const fill_steps = this.inpainting.parameters.fill_steps;
      for (let i = 0; i < fill_steps; i++) {
        stages.push(this.inpainting);
      }
    }
    if (this.edl.enabled && cameraHasFarNear) {
      stages.push(this.edl);
    }
    const oldClearAlpha = r.getClearAlpha();
    r.setClearAlpha(0.0);
    let previousStageOutput = RT.FULL_RES_0;
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      // ping-pong between FULL_RES_0 and FULL_RES_1, unless overriden by stage
      const stageOutput = (previousStageOutput + 1) % 2;
      for (let j = 0; j < stage.passes.length; j++) {
        // prepare stage
        // eslint-disable-next-line prefer-const
        let {
          material,
          output
        } = stage.setup({
          targets,
          input: targets[previousStageOutput],
          passIdx: j,
          camera
        });

        // if last stage -> override output (draw to screen)
        if (i === stages.length - 1 && j === stage.passes.length - 1) {
          output = renderTarget ?? null;
        } else if (!output) {
          output = targets[stageOutput];
        }

        // render stage
        r.setRenderTarget(output);

        // We don't want to clear the final render target
        // because it would erase whatever was rendered previously
        // (i.e opaque non-point cloud meshes)
        if (output !== renderTarget) {
          r.clear();
        }
        r.setViewport(0, 0,
        // @ts-expect-error camera.width is not defined ? // FIXME
        output != null ? output.width : camera.width,
        // @ts-expect-error camera.height is not defined ? // FIXME
        output != null ? output.height : camera.height);
        if (material) {
          // postprocessing scene
          this.mesh.material = material;
          r.render(this.scene, this.camera);
        } else {
          r.render(scene, camera);
        }
      }
      previousStageOutput = stageOutput;
    }
    r.setClearAlpha(oldClearAlpha);
  }
  dispose() {
    if (this.renderTargets) {
      this.renderTargets.forEach(t => t.dispose());
      this.renderTargets.length = 0;
    }
  }
}
export default PointCloudRenderer;