import type { ChartData, ScatterDataPoint } from 'chart.js';
import { Chart } from 'chart.js';
import type GUI from 'lil-gui';
import type { WebGLInfo } from 'three';
import type Instance from '../../core/Instance';
import ChartPanel from './ChartPanel';
declare class PickingDuration extends ChartPanel {
    render: typeof WebGLInfo.prototype.render;
    data: ChartData<'bar', ScatterDataPoint[], string>;
    chart: Chart;
    updateStart: number;
    renderStart: number;
    frame: number;
    constructor(parentGui: GUI, instance: Instance);
    updateValues(): void;
}
export default PickingDuration;
//# sourceMappingURL=PickingDuration.d.ts.map