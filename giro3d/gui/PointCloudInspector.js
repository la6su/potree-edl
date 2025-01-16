import ColorMapInspector from './ColorMapInspector';
import EntityInspector from './EntityInspector';
import PointCloudSourceInspector from './PointCloudSourceInspector';
export default class PointCloudInspector extends EntityInspector {
  colorMapInspector = null;
  sourceInspector = null;
  get pointBudget() {
    return this.entity.pointBudget ?? -1;
  }
  set pointBudget(v) {
    if (v === -1) {
      this.entity.pointBudget = null;
    } else {
      this.entity.pointBudget = v;
    }
  }
  constructor(parent, instance, entity) {
    super(parent, instance, entity, {
      visibility: true,
      opacity: true,
      boundingBoxes: false,
      boundingBoxColor: false
    });
    if (entity.ready) {
      this.populate(entity);
    } else {
      entity.addEventListener('initialized', () => this.populate(entity));
    }
  }
  populate(entity) {
    this.addController(entity, 'showPoints');
    this.addController(entity, 'showVolume');
    this.addController(entity, 'cleanupDelay');
    this.addController(entity, 'depthTest');
    this.addController(entity, 'showNodeVolumes');
    this.addController(entity, 'decimation').min(1).max(100).step(1);
    this.addController(this, 'pointBudget');
    this.addController(entity, 'showNodeDataVolumes');
    if (entity.pointCount != null) {
      this.addController(entity, 'pointCount');
    }
    this.addController(entity, 'displayedPointCount');
    this.addController(entity, 'subdivisionThreshold').min(0.1).max(5).step(0.1);
    this.addController(entity, 'pointSize').min(0).max(50).step(1);
    this.addController(entity, 'clear');
    this.colorMapInspector = new ColorMapInspector(this.gui, this.instance, () => entity.colorMap, () => this.notify(entity));
    this.sourceInspector = new PointCloudSourceInspector(this.gui, this.instance, entity.source);
  }
  updateControllers() {
    if (!this.entity.ready) {
      return;
    }
    super.updateControllers();
    this.sourceInspector?.updateControllers();
    this.colorMapInspector?.updateControllers();
  }
}