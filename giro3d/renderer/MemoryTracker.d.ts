import type { Texture } from 'three';
declare class TextureState {
    readonly texture: Texture;
    inGpuMemory: boolean;
    constructor(texture: Texture);
}
/**
 * Utility to track memory allocations.
 *
 * This uses [`WeakRef`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
 * internally to avoid holding a reference past its lifetime.
 *
 * @example
 * // Enable the memory tracker (disabled by default).
 * MemoryTracker.enable = true;
 *
 * const texture = new Texture();
 *
 * MemoryTracker.track(texture, 'my tracked texture');
 *
 * const allocated = MemoryTracker.getTrackedObjects();
 *
 * // allocated should be \{ Texture: [\{ name: 'my tracked texture', value: texture]\}
 */
declare class MemoryTracker {
    /**
     * Enables the tracking of allocated objects.
     */
    static set enable(v: boolean);
    static get enable(): boolean;
    /**
     * Registers an object to the memory tracker.
     *
     * @param obj - The object to track.
     * @param name - The name of the tracked object. Does not have to be unique.
     */
    static track(obj: object, name: string): void;
    /**
     * Removes all invalid references.
     *
     */
    static flush(): void;
    /**
     * Returns an array of all valid tracked objects (that have not been garbage collected).
     *
     * Important note: this array will hold actual references (dereferenced `WeakRef`s).
     * They will no longer be removed by the garbage collector as long as values in this arrays
     * exist ! You should make sure to empty this array when you are finished with it.
     *
     * @returns The tracked objects.
     */
    static getTrackedObjects(): Record<string, {
        name: string;
        value: object;
    }[]>;
    static getTrackedTextures(): TextureState[];
}
export default MemoryTracker;
//# sourceMappingURL=MemoryTracker.d.ts.map