import type GUI from 'lil-gui';
import type ColorimetryOptions from '../core/ColorimetryOptions';
import type Instance from '../core/Instance';
import Panel from './Panel';
declare class ColorimetryPanel extends Panel {
    private readonly _options;
    /**
     * @param options - The options.
     * @param parentGui - Parent GUI
     * @param instance - The instance
     */
    constructor(options: ColorimetryOptions, parentGui: GUI, instance: Instance);
    reset(): void;
}
export default ColorimetryPanel;
//# sourceMappingURL=ColorimetryPanel.d.ts.map