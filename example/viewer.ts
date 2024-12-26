import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PointCloudOctree, Potree } from '../src';
import { EDLRenderer } from '../src/viewer/EDLRenderer';

export class Viewer {
  private targetEl: HTMLElement | undefined;
  private renderer: WebGLRenderer;
  private edlRenderer: EDLRenderer | null;
  scene: Scene;
  camera: PerspectiveCamera;
  cameraControls: any;
  private potree_v1: Potree;


  private pointClouds: PointCloudOctree[];
  private prevTime: number | undefined;

  useEDL: boolean;
  edlStrength: number;
  edlOpacity: number;
  edlRadius: number;

  constructor() {
    this.edlStrength = 1.0;
    this.edlOpacity = 1.0;
    this.edlRadius = 1.4;
    this.useEDL = false;
    this.edlRenderer = null;
    this.scene = new Scene();
    this.pointClouds = [];
    this.renderer = new WebGLRenderer();

    this.prevTime = undefined;
    this.potree_v1 = new Potree('v1');

    this.pointClouds = [];
    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Инициализация camera

    this.loop = this.loop.bind(this);
  }

  setEDLEnabled(value: boolean) {
    this.useEDL = value;
    console.log(`EDL enabled: ${this.useEDL}`);
  }

  initialize(targetEl: HTMLElement): void {
    if (this.targetEl || !targetEl) {
      return;
    }

    this.targetEl = targetEl;
    targetEl.appendChild(this.renderer.domElement);
    this.cameraControls = new OrbitControls(this.camera, this.targetEl);

    this.edlRenderer = new EDLRenderer(this);
    console.log('EDLRenderer initialized');

    this.resize();
    window.addEventListener('resize', this.resize);

    requestAnimationFrame(this.loop);
  }

  load(fileName: string, baseUrl: string): Promise<PointCloudOctree> {
    return this.potree_v1.loadPointCloud(fileName, (url: string) => `${baseUrl}${url}`);
  }

  add(pco: PointCloudOctree): void {
    this.scene.add(pco);
    this.pointClouds.push(pco);
  }

  disposePointCloud(pointCloud: PointCloudOctree): void {
    this.scene.remove(pointCloud);
    pointCloud.dispose();
    this.pointClouds = this.pointClouds.filter(pco => pco !== pointCloud);
  }

  update(_: number): void {
    this.cameraControls.update();
    this.potree_v1.updatePointClouds(this.pointClouds, this.camera, this.renderer);

  }

  render(): void {
    if (this.useEDL && this.edlRenderer) {
      if (!this.pointClouds) {
        console.error('pointClouds is undefined');
        return;
      }
      console.log('Rendering with EDL');
      this.edlRenderer.render(this.edlStrength, this.edlRadius, this.edlOpacity, this.pointClouds);
    } else {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
  }

  loop = (time: number): void => {
    requestAnimationFrame(this.loop);

    const prevTime = this.prevTime;
    this.prevTime = time;
    if (prevTime === undefined) {
      return;
    }

    this.update(time - prevTime);
    this.render();
  };

  resize = () => {
    if (!this.targetEl) {
      return;
    }

    const { width, height } = this.targetEl.getBoundingClientRect();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
}
