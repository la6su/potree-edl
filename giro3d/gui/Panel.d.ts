import type GUI from 'lil-gui';
import type { Controller } from 'lil-gui';
import type Instance from '../core/Instance';
export interface TypedController<T> extends Controller {
    initialValue: T | undefined;
    onChange: (callback: (value: T) => void) => this;
    onFinishChange: (callback: (value: T) => void) => this;
    getValue: () => T;
    setValue: (value: T) => this;
}
/**
 * Base class for the panels in the inspector.
 */
declare abstract class Panel {
    gui: GUI;
    instance: Instance;
    /** The controllers. */
    protected _controllers: Controller[];
    isClosed(): boolean;
    /**
     * @param parentGui - The parent GUI.
     * @param instance - The Giro3D instance.
     * @param name - The name of the panel.
     */
    constructor(parentGui: GUI, instance: Instance, name: string);
    notify(source?: unknown): void;
    collapse(): void;
    /**
     * Adds a color controller to the panel.
     *
     * @param obj - The object.
     * @param prop - The name of the property.
     * @returns The created controller.
     */
    addColorController<T extends object, K extends keyof T & string>(obj: T, prop: K): TypedController<T[K]>;
    /**
     * Adds a (non-color) controller to the panel.
     * See [the lil-gui API](https://lil-gui.georgealways.com/#GUI#add) for more information.
     *
     * @param obj - The object.
     * @param prop - The name of the property.
     * @param $1 - Minimum value for number controllers,
     * or the set of selectable values for a dropdown.
     * @param max - Maximum value for number controllers.
     * @param step - Step value for number controllers.
     * @returns The created controller.
     */
    addController<T extends object, K extends keyof T & string>(obj: T, prop: K, $1?: object | number | unknown[], max?: number, step?: number): TypedController<T[K]>;
    removeController(controller: Controller): void;
    /**
     * Updates all controllers in this panel with the observed values.
     * This is useful if the value changes from outside the GUI.
     *
     */
    updateControllers(): void;
    /**
     * Updates the values of the controller sources.
     *
     */
    updateValues(): void;
    /**
     * Updates the panel. You may override this function if the panel has additional work to do.
     * However, {@link updateControllers} should still be called to ensure they are up to date.
     *
     */
    update(): void;
    /**
     * Removes this panel from its parent GUI.
     *
     */
    dispose(): void;
}
export default Panel;
//# sourceMappingURL=Panel.d.ts.map