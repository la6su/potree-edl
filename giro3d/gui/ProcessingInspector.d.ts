import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import Panel from './Panel';
declare class ProcessingInspector extends Panel {
    charts: Panel[];
    /**
     * @param gui - The GUI.
     * @param instance - The Giro3D instance.
     */
    constructor(gui: GUI, instance: Instance);
    dumpTrackedObjects(): void;
    dumpTrackedTextures(): void;
    updateValues(): void;
}
export default ProcessingInspector;
//# sourceMappingURL=ProcessingInspector.d.ts.map