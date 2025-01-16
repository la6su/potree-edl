import type { ChartData, ChartDataset, ScatterDataPoint } from 'chart.js';
import { Chart } from 'chart.js';
import type GUI from 'lil-gui';
import type Instance from '../../core/Instance';
import type RequestQueue from '../../core/RequestQueue';
import ChartPanel from './ChartPanel';
declare class RequestQueueChart extends ChartPanel {
    labels: string[];
    queue: RequestQueue;
    currentRequests: ChartDataset<'line', ScatterDataPoint[]>;
    pendingRequests: ChartDataset<'line', ScatterDataPoint[]>;
    data: ChartData<'line', ScatterDataPoint[], string>;
    chart: Chart;
    /**
     * Creates an instance of RequestQueueChart.
     *
     * @param parentGui - The parent GUI.
     * @param instance - The giro3D instance.
     */
    constructor(parentGui: GUI, instance: Instance);
    updateValues(): void;
}
export default RequestQueueChart;
//# sourceMappingURL=RequestQueueChart.d.ts.map