import PriorityQueue from 'ol/structs/PriorityQueue';
import { EventDispatcher, MathUtils } from 'three';
import PromiseUtils from '../utils/PromiseUtils';
import OperationCounter from './OperationCounter';
function defaultShouldExecute() {
  return true;
}
class Task {
  constructor(id, priority, request, resolve, reject, shouldExecute, signal) {
    this.id = id;
    this._priority = priority;
    this._signal = signal;
    this._resolve = resolve;
    this.reject = reject;
    this._request = request;
    this.shouldExecute = shouldExecute ?? defaultShouldExecute;
  }
  getKey() {
    return this.id;
  }
  getPriority() {
    if (this._signal?.aborted === true) {
      // means "drop the request"
      return Infinity;
    }
    return this._priority;
  }
  execute() {
    if (this._signal?.aborted === true) {
      this.reject(PromiseUtils.abortError());
      return Promise.reject();
    }
    return this._request().then(x => this._resolve(x)).catch(e => this.reject(e));
  }
}
function priorityFn(task) {
  return task.getPriority();
}
function keyFn(task) {
  return task.getKey();
}
const MAX_CONCURRENT_REQUESTS = 10;
/**
 * A generic priority queue that ensures that the same request cannot be added twice in the queue.
 */
class RequestQueue extends EventDispatcher {
  /**
   * @param options - Options.
   */
  constructor(options = {}) {
    super();
    this._pendingIds = new Map();
    this._queue = new PriorityQueue(priorityFn, keyFn);
    this._opCounter = new OperationCounter();
    this._concurrentRequests = 0;
    this._maxConcurrentRequests = options.maxConcurrentRequests ?? MAX_CONCURRENT_REQUESTS;
  }
  get length() {
    return this._queue.getCount();
  }
  get progress() {
    return this._opCounter.progress;
  }
  get loading() {
    return this._opCounter.loading;
  }
  get pendingRequests() {
    return this._pendingIds.size;
  }
  get concurrentRequests() {
    return this._concurrentRequests;
  }
  onQueueAvailable() {
    if (this._queue.isEmpty()) {
      return;
    }
    while (this._concurrentRequests < this._maxConcurrentRequests) {
      if (this._queue.isEmpty()) {
        break;
      }
      const task = this._queue.dequeue();
      const key = task.getKey();
      if (task.shouldExecute()) {
        this._concurrentRequests++;
        task.execute().finally(() => {
          this._opCounter.decrement();
          this._pendingIds.delete(key);
          this._concurrentRequests--;
          this.onQueueAvailable();
          this.dispatchEvent({
            type: 'task-executed'
          });
        });
      } else {
        this._opCounter.decrement();
        this._pendingIds.delete(key);
        this.onQueueAvailable();
        task.reject(PromiseUtils.abortError());
        this.dispatchEvent({
          type: 'task-cancelled'
        });
      }
    }
  }

  /**
   * Enqueues a request. If a request with the same id is currently in the queue, then returns
   * the promise associated with the existing request.
   *
   * @param options - Options.
   * @returns A promise that resolves when the requested is completed.
   */
  enqueue(options) {
    const {
      id,
      request,
      signal,
      shouldExecute
    } = options;
    const priority = options.priority ?? 0;
    if (signal?.aborted === true) {
      return Promise.reject(PromiseUtils.abortError());
    }
    if (this._pendingIds.has(id)) {
      return this._pendingIds.get(id);
    }
    this._opCounter.increment();
    const promise = new Promise((resolve, reject) => {
      const task = new Task(id, priority, request, resolve, reject, shouldExecute, signal);
      if (this._queue.isEmpty()) {
        this._queue.enqueue(task);
        this.onQueueAvailable();
      } else {
        this._queue.enqueue(task);
      }
    });
    this._pendingIds.set(id, promise);
    return promise;
  }
}

/**
 * A global singleton queue.
 */
const DefaultQueue = new RequestQueue();
export { DefaultQueue };
export default RequestQueue;

/**
 * Defers the action by queueing it to the default queue.
 */
export function defer(action, signal) {
  return DefaultQueue.enqueue({
    id: MathUtils.generateUUID(),
    request: () => Promise.resolve(action()),
    shouldExecute: () => signal == null || !signal.aborted
  });
}