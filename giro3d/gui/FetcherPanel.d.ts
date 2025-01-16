import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import Panel from './Panel';
declare class FetcherPanel extends Panel {
    pendingRequests: number;
    runningRequests: number;
    completedRequests: number;
    constructor(parentGui: GUI, instance: Instance);
    updateValues(): void;
}
export default FetcherPanel;
//# sourceMappingURL=FetcherPanel.d.ts.map