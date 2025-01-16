import type GUI from 'lil-gui';
import type Instance from '../../core/Instance';
import Panel from '../Panel';
/**
 * Pushes the value in the array, removing old values in array length exceeds MAX_DATA_POINTS.
 *
 * @param array - The array
 * @param value - The value
 * @param limit - The limit of the array size, before trimming.
 */
export declare function pushTrim<T>(array: Array<T>, value: T, limit: number): void;
/**
 * Base class for all chart panels.
 */
declare abstract class ChartPanel extends Panel {
    ctx: HTMLCanvasElement;
    constructor(parentGui: GUI, instance: Instance, name: string);
}
export default ChartPanel;
//# sourceMappingURL=ChartPanel.d.ts.map