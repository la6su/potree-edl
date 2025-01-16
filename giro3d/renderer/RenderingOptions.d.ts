/**
 * Exposes rendering options for the current Giro3D instance.
 *
 */
declare class RenderingOptions {
    /**
     * Enables EDL (Eye Dome Lighting) effect for point clouds.
     *
     * @defaultValue false
     */
    enableEDL: boolean;
    /**
     * The intensity of the EDL effect.
     *
     * @defaultValue 0.7
     */
    EDLStrength: number;
    /**
     * The radius of the EDL effect.
     *
     * @defaultValue 1.5
     */
    EDLRadius: number;
    /**
     * Enables inpainting (hole filling) effect for point clouds.
     *
     * @defaultValue false
     */
    enableInpainting: boolean;
    /**
     * The number of inpainting steps.
     *
     * @defaultValue 2
     */
    inpaintingSteps: number;
    /**
     * How much the difference of depth between two pixels contribute to the inpainting weight.
     *
     * @defaultValue 0.5
     */
    inpaintingDepthContribution: number;
    /**
     * Enables point cloud occlusion effect.
     *
     * @defaultValue false
     */
    enablePointCloudOcclusion: boolean;
    /**
     * Enables Multisampling Antialiasing (MSAA) on post-processing.
     * @defaultValue true
     */
    enableMSAA: boolean;
    constructor();
}
export default RenderingOptions;
//# sourceMappingURL=RenderingOptions.d.ts.map