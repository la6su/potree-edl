import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import Panel from './Panel';
declare class CachePanel extends Panel {
    count: string;
    size: string;
    ttl: number;
    capacityMb: number;
    capacityEntries: number;
    constructor(parentGui: GUI, instance: Instance);
    purge(): void;
    dump(): void;
    clear(): void;
    updateValues(): void;
}
export default CachePanel;
//# sourceMappingURL=CachePanel.d.ts.map