function parsePascalCase(text) {
  const result = [text[0].toUpperCase()];
  for (let i = 1; i < text.length; i++) {
    const char = text[i];
    if (char.toUpperCase() === char) {
      result.push(' ');
    }
    result.push(char.toLowerCase());
  }
  return result.join('');
}

/**
 * Base class for the panels in the inspector.
 */
class Panel {
  /** The controllers. */

  isClosed() {
    const isGuiClosed = gui => {
      return gui._closed;
    };
    let current = this.gui;
    while (current != null) {
      if (isGuiClosed(current)) {
        return true;
      } else {
        current = current.parent;
      }
    }
    return false;
  }

  /**
   * @param parentGui - The parent GUI.
   * @param instance - The Giro3D instance.
   * @param name - The name of the panel.
   */
  constructor(parentGui, instance, name) {
    this.gui = parentGui.addFolder(name);
    this.gui.close();
    this.instance = instance;
    this._controllers = [];
  }
  notify(source = undefined) {
    this.instance.notifyChange(source);
  }
  collapse() {
    this.gui.close();
  }

  /**
   * Adds a color controller to the panel.
   *
   * @param obj - The object.
   * @param prop - The name of the property.
   * @returns The created controller.
   */
  addColorController(obj, prop) {
    const controller = this.gui.addColor(obj, prop);
    this._controllers.push(controller);
    return controller;
  }

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
  addController(obj, prop, $1, max, step) {
    const controller = this.gui.add(obj, prop, $1, max, step);
    controller.name(parsePascalCase(prop));
    this._controllers.push(controller);
    return controller;
  }
  removeController(controller) {
    this._controllers.slice(this._controllers.indexOf(controller));
    controller.destroy();
    this.updateControllers();
  }

  /**
   * Updates all controllers in this panel with the observed values.
   * This is useful if the value changes from outside the GUI.
   *
   */
  updateControllers() {
    this.updateValues();
    this._controllers.forEach(c => c.updateDisplay());
  }

  /**
   * Updates the values of the controller sources.
   *
   */
  updateValues() {
    /** empty */
  }

  /**
   * Updates the panel. You may override this function if the panel has additional work to do.
   * However, {@link updateControllers} should still be called to ensure they are up to date.
   *
   */
  update() {
    if (!this.isClosed()) {
      this.updateControllers();
    }
  }

  /**
   * Removes this panel from its parent GUI.
   *
   */
  dispose() {
    this.gui.destroy();
  }
}
export default Panel;