export type CreateValueFn<K0, K1, V> = (k0: K0, k1: K1) => V;
/**
 * A Map-like data structure that provides two levels of indirection.
 */
export default class NestedMap<K0, K1, V> {
    private readonly _rootMap;
    /**
     * @returns the number of elements in the NestedMap.
     */
    get size(): number;
    /**
     * Executes a provided function once per each key tuple/value pair in the Map.
     */
    forEach(callbackfn: (value: V, key0: K0, key1: K1, map: NestedMap<K0, K1, V>) => void): void;
    /**
     * @returns boolean indicating whether an element with the specified key tuple exists or not.
     */
    has(k0: K0, k1: K1): boolean;
    clear(): void;
    /**
     * Gets an element with the specified key tuple, if any.
     * Otherwise, construct it on the spot with the provided function,
     * and insert the created value in the map.
     */
    getOrCreate(k0: K0, k1: K1, createValueFn: CreateValueFn<K0, K1, V>): V;
}
//# sourceMappingURL=NestedMap.d.ts.map