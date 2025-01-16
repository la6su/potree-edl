export declare const DEFAULT_LAZPERF_PATH = "https://cdn.jsdelivr.net/npm/laz-perf@0.0.6/lib";
/**
 * Sets the path to the directory that contains the laz-perf library files.
 *
 * This must be set before instantiating any class that makes use of this library.
 *
 * For example, if the `laz-perf.wasm` file is served from
 * `<website>/public/wasm/laz-perf.wasm`, the path to configure is the following:
 * ```ts
 * setLazPerfPath('/public/wasm/');
 * ```
 *
 * Note: the default path to the laz-perf library is {@link DEFAULT_LAZPERF_PATH}.
 */
export declare function setLazPerfPath(path: string): void;
/**
 * @internal
 */
export declare function getLazPerfPath(): string;
/**
 * @internal
 */
export declare function getLazPerf(): Promise<import("laz-perf/lib/node/laz-perf").LazPerf>;
//# sourceMappingURL=config.d.ts.map