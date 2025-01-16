import { EventDispatcher, type EventListener, type Texture } from 'three';
export interface FetcherEventMap {
    /**
     * Fires when a Network or HTTP error occured during fetch
     * ```js
     * Fetcher.addEventListener('error', (error) => {
     *     if (error.response && error.response.status === 401) {
     *        console.error(
     *            `Unauthorized to access resource ${error.response.url}: ${error.message}`,
     *            error,
     *        );
     *    } else {
     *        console.error('Got an error while fetching resource', error);
     *    }
     * });
     * ```
     */
    error: {
        error: Error;
    };
}
export declare class FetcherEventDispatcher extends EventDispatcher<FetcherEventMap> {
}
/**
 * Adds a listener to an event type on fetch operations.
 *
 * @param type - The type of event to listen to - only `error` is supported.
 * @param listener - The function that gets called when the event is fired.
 */
declare function addEventListener<T extends keyof FetcherEventMap>(type: T, listener: EventListener<FetcherEventMap[T], T, FetcherEventDispatcher>): void;
/**
 * Checks if listener is added to an event type.
 *
 * @param type - The type of event to listen to - only `error` is supported.
 * @param listener - The function that gets called when the event is fired.
 * @returns `true` if the listener is added to this event type.
 */
declare function hasEventListener<T extends keyof FetcherEventMap>(type: T, listener: EventListener<FetcherEventMap[T], T, FetcherEventDispatcher>): boolean;
/**
 * Removes a listener from an event type on fetch operations.
 *
 * @param type - The type of the listener that gets removed.
 * @param listener - The listener function that gets removed.
 */
declare function removeEventListener<T extends keyof FetcherEventMap>(type: T, listener: EventListener<FetcherEventMap[T], T, FetcherEventDispatcher>): void;
/**
 * @internal
 */
declare function getInfo(): {
    pending: number;
};
/**
 * An error raised whenever the received response does not have a 2XX status.
 */
export declare class HttpError extends Error {
    readonly response: Response;
    constructor(response: Response);
}
export type FetchOptions = RequestInit & {
    /**
     * The number of retries if the initial requests fails with an HTTP error code.
     * @defaultValue undefined
     */
    retries?: number;
    /**
     * The delay to wait (in milliseconds) before a new try is attempted. Only if {@link retries} is defined.
     * @defaultValue 1000
     */
    retryDelay?: number;
};
/**
 * Wrapper over [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
 *
 * Use this function instead of calling directly the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * to benefit from automatic configuration from the {@link HttpConfiguration} module.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the fetch input
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns The response object.
 */
declare function fetchInternal(input: RequestInfo | URL, options?: FetchOptions): Promise<Response>;
/**
 * Wrapper over `fetch`, then returns the blob of the response.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns The response blob.
 */
declare function blob(input: RequestInfo | URL, options?: RequestInit): Promise<Blob>;
/**
 * Wrapper over `fetch` to get some text
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the text
 */
declare function text(input: RequestInfo | URL, options?: RequestInit): Promise<string>;
/**
 * Wrapper over `fetch` to get some JSON
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the JSON
 */
declare function json<T = unknown>(input: RequestInfo | URL, options?: RequestInit): Promise<T>;
/**
 * Wrapper over `fetch` to get some XML.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the XML
 */
declare function xml(input: RequestInfo | URL, options?: RequestInit): Promise<Document>;
/**
 * Wrapper over `fetch` to get some `ArrayBuffer`
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the ArrayBuffer
 */
declare function arrayBuffer(input: RequestInfo | URL, options?: RequestInit): Promise<ArrayBuffer>;
/**
 * Downloads a remote image and converts it into a texture.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - Texture creation options and fetch options (passed directly to `fetch()`)
 * @returns the promise containing the texture
 */
declare function texture(input: RequestInfo | URL, options?: RequestInit & {
    createDataTexture?: boolean;
    flipY?: boolean;
}): Promise<Texture>;
/**
 * Exposes an API to perform HTTP requests.
 * This should be used instead of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * in order to benefit from some error-checking, automatic configuration (from the
 * {@link HttpConfiguration} module), etc.
 *
 */
declare const _default: {
    fetch: typeof fetchInternal;
    xml: typeof xml;
    json: typeof json;
    blob: typeof blob;
    texture: typeof texture;
    arrayBuffer: typeof arrayBuffer;
    text: typeof text;
    /** @internal */
    getInfo: typeof getInfo;
    addEventListener: typeof addEventListener;
    hasEventListener: typeof hasEventListener;
    removeEventListener: typeof removeEventListener;
    /** @internal */
    _eventTarget: FetcherEventDispatcher;
};
export default _default;
//# sourceMappingURL=Fetcher.d.ts.map