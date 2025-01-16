import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import type PointCloud from '../entities/PointCloud';
import ColorMapInspector from './ColorMapInspector';
import EntityInspector from './EntityInspector';
import PointCloudSourceInspector from './PointCloudSourceInspector';
export default class PointCloudInspector extends EntityInspector<PointCloud> {
    colorMapInspector: ColorMapInspector | null;
    sourceInspector: PointCloudSourceInspector | null;
    get pointBudget(): number;
    set pointBudget(v: number);
    constructor(parent: GUI, instance: Instance, entity: PointCloud);
    private populate;
    updateControllers(): void;
}
//# sourceMappingURL=PointCloudInspector.d.ts.map