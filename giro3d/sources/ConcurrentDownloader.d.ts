import type { FetchOptions } from '../utils/Fetcher';
export type FetchCallback = (url: string, options?: FetchOptions) => Promise<Response>;
/**
 * Helper class to deduplicate concurrent HTTP requests on the same URLs.
 *
 * The main use case is to be able to handle complex cancellation scenarios when a given request
 * can be "owned" by multiple `AbortSignal`s.
 *
 * ### Deduplication
 *
 * The first time a `fetch` request is called for a given URL, the request is actually started.
 * But subsequent calls to `fetch()` will always return the promise of the first call, as long
 * as the first call is still active. In other word, as soon as the request completes, it is removed
 * from the internal cache.
 *
 * ### Cancellation support
 *
 * All subsequent calls to `fetch()` will attach their own `AbortSignal` to the existing request.
 * When _all_ signals for a given request are aborted, then the request is aborted.
 */
export default class ConcurrentDownloader {
    private readonly _requests;
    private readonly _timeout;
    private readonly _retry;
    private readonly _fetch;
    constructor(options: {
        /**
         * The timeout, in milliseconds, before a running request is aborted.
         * @defaultValue 5000
         */
        timeout?: number;
        /**
         * The number of retries after receving a non 2XX HTTP code.
         * @defaultValue 3
         */
        retry?: number;
        /**
         * The fetch function to use.
         * @defaultValue {@link Fetcher.fetch}
         */
        fetch?: FetchCallback;
    });
    /**
     * Fetches the resource. If a request to the same URL is already started, returns the promise
     * to the first request instead.
     * @param url - The URL to fetch.
     * @param signal - Optional abort signal. If specified, it will be attached to the existing request.
     * Only when _all_ signals attached to this request are aborted, is the request aborted.
     * @returns A response that can be safely reused across multiple calls.
     */
    fetch(url: string, options?: FetchOptions): Promise<Response>;
}
//# sourceMappingURL=ConcurrentDownloader.d.ts.map