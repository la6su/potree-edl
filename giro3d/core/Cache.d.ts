import type MemoryUsage from './MemoryUsage';
import { type GetMemoryUsageContext } from './MemoryUsage';
/**
 * The options for a cache entry.
 */
interface CacheOptions {
    /**
     * The time to live of this entry, in milliseconds.
     */
    ttl?: number;
    /**
     * The entry size, in bytes. It does not have to be an exact value, but
     * it helps the cache determine when to remove entries to save memory.
     */
    size?: number;
    /**
     * A optional callback called when the entry is deleted from the cache.
     */
    onDelete?: (entry: unknown) => void;
}
/**
 * The default max number of entries.
 */
declare const DEFAULT_MAX_ENTRIES = 8192;
/**
 * The default TTL (time to live), in milliseconds.
 */
declare const DEFAULT_TTL: number;
/**
 * The default capacity, in bytes.
 */
declare const DEFAULT_CAPACITY: number;
interface CacheConfiguration {
    /**
     * The default TTL (time to live) of entries, in milliseconds.
     * Can be overriden for each entry (see {@link CacheOptions}).
     * @defaultValue {@link DEFAULT_TTL}
     */
    ttl?: number;
    /**
     * The capacity, in bytes, of the cache.
     * @defaultValue {@link DEFAULT_CAPACITY}
     */
    byteCapacity?: number;
    /**
     * The capacity, in number of entries, of the cache.
     * @defaultValue {@link DEFAULT_MAX_ENTRIES}
     */
    maxNumberOfEntries?: number;
}
/**
 * The cache.
 *
 */
declare class Cache implements MemoryUsage {
    readonly isMemoryUsage: true;
    private readonly _deleteHandlers;
    private _lru;
    private _enabled;
    /**
     * Constructs a cache.
     *
     * @param opts - The options.
     */
    constructor(opts?: CacheConfiguration);
    private createLRUCache;
    /**
     * Configure the cache with the specified configuration. The cache must be
     * empty otherwise this method will throw an error.
     */
    configure(config: CacheConfiguration): void;
    getMemoryUsage(context: GetMemoryUsageContext): void;
    /**
     * Enables or disables the cache.
     */
    get enabled(): boolean;
    set enabled(v: boolean);
    /**
     * Gets or sets the default TTL (time to live) of the cache.
     */
    get defaultTtl(): number;
    set defaultTtl(v: number);
    /**
     * Gets the maximum size of the cache, in bytes.
     */
    get maxSize(): number;
    /**
     * Gets the maximum number of entries.
     */
    get capacity(): number;
    /**
     * Gets the number of entries.
     */
    get count(): number;
    /**
     * Gets the size of entries, in bytes
     */
    get size(): number;
    /**
     * Returns an array of entries.
     */
    entries(): Array<unknown>;
    private onDisposed;
    /**
     * Removes stale entries.
     */
    purge(): void;
    /**
     * Returns the entry with the specified key, or `undefined` if no entry matches this key.
     *
     * @param key - The entry key.
     * @returns The entry, or `undefined`.
     */
    get(key: string): unknown | undefined;
    /**
     * Stores an entry in the cache, or replaces an existing entry with the same key.
     *
     * @param key - The key.
     * @param value - The value.
     * @param options - The options.
     */
    set<T extends object>(key: string, value: T, options?: CacheOptions): T;
    /**
     * Deletes an entry.
     *
     * @param key - The key.
     * @returns `true` if the entry was deleted, `false` otherwise.
     */
    delete(key: string): boolean;
    /**
     * Clears the cache.
     *
     */
    clear(): void;
}
/**
 * A global singleton cache.
 */
declare const GlobalCache: Cache;
export { Cache, CacheConfiguration, CacheOptions, DEFAULT_CAPACITY, DEFAULT_MAX_ENTRIES, DEFAULT_TTL, GlobalCache, };
//# sourceMappingURL=Cache.d.ts.map