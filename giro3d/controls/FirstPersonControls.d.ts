import type Instance from '../core/Instance';
import { type InstanceEvents } from '../core/Instance';
export interface FirstPersonControlsOptions {
    focusOnClick: boolean;
    /** whether or not to focus when the mouse is over the domElement */
    focusOnMouseOver: boolean;
    /** if \> 0, pressing the arrow keys will move the camera */
    moveSpeed: number;
    /**
     * define the max visible vertical angle of the scene in degrees
     *
     * @defaultValue  180
     */
    verticalFOV: number;
    /**
     * alternative way to specify the max vertical angle when using a panorama.
     * You can specify the panorama width/height ratio and the verticalFOV
     * will be computed automatically
     */
    panoramaRatio?: number;
    /**
     * if true, the controls will not self listen to mouse/key events.
     * You'll have to manually forward the events to the appropriate
     * functions: onMouseDown, onMouseMove, onMouseUp, onKeyUp, onKeyDown and onMouseWheel.
     */
    disableEventListeners: boolean;
    /** the minimal height of the instance camera */
    minHeight?: number;
    /** the maximal height of the instance camera */
    maxHeight?: number;
}
declare class FirstPersonControls {
    readonly options: FirstPersonControlsOptions;
    private readonly _state;
    private readonly _instance;
    private readonly _camera;
    private readonly _moves;
    private _isMouseDown;
    private _mouseDown;
    private _stateOnMouseDown?;
    enabled: boolean;
    /**
     * @param instance - the Giro3D instance to control
     * @param options - additional options
     */
    constructor(instance: Instance, options?: Partial<FirstPersonControlsOptions>);
    isUserInteracting(): boolean;
    /**
     * Resets the controls internal state to match the camera' state.
     * This must be called when manually modifying the camera's position or rotation.
     *
     * @param preserveRotationOnX - if true, the look up/down rotation will
     * not be copied from the camera
     */
    reset(preserveRotationOnX?: boolean): void;
    /**
     * Updates the camera position / rotation based on occured input events.
     * This is done automatically when needed but can also be done if needed.
     *
     * @param event - Event
     * @param force - set to true if you want to force the update, even if it
     * appears unneeded.
     */
    update(event: InstanceEvents['after-camera-update'], force?: boolean): void;
    private onInteractionStart;
    private onMouseDown;
    private onTouchStart;
    private snapshot;
    private onMouseUp;
    private onTouchEnd;
    private onInteractionMove;
    private onMouseMove;
    private onTouchMove;
    private onMouseWheel;
    private onKeyUp;
    private onKeyDown;
}
export default FirstPersonControls;
//# sourceMappingURL=FirstPersonControls.d.ts.map