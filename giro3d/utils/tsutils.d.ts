export declare const nameof: <T>(name: keyof T) => keyof T;
/**
 * Extracts the property from the object, throwing an error if it is undefined.
 *
 * @throws if obj.prop is undefined.
 */
export declare function defined<T extends object, K extends keyof T & string>(obj: T, prop: K): T[K];
/**
 * Returns the non-nullish value or throws an exception if the object is nullish.
 * @param obj - The object to evaluate for nullishness.
 * @param msg - The optional error message.
 * @returns The {@link NonNullable} equivalent of the input value.
 */
export declare function nonNull<T>(obj: T | undefined | null, msg?: string): NonNullable<T>;
/**
 * Returns the non-nullish and non-empty value or throws an exception if the object is nullish or
 * an empty array.
 * @param obj - The object to evaluate for nullishness or emptyness.
 * @param msg - The optional error message.
 * @returns The {@link NonNullable} equivalent of the input value.
 */
export declare function nonEmpty<T>(obj: T[] | undefined | null, msg?: string): NonNullable<T[]>;
export declare function isIterable<T = unknown>(obj: unknown): obj is Iterable<T>;
/**
 * Applies the callback to the input if it is a single object, or on its items if it is an iterator.
 */
export declare function map<T>(input: T | Iterable<T>, callback: (arg: T) => void): void;
//# sourceMappingURL=tsutils.d.ts.map