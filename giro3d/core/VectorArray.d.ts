import type { TypedArray } from 'three';
import { Vector2, Vector3, Vector4 } from 'three';
export type Dimension = 2 | 3 | 4;
export type Vector = Vector2 | Vector3 | Vector4;
/**
 * A typed array of three.js {@link Vector}s.
 *
 * @param V - The underlying {@link Vector} type.
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export declare abstract class VectorArray<V extends Vector = Vector, Buffer extends TypedArray = TypedArray> {
    private readonly _dimension;
    private _capacity;
    protected _array: Buffer;
    private _length;
    private _lastExpansion;
    /**
     * The length in bytes of the array.
     */
    get byteLength(): number;
    get capacity(): number;
    /**
     * Gets the underlying {@link Buffer}.
     */
    get array(): Buffer;
    /**
     * Returns the {@link Float32Array} equivalent of this vector array.
     * Note: if the underlying array is already a Float32Array, this array is returned.
     * Otherwise, a new array is constructed.
     */
    toFloat32Array(): Float32Array;
    protected constructor(buffer: Buffer, dimension: Dimension);
    /**
     * Returns the number of vectors in this array.
     */
    get length(): number;
    set length(v: number);
    /**
     * Gets the vector at the specified index.
     */
    abstract get(index: number, target?: V): V;
    setX(index: number, value: number): void;
    /**
     * Gets the first component of the vector at the specified index.
     */
    getX(index: number): number;
    setY(index: number, value: number): void;
    /**
     * Gets the second component of the vector at the specified index.
     */
    getY(index: number): number;
    setZ(index: number, value: number): void;
    /**
     * Gets the third component of the vector at the specified index, or `null` if the dimension
     * of this array is less than 3.
     */
    getZ(index: number): number | null;
    setW(index: number, value: number): void;
    /**
     * Gets the fourth component of the vector at the specified index, or `null` if the dimension
     * of this array is less than 4.
     */
    getW(index: number): number | null;
    /**
     * Sets the vector at the specified index.
     */
    setVector(index: number, v: V): void;
    /**
     * Sets the component of the array at the specified index.
     */
    set(index: number, x: number, y: number, z?: number, w?: number): void;
    /**
     * Copies an element from one location to another in the array.
     */
    copyItem(from: number, to: number): void;
    private computeExpansionSize;
    /**
     * Removes unused capacity.
     */
    trim(): void;
    /**
     * Adds capacity at the end of the array using a growing expansion size (i.e the first time
     * this method is called, a small amount is added, and the amount grows every time this method
     * is called up to a certain point).
     * Contrary to {@link expand}, the length is left untouched (the expanded area is not considered
     * used.)
     */
    private allocateIfFull;
    /**
     * Pushes a vector at the end of the array, allocating memory if necessary.
     */
    push(x: number, y: number, z?: number, w?: number): void;
    /**
     * Pushes a vector at the end of the array, allocating memory if necessary.
     */
    pushVector(v: V): void;
    /**
     * Allocates a new underlying array to match the new size, then copy the content
     * of the previous array at the beginning of the new array.
     * @param newSize - The new size, in number of vectors.
     */
    expand(newSize: number): this;
    /** @internal */
    protected abstract getTempVector(): V;
    /** @internal */
    protected abstract readVector(rawIndex: number, tempVector: V): void;
    /** @internal */
    protected abstract assignVector(rawIndex: number, v: Readonly<V>): void;
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
    forEach(callbackfn: (value: Readonly<V>, index: number, array: this) => void): void;
    /**
     * Clones this array.
     */
    abstract clone(): ThisType<this>;
}
/**
 * A typed array of three.js {@link Vector2}s.
 *
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export declare class Vector2Array<Buffer extends TypedArray = TypedArray> extends VectorArray<Vector2, Buffer> {
    readonly dimension: 2;
    constructor(buffer: Buffer);
    get(index: number, target?: Vector2): Vector2;
    clone(): Vector2Array<Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array>;
    protected getTempVector(): Vector2;
    protected readVector(rawIndex: number, tempVector: Vector2): void;
    protected assignVector(rawIndex: number, v: Readonly<Vector2>): void;
}
/**
 * A typed array of three.js {@link Vector3}s.
 *
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export declare class Vector3Array<Buffer extends TypedArray = TypedArray> extends VectorArray<Vector3, Buffer> {
    readonly dimension: 3;
    constructor(buffer: Buffer);
    get(index: number, target?: Vector3): Vector3;
    clone(): Vector3Array<Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array>;
    protected getTempVector(): Vector3;
    protected readVector(rawIndex: number, tempVector: Vector3): void;
    protected assignVector(rawIndex: number, v: Readonly<Vector3>): void;
}
/**
 * A typed array of three.js {@link Vector4}s.
 *
 * @param Buffer - The underlying {@link TypedArray} type.
 */
export declare class Vector4Array<Buffer extends TypedArray = TypedArray> extends VectorArray<Vector4, Buffer> {
    readonly dimension: 4;
    constructor(buffer: Buffer);
    get(index: number, target?: Vector4): Vector4;
    clone(): Vector4Array<Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array>;
    protected getTempVector(): Vector4;
    protected readVector(rawIndex: number, tempVector: Vector4): void;
    protected assignVector(rawIndex: number, v: Readonly<Vector4>): void;
}
//# sourceMappingURL=VectorArray.d.ts.map