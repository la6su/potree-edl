import { PointCloudOctree } from 'point-cloud-octree';
// import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

  export class EDLRenderer {
    constructor(viewer: any);
    render(
      edlStrength: number,
      edlRadius: number,
      edlOpacity: number,
      pointClouds: PointCloudOctree[]
    ): void;
  }
