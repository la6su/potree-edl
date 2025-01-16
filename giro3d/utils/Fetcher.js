import { EventDispatcher } from 'three';
import RequestQueue from '../core/RequestQueue';
import HttpConfiguration from './HttpConfiguration';
import PromiseUtils from './PromiseUtils';
import TextureGenerator from './TextureGenerator';
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_CONCURRENT_REQUESTS_PER_HOST = 10;
export class FetcherEventDispatcher extends EventDispatcher {}
const eventTarget = new FetcherEventDispatcher();

/**
 * Adds a listener to an event type on fetch operations.
 *
 * @param type - The type of event to listen to - only `error` is supported.
 * @param listener - The function that gets called when the event is fired.
 */
function addEventListener(type, listener) {
  eventTarget.addEventListener(type, listener);
}

/**
 * Checks if listener is added to an event type.
 *
 * @param type - The type of event to listen to - only `error` is supported.
 * @param listener - The function that gets called when the event is fired.
 * @returns `true` if the listener is added to this event type.
 */
function hasEventListener(type, listener) {
  return eventTarget.hasEventListener(type, listener);
}

/**
 * Removes a listener from an event type on fetch operations.
 *
 * @param type - The type of the listener that gets removed.
 * @param listener - The listener function that gets removed.
 */
function removeEventListener(type, listener) {
  eventTarget.removeEventListener(type, listener);
}
const hostQueues = new Map();
let id = 0;
function toNumericalPriority(priority) {
  if (priority == null || priority === 'auto') {
    return undefined;
  }
  if (priority === 'high') {
    return 1;
  }
  return -1;
}

/**
 * Queue an HTTP request.
 *
 * @param req - The request to queue.
 */
function enqueue(req, init) {
  const url = new URL(req.url);
  let queue = hostQueues.get(url.hostname);
  if (!queue) {
    queue = new RequestQueue({
      maxConcurrentRequests: DEFAULT_CONCURRENT_REQUESTS_PER_HOST
    });
    hostQueues.set(url.hostname, queue);
  }
  const doFetch = async () => {
    req.signal?.throwIfAborted();
    const res = await fetch(req, init);
    return res;
  };
  return queue.enqueue({
    id: (id++).toString(),
    request: () => doFetch(),
    shouldExecute: req.signal == null ? undefined : () => !req.signal.aborted,
    priority: toNumericalPriority(init?.priority)
  });
}

/**
 * @internal
 */
function getInfo() {
  let pending = 0;
  hostQueues.forEach(queue => {
    pending += queue.length;
  });
  return {
    pending
  };
}

/**
 * An error raised whenever the received response does not have a 2XX status.
 */
export class HttpError extends Error {
  constructor(response) {
    super(`${response.status} ${response.statusText} - ${response.url}`);
    this.response = response;
  }
}
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
async function fetchInternal(input, options) {
  const augmentedOptions = HttpConfiguration.applyConfiguration(input, options);
  const req = new Request(input, augmentedOptions);
  const response = await enqueue(req, {
    priority: options?.priority
  }).catch(error => {
    eventTarget.dispatchEvent({
      type: 'error',
      error
    });
    throw error;
  });
  if (!response.ok) {
    const retries = options?.retries ?? 0;
    if (retries > 0) {
      const retryDelay = options?.retryDelay ?? DEFAULT_RETRY_DELAY_MS;
      if (retryDelay > 0) {
        await PromiseUtils.delay(retryDelay);
      }
      return fetchInternal(input, {
        ...options,
        retries: retries - 1
      });
    } else {
      const error = new HttpError(response);
      eventTarget.dispatchEvent({
        type: 'error',
        error
      });
      throw error;
    }
  }
  return response;
}

/**
 * Wrapper over `fetch`, then returns the blob of the response.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns The response blob.
 */
async function blob(input, options) {
  const response = await fetchInternal(input, options);
  return response.blob();
}

/**
 * Wrapper over `fetch` to get some text
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the text
 */
async function text(input, options) {
  const response = await fetchInternal(input, options);
  return response.text();
}

/**
 * Wrapper over `fetch` to get some JSON
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the JSON
 */
async function json(input, options) {
  const response = await fetchInternal(input, options);
  return response.json();
}

/**
 * Wrapper over `fetch` to get some XML.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the XML
 */
async function xml(input, options) {
  const response = await fetchInternal(input, options);
  const txt = await response.text();
  return new window.DOMParser().parseFromString(txt, 'text/xml');
}

/**
 * Wrapper over `fetch` to get some `ArrayBuffer`
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - fetch options (passed directly to `fetch()`)
 * @returns the promise containing the ArrayBuffer
 */
async function arrayBuffer(input, options) {
  const response = await fetchInternal(input, options);
  return response.arrayBuffer();
}

/**
 * Downloads a remote image and converts it into a texture.
 *
 * fires `error` event On Network/HTTP error.
 * @param input - the URL to fetch, or the resource request.
 * @param options - Texture creation options and fetch options (passed directly to `fetch()`)
 * @returns the promise containing the texture
 */
async function texture(input, options) {
  const data = await blob(input, options);
  return TextureGenerator.decodeBlob(data, options);
}

/**
 * Exposes an API to perform HTTP requests.
 * This should be used instead of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * in order to benefit from some error-checking, automatic configuration (from the
 * {@link HttpConfiguration} module), etc.
 *
 */
export default {
  fetch: fetchInternal,
  xml,
  json,
  blob,
  texture,
  arrayBuffer,
  text,
  /** @internal */
  getInfo,
  addEventListener,
  hasEventListener,
  removeEventListener,
  /** @internal */
  _eventTarget: eventTarget // Used for testing
};