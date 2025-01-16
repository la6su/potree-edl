import GUI from 'lil-gui';
import type Instance from '../core/Instance';
import type Panel from './Panel';
export interface InspectorOptions {
    /**
     * The panel width, in pixels.
     *
     * @defaultValue 450
     */
    width?: number;
    /**
     * The title of the inspector.
     *
     * @defaultValue Inspector
     */
    title?: string;
}
/**
 * Provides a user interface to inspect and edit the Giro3D scene.
 * The inspector is made of several {@link Panel}.
 * You can implement custom panels and add them to the inspector with
 * {@link Inspector.addPanel}.
 *
 */
declare class Inspector {
    instance: Instance;
    gui: GUI;
    folders: Panel[];
    /**
     * Creates an instance of the inspector.
     *
     * @param parent - The HTML element to attach the panel to, or the `id` of this element.
     * @param instance - The Giro3D instance.
     * @param options - The options.
     */
    constructor(parent: HTMLElement | string, instance: Instance, options?: InspectorOptions);
    collapse(): void;
    /**
     * Removes all panel from the inspector.
     *
     */
    clearPanels(): void;
    /**
     * Adds a panel to the inspector.
     *
     * @param panel - The panel to add.
     */
    addPanel(panel: Panel): void;
    /**
     * Attaches the inspector to the specified DOM element.
     *
     * @param parent - The element to attach the panel to, or the `id` to the element.
     * @param instance - The Giro3D instance.
     * @param options - The options.
     * @returns The created inspector.
     */
    static attach(parent: HTMLElement | string, instance: Instance, options?: InspectorOptions): Inspector;
    /**
     * Detach this Inspector from its instance.
     *
     */
    detach(): void;
    update(): void;
}
export default Inspector;
//# sourceMappingURL=Inspector.d.ts.map