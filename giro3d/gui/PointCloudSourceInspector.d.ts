import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import type { PointCloudSource } from '../sources/PointCloudSource';
import Panel from './Panel';
export default class PointCloudSourceInspector extends Panel {
    readonly source: PointCloudSource;
    readonly memoryUsage: {
        cpuMemory: string;
        gpuMemory: string;
    };
    constructor(parent: GUI, instance: Instance, source: PointCloudSource);
    private populate;
    updateValues(): void;
}
//# sourceMappingURL=PointCloudSourceInspector.d.ts.map