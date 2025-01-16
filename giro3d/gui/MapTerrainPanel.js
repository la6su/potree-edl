import { MathUtils } from 'three';
import Panel from './Panel';
class MapTerrainPanel extends Panel {
  segments = 32;

  /**
   * @param map - The map.
   * @param parentGui - Parent GUI
   * @param instance - The instance
   */
  constructor(map, parentGui, instance) {
    super(parentGui, instance, 'Terrain');
    this.map = map;
    this.segments = map.segments;
    this.addController(this.map.terrain, 'enabled').name('Deformation').onChange(() => this.notify(map));
    this.addController(this.map, 'wireframe').name('Wireframe').onChange(() => this.notify());
    this.addController(this, 'segments').name('Tile subdivisions').min(2).max(128).onChange(v => this.updateSegments(v));
    this.addController(this.map, 'showColliderMeshes').name('Show collider meshes').onChange(() => this.notify());
    this.addController(this.map.terrain, 'enableCPUTerrain').name('CPU terrain');
    this.addController(this.map.terrain, 'stitching').name('Stitching').onChange(() => this.notify(map));
    this.addController(this.map.geometryPool, 'size').name('Geometry pool');
  }
  updateSegments(v) {
    const val = MathUtils.floorPowerOfTwo(v);
    this.map.segments = val;
    this.segments = val;
    if (this.map.segments !== val) {
      this.map.segments = val;
      this.notify(this.map);
    }
  }
}
export default MapTerrainPanel;