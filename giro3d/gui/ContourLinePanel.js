import Panel from './Panel';
class ContourLinePanel extends Panel {
  /**
   * @param options - The options.
   * @param parentGui - Parent GUI
   * @param instance - The instance
   */
  constructor(options, parentGui, instance) {
    super(parentGui, instance, 'Contour lines');
    this.addController(options, 'enabled').name('Enable').onChange(() => this.notify());
    this.addColorController(options, 'color').name('Color').onChange(() => this.notify());
    this.addController(options, 'thickness', 0, 4, 0.1).name('Thickness').onChange(() => this.notify());
    this.addController(options, 'opacity', 0, 1).name('Opacity').onChange(() => this.notify());
    this.addController(options, 'interval', 0, 3000, 1).name('Primary interval (m)').onChange(() => this.notify());
    this.addController(options, 'secondaryInterval', 0, 3000, 1).name('Secondary interval (m)').onChange(() => this.notify());
  }
}
export default ContourLinePanel;