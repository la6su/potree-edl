import type { ChartData, ChartDataset, ScatterDataPoint } from 'chart.js';
import { Chart } from 'chart.js';
import type GUI from 'lil-gui';
import type { WebGLInfo } from 'three';
import type Instance from '../../core/Instance';
import ChartPanel from './ChartPanel';
declare class MemoryUsage extends ChartPanel {
    render: typeof WebGLInfo.prototype.render;
    memory: typeof WebGLInfo.prototype.memory;
    labels: string[];
    textures: ChartDataset<'line', ScatterDataPoint[]>;
    geometries: ChartDataset<'line', ScatterDataPoint[]>;
    renderTargets: ChartDataset<'line', ScatterDataPoint[]>;
    programs: ChartDataset<'line', ScatterDataPoint[]>;
    data: ChartData<'line', ScatterDataPoint[], string>;
    private _onRenderTargetPoolCleanup;
    chart: Chart;
    /**
     * Creates an instance of MemoryUsage.
     *
     * @param parentGui - The parent GUI.
     * @param instance - The giro3D instance.
     */
    constructor(parentGui: GUI, instance: Instance);
    dispose(): void;
    updateValues(): void;
}
export default MemoryUsage;
//# sourceMappingURL=MemoryUsage.d.ts.map