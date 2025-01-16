function isTexture(o) {
  return o?.isTexture;
}
class TextureState {
  inGpuMemory = false;
  constructor(texture) {
    this.texture = texture;
    texture.addEventListener('dispose', () => this.inGpuMemory = false);
    if (texture.isRenderTargetTexture) {
      this.inGpuMemory = true;
    } else {
      const currentOnUpdate = texture.onUpdate;
      const patchedOnUpdate = () => {
        this.inGpuMemory = true;
        currentOnUpdate?.call(texture);
      };
      texture.onUpdate = patchedOnUpdate;
    }
  }
}
let allocated = [];
const textures = new Map();
const FLUSH_EVERY_NTH = 100;
let enabled = false;
let counter = 0;

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
class MemoryTracker {
  /**
   * Enables the tracking of allocated objects.
   */
  static set enable(v) {
    if (enabled !== v) {
      enabled = v;
      if (!enabled) {
        allocated.length = 0;
      }
    }
  }
  static get enable() {
    return enabled;
  }

  /**
   * Registers an object to the memory tracker.
   *
   * @param obj - The object to track.
   * @param name - The name of the tracked object. Does not have to be unique.
   */
  static track(obj, name) {
    if (enabled) {
      allocated.push({
        name,
        weakref: new WeakRef(obj)
      });
      counter++;
      if (isTexture(obj) && !textures.has(obj.id)) {
        textures.set(obj.id, new TextureState(obj));
      }
      if (counter === FLUSH_EVERY_NTH) {
        this.flush();
        counter = 0;
      }
    }
  }

  /**
   * Removes all invalid references.
   *
   */
  static flush() {
    const newArray = [];
    let hasChanged = false;
    for (const entry of allocated) {
      const {
        weakref
      } = entry;
      const value = weakref.deref();
      if (value) {
        newArray.push(entry);
      } else {
        hasChanged = true;
      }
    }
    if (hasChanged) {
      allocated = newArray;
    }
  }

  /**
   * Returns an array of all valid tracked objects (that have not been garbage collected).
   *
   * Important note: this array will hold actual references (dereferenced `WeakRef`s).
   * They will no longer be removed by the garbage collector as long as values in this arrays
   * exist ! You should make sure to empty this array when you are finished with it.
   *
   * @returns The tracked objects.
   */
  static getTrackedObjects() {
    const map = {};
    for (const entry of allocated) {
      const {
        name,
        weakref
      } = entry;
      const value = weakref.deref();
      if (value) {
        const key = value.constructor.name;
        if (map[key] == null) {
          map[key] = [];
        }
        map[key].push({
          name,
          value
        });
      }
    }
    return map;
  }
  static getTrackedTextures() {
    return [...textures.values()];
  }
}
export default MemoryTracker;