import { LRUCache } from 'lru-cache';
import { isMemoryUsage } from './MemoryUsage';

/**
 * The options for a cache entry.
 */

/**
 * The default max number of entries.
 */
const DEFAULT_MAX_ENTRIES = 8192;

/**
 * The default TTL (time to live), in milliseconds.
 */
const DEFAULT_TTL = 240_000; // 240 seconds

/**
 * The default capacity, in bytes.
 */
const DEFAULT_CAPACITY = 536_870_912; // 512 MB

/**
 * The cache.
 *
 */
class Cache {
  isMemoryUsage = true;
  /**
   * Constructs a cache.
   *
   * @param opts - The options.
   */
  constructor(opts) {
    this._deleteHandlers = new Map();
    this._enabled = true;
    this._lru = this.createLRUCache(opts);
  }
  createLRUCache(opts) {
    return new LRUCache({
      ttl: opts?.ttl ?? DEFAULT_TTL,
      ttlResolution: 1000,
      // 1 second
      updateAgeOnGet: true,
      maxSize: opts?.byteCapacity ?? DEFAULT_CAPACITY,
      max: opts?.maxNumberOfEntries ?? DEFAULT_MAX_ENTRIES,
      allowStale: false,
      dispose: (value, key) => {
        this.onDisposed(key, value);
      }
    });
  }

  /**
   * Configure the cache with the specified configuration. The cache must be
   * empty otherwise this method will throw an error.
   */
  configure(config) {
    if (this.count > 0) {
      throw new Error('cannot configure the cache as it is not empty.');
    }
    this._lru = this.createLRUCache(config);
  }
  getMemoryUsage(context) {
    this._lru.forEach(e => {
      if (isMemoryUsage(e)) {
        e.getMemoryUsage(context);
      }
    });
  }

  /**
   * Enables or disables the cache.
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(v) {
    this._enabled = v;
  }

  /**
   * Gets or sets the default TTL (time to live) of the cache.
   */
  get defaultTtl() {
    return this._lru.ttl;
  }
  set defaultTtl(v) {
    this._lru.ttl = v;
  }

  /**
   * Gets the maximum size of the cache, in bytes.
   */
  get maxSize() {
    return this._lru.maxSize;
  }

  /**
   * Gets the maximum number of entries.
   */
  get capacity() {
    return this._lru.max;
  }

  /**
   * Gets the number of entries.
   */
  get count() {
    return this._lru.size;
  }

  /**
   * Gets the size of entries, in bytes
   */
  get size() {
    return this._lru.calculatedSize;
  }

  /**
   * Returns an array of entries.
   */
  entries() {
    return [...this._lru.entries()];
  }
  onDisposed(key, value) {
    const handler = this._deleteHandlers.get(key);
    if (handler) {
      this._deleteHandlers.delete(key);
      handler(value);
    }
  }

  /**
   * Removes stale entries.
   */
  purge() {
    this._lru.purgeStale();
  }

  /**
   * Returns the entry with the specified key, or `undefined` if no entry matches this key.
   *
   * @param key - The entry key.
   * @returns The entry, or `undefined`.
   */
  get(key) {
    if (!this.enabled) {
      return undefined;
    }
    return this._lru.get(key);
  }

  /**
   * Stores an entry in the cache, or replaces an existing entry with the same key.
   *
   * @param key - The key.
   * @param value - The value.
   * @param options - The options.
   */
  set(key, value, options = {}) {
    if (!this.enabled) {
      return value;
    }
    if (typeof key !== 'string') {
      throw new Error('the cache expects strings as keys.');
    }
    this._lru.set(key, value, {
      ttl: options.ttl ?? this.defaultTtl,
      size: options.size ?? 1024 // Use a default size if not provided
    });
    if (options.onDelete) {
      this._deleteHandlers.set(key, options.onDelete);
    }
    return value;
  }

  /**
   * Deletes an entry.
   *
   * @param key - The key.
   * @returns `true` if the entry was deleted, `false` otherwise.
   */
  delete(key) {
    return this._lru.delete(key);
  }

  /**
   * Clears the cache.
   *
   */
  clear() {
    this._lru.clear();
  }
}

/**
 * A global singleton cache.
 */
const GlobalCache = new Cache();
export { Cache, DEFAULT_CAPACITY, DEFAULT_MAX_ENTRIES, DEFAULT_TTL, GlobalCache };