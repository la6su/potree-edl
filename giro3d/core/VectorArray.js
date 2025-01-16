import { MathUtils, Vector2, Vector3, Vector4 } from 'three';
import { nonNull } from '../utils/tsutils';
const X = 0;
const Y = 1;
const Z = 2;
const W = 3;
/**
 * A typed array of three.js {@link Vector}s.
 *
 * @param V - The underlying {@link Vector} type.
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export class VectorArray {
  _lastExpansion = 0;

  /**
   * The length in bytes of the array.
   */
  get byteLength() {
    return this.array.byteLength;
  }
  get capacity() {
    return this.array.length / this._dimension;
  }

  /**
   * Gets the underlying {@link Buffer}.
   */
  get array() {
    return this._array;
  }

  /**
   * Returns the {@link Float32Array} equivalent of this vector array.
   * Note: if the underlying array is already a Float32Array, this array is returned.
   * Otherwise, a new array is constructed.
   */
  toFloat32Array() {
    if (this._array instanceof Float32Array) {
      if (this._array.length === this._length * this._dimension) {
        // Return the same array as it is already in the correct format and size
        return this._array;
      } else {
        // Return a slice of the same array as it is already in the correct format
        return this._array.slice(0, this._length * this._dimension);
      }
    }

    // Create an intermediate array in the original format
    // TODO might be more efficient to allocate the array directly with the correct size,
    // then copy elements individually ?
    return new Float32Array(this._array.slice(0, this._length * this._dimension));
  }
  constructor(buffer, dimension) {
    this._dimension = dimension;
    if (buffer.length % this._dimension !== 0) {
      throw new Error(`invalid size, expected a multiple of ${this._dimension}, got ${buffer.length}`);
    }
    this._array = buffer;
    this._capacity = this._array.length / this._dimension;
    this._length = this._capacity;
  }

  /**
   * Returns the number of vectors in this array.
   */
  get length() {
    return this._length;
  }
  set length(v) {
    this._length = v;
  }

  /**
   * Gets the vector at the specified index.
   */

  setX(index, value) {
    const idx = index * this._dimension;
    this._array[idx + X] = value;
  }

  /**
   * Gets the first component of the vector at the specified index.
   */
  getX(index) {
    const idx = index * this._dimension;
    return this._array[idx + X];
  }
  setY(index, value) {
    const idx = index * this._dimension;
    this._array[idx + Y] = value;
  }

  /**
   * Gets the second component of the vector at the specified index.
   */
  getY(index) {
    const idx = index * this._dimension;
    return this._array[idx + Y];
  }
  setZ(index, value) {
    if (this._dimension >= 3) {
      const idx = index * this._dimension;
      this._array[idx + Z] = value;
    }
  }

  /**
   * Gets the third component of the vector at the specified index, or `null` if the dimension
   * of this array is less than 3.
   */
  getZ(index) {
    if (this._dimension >= 3) {
      const idx = index * this._dimension;
      return this._array[idx + Z];
    }
    return null;
  }
  setW(index, value) {
    if (this._dimension >= 4) {
      const idx = index * this._dimension;
      this._array[idx + W] = value;
    }
  }

  /**
   * Gets the fourth component of the vector at the specified index, or `null` if the dimension
   * of this array is less than 4.
   */
  getW(index) {
    if (this._dimension >= 4) {
      const idx = index * this._dimension;
      return this._array[idx + W];
    }
    return null;
  }

  /**
   * Sets the vector at the specified index.
   */
  setVector(index, v) {
    const idx = index * this._dimension;
    this._array[idx + X] = v.getComponent(X);
    this._array[idx + Y] = v.getComponent(Y);
    if (this._dimension >= 3) {
      this._array[idx + Z] = v.getComponent(Z);
    }
    if (this._dimension >= 4) {
      this._array[idx + W] = v.getComponent(W);
    }
  }

  /**
   * Sets the component of the array at the specified index.
   */
  set(index, x, y, z, w) {
    const idx = index * this._dimension;
    if (idx >= this._array.length) {
      throw new Error('index out of bounds');
    }
    this._array[idx + X] = x;
    this._array[idx + Y] = y;
    if (this._dimension >= Z && z != null) {
      this._array[idx + Z] = z;
    }
    if (this._dimension >= W && w != null) {
      this._array[idx + W] = w;
    }
  }

  /**
   * Copies an element from one location to another in the array.
   */
  copyItem(from, to) {
    const dim = this._dimension;
    const toIdx = to * dim;
    const fromIdx = from * dim;
    this._array[toIdx + X] = this._array[fromIdx + X];
    this._array[toIdx + Y] = this._array[fromIdx + Y];
    if (dim >= 3) {
      this._array[toIdx + Z] = this._array[fromIdx + Z];
    }
    if (dim >= 4) {
      this._array[toIdx + W] = this._array[fromIdx + W];
    }
  }
  computeExpansionSize() {
    if (this._lastExpansion === 0) {
      this._lastExpansion = 32;
    } else {
      this._lastExpansion *= 2;
      this._lastExpansion = MathUtils.clamp(this._lastExpansion, 32, 65536);
    }
    return this._lastExpansion;
  }

  /**
   * Removes unused capacity.
   */
  trim() {
    if (this._capacity > this._length) {
      this._capacity = this._length;
      this._array = this._array.slice(0, this._length * this._dimension);
    }
  }

  /**
   * Adds capacity at the end of the array using a growing expansion size (i.e the first time
   * this method is called, a small amount is added, and the amount grows every time this method
   * is called up to a certain point).
   * Contrary to {@link expand}, the length is left untouched (the expanded area is not considered
   * used.)
   */
  allocateIfFull() {
    if (this._capacity === this._length) {
      const currentLength = this._length;
      this.expand(this._length + this.computeExpansionSize());
      this._capacity = this._array.length / this._dimension;
      this._length = currentLength;
    }
  }

  /**
   * Pushes a vector at the end of the array, allocating memory if necessary.
   */
  push(x, y, z, w) {
    this.allocateIfFull();
    this.setX(this._length, x);
    this.setY(this._length, y);
    if (z != null) {
      this.setZ(this._length, z);
    }
    if (w != null) {
      this.setW(this._length, w);
    }
    this._length++;
  }

  /**
   * Pushes a vector at the end of the array, allocating memory if necessary.
   */
  pushVector(v) {
    this.allocateIfFull();
    this.assignVector(this._length * this._dimension, v);
    this._length++;
  }

  /**
   * Allocates a new underlying array to match the new size, then copy the content
   * of the previous array at the beginning of the new array.
   * @param newSize - The new size, in number of vectors.
   */
  expand(newSize) {
    // @ts-expect-error "this expression is not constructable"
    const newArray = new this.array.constructor(newSize * this._dimension);
    newArray.set(this._array);
    this._array = newArray;
    this._capacity = this._array.length / this._dimension;
    this._length = this._capacity;
    return this;
  }

  /** @internal */

  /** @internal */

  /** @internal */

  /**
   * Performs the specified action for each element in an array.
   *
   * Note that mutating the callback value will **not** mutate the underlying array. To mutate the
   * underlying array, use the index provided as second argument, then mutate the array with a
   * mutating method, such as {@link setVector}:
   * ```ts
   * const array = new Vector3Array(...);
   *
   * // Add one to each Y value of the array
   * array.forEach((v, index) => {
   *  // This has no effect on the Vector3Array:
   *  v.setY(v.y + 1);
   *
   *  // Use this pattern instead:
   *  array.setVector(index, new Vector3(v.x, v.y + 1, v.z));
   *
   *  // Or this one
   *  array.setY(index, v.y + 1);
   * })
   * ```
   * @param callbackfn - A function that accepts up to three arguments. forEach calls the
   * callbackfn function one time for each element in the array.
   */
  forEach(callbackfn) {
    const value = this.getTempVector();
    const stride = this._dimension;

    // Raw index is the index to the first component of each vector, not the vector itself
    for (let rawIndex = 0; rawIndex < this._array.length; rawIndex += stride) {
      this.readVector(rawIndex, value);
      const vectorIndex = rawIndex / stride;
      callbackfn(value, vectorIndex, this);
    }
  }

  /**
   * Clones this array.
   */
}

/**
 * A typed array of three.js {@link Vector2}s.
 *
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export class Vector2Array extends VectorArray {
  dimension = 2;
  constructor(buffer) {
    super(buffer, 2);
  }
  get(index, target) {
    target = target ?? new Vector2();
    return target.set(this.getX(index), this.getY(index));
  }
  clone() {
    return new Vector2Array(this._array.slice(0));
  }
  getTempVector() {
    return new Vector2();
  }
  readVector(rawIndex, tempVector) {
    const arr = this._array;
    tempVector.set(arr[rawIndex + X], arr[rawIndex + Y]);
  }
  assignVector(rawIndex, v) {
    this._array[rawIndex + X] = v.x;
    this._array[rawIndex + Y] = v.y;
  }
}

/**
 * A typed array of three.js {@link Vector3}s.
 *
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export class Vector3Array extends VectorArray {
  dimension = 3;
  constructor(buffer) {
    super(buffer, 3);
  }
  get(index, target) {
    target = target ?? new Vector3();
    return target.set(this.getX(index), this.getY(index), nonNull(this.getZ(index)));
  }
  clone() {
    return new Vector3Array(this._array.slice(0));
  }
  getTempVector() {
    return new Vector3();
  }
  readVector(rawIndex, tempVector) {
    const arr = this._array;
    tempVector.set(arr[rawIndex + X], arr[rawIndex + Y], arr[rawIndex + Z]);
  }
  assignVector(rawIndex, v) {
    this._array[rawIndex + X] = v.x;
    this._array[rawIndex + Y] = v.y;
    this._array[rawIndex + Z] = v.z;
  }
}

/**
 * A typed array of three.js {@link Vector4}s.
 *
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export class Vector4Array extends VectorArray {
  dimension = 4;
  constructor(buffer) {
    super(buffer, 4);
  }
  get(index, target) {
    target = target ?? new Vector4();
    return target.set(this.getX(index), this.getY(index), nonNull(this.getZ(index)), nonNull(this.getW(index)));
  }
  clone() {
    return new Vector4Array(this._array.slice(0));
  }
  getTempVector() {
    return new Vector4();
  }
  readVector(rawIndex, tempVector) {
    const arr = this._array;
    tempVector.set(arr[rawIndex + X], arr[rawIndex + Y], arr[rawIndex + Z], arr[rawIndex + W]);
  }
  assignVector(rawIndex, v) {
    this._array[rawIndex + X] = v.x;
    this._array[rawIndex + Y] = v.y;
    this._array[rawIndex + Z] = v.z;
    this._array[rawIndex + W] = v.w;
  }
}