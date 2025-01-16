/**
 * Exposes rendering options for the current Giro3D instance.
 *
 */
class RenderingOptions {
  /**
   * Enables EDL (Eye Dome Lighting) effect for point clouds.
   *
   * @defaultValue false
   */

  /**
   * The intensity of the EDL effect.
   *
   * @defaultValue 0.7
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention

  /**
   * The radius of the EDL effect.
   *
   * @defaultValue 1.5
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EDLRadius = 1.5;
  /**
   * Enables inpainting (hole filling) effect for point clouds.
   *
   * @defaultValue false
   */
  enableInpainting = false;
  /**
   * The number of inpainting steps.
   *
   * @defaultValue 2
   */

  /**
   * How much the difference of depth between two pixels contribute to the inpainting weight.
   *
   * @defaultValue 0.5
   */

  /**
   * Enables point cloud occlusion effect.
   *
   * @defaultValue false
   */

  /**
   * Enables Multisampling Antialiasing (MSAA) on post-processing.
   * @defaultValue true
   */

  constructor() {
    this.enableEDL = false;
    this.EDLStrength = 0.7;
    this.EDLRadius = 1.5;
    this.enableInpainting = false;
    this.inpaintingSteps = 2;
    this.inpaintingDepthContribution = 0.5;
    this.enablePointCloudOcclusion = false;
    this.enableMSAA = true;
  }
}
export default RenderingOptions;