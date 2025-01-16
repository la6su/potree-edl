/**
 * A Map-like data structure that provides two levels of indirection.
 */
export default class NestedMap {
  _rootMap = new Map();

  /**
   * @returns the number of elements in the NestedMap.
   */
  get size() {
    if (this._rootMap.size === 0) {
      return 0;
    }
    let sum = 0;
    this._rootMap.forEach(m => sum += m.size);
    return sum;
  }

  /**
   * Executes a provided function once per each key tuple/value pair in the Map.
   */
  forEach(callbackfn) {
    if (this._rootMap.size === 0) {
      return;
    }
    this._rootMap.forEach((m, k0) => {
      m.forEach((v, k1) => callbackfn(v, k0, k1, this));
    });
  }

  /**
   * @returns boolean indicating whether an element with the specified key tuple exists or not.
   */
  has(k0, k1) {
    return this._rootMap.get(k0)?.has(k1) ?? false;
  }
  clear() {
    this._rootMap.clear();
  }

  /**
   * Gets an element with the specified key tuple, if any.
   * Otherwise, construct it on the spot with the provided function,
   * and insert the created value in the map.
   */
  getOrCreate(k0, k1, createValueFn) {
    let root = this._rootMap.get(k0);
    if (root == null) {
      root = new Map();
      this._rootMap.set(k0, root);
    }
    let value = root.get(k1);
    if (value == null) {
      value = createValueFn(k0, k1);
      root.set(k1, value);
    }
    return value;
  }
}