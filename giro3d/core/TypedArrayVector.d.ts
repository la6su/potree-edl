import { type TypedArray } from 'three';
/**
 * A redimensionable wrapper around a {@link TypedArray}.
 *
 * Here, 'vector' means 'resizeable' array, and not a three.js vector.
 */
export default class TypedArrayVector<T extends TypedArray> {
    private readonly _ctor;
    private _array;
    private _length;
    constructor(capacity: number, createNew: (capacity: number) => T);
    /**
     * The capacity of this vector.
     */
    get capacity(): number;
    get length(): number;
    /**
     * Pushes a value at the end of the vector.
     */
    push(v: number): void;
    /**
     * Returns the underlying array, resized so that capacity = length.
     */
    getArray(): T;
    private get isFull();
    private expand;
}
//# sourceMappingURL=TypedArrayVector.d.ts.map