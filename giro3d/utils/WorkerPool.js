import OperationCounter from '../core/OperationCounter';

/**
 * A message to send to the worker.
 */

export class WorkerError extends Error {
  constructor(messageId, message) {
    super(message);
    this.messageId = messageId;
  }
}
export function createErrorResponse(requestId, error) {
  return {
    requestId,
    error: error instanceof Error ? error.message : 'unknown error'
  };
}
/**
 * A simple Web Worker pool that can select idle workers to perform work.
 *
 * Additionally, idle workers are terminated after a delay to free resources.
 *
 * @typeParam TMessageType - The type of the messages supported by the workers.
 * @typeParam TMessageMap - The map between request and response messages.
 */
export default class WorkerPool {
  _workers = new Set();
  _disposed = false;
  _messageId = 0;
  get loading() {
    let result = false;
    this._workers.forEach(w => {
      if (w.counter.loading) {
        result = true;
      }
    });
    return result;
  }
  get progress() {
    let sum = 0;
    this._workers.forEach(w => {
      sum += w.counter.progress;
    });
    return sum / this._workers.size;
  }
  constructor(options) {
    this._createWorker = options.createWorker;
    this._terminationDelay = options.terminationDelay ?? 10000;
    if (options.concurrency != null) {
      this._concurrency = options.concurrency;
    } else if (typeof window !== 'undefined' && window.navigator != null) {
      this._concurrency = window.navigator.hardwareConcurrency;
    } else {
      this._concurrency = 1;
    }
  }

  /**
   * Sends a message to the first available worker, then waits for a response matching this
   * message's id, then returns this response, or throw an error if an error response is received.
   */
  queue(type, payload, transfer) {
    if (this._disposed) {
      throw new Error('this object is disposed');
    }
    const wrapper = this.getWorker();
    wrapper.counter.increment();
    if (wrapper.idleTimeout) {
      clearTimeout(wrapper.idleTimeout);
      wrapper.idleTimeout = null;
    }
    const worker = wrapper.worker;
    const message = {
      id: this._messageId++,
      payload,
      type: type
    };
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line prefer-const
      let stopListening;
      const onResponse = event => {
        const response = event.data;
        if (response.requestId === message.id) {
          stopListening();
          if ('error' in response) {
            reject(new Error(response.error));
          } else {
            resolve(response.payload);
          }
        }
      };
      stopListening = () => {
        wrapper.counter.decrement();

        // The worker is idle, start the termination timeout. It will be cancelled
        // if the worker becomes busy again before the timeout finishes.
        if (!wrapper.counter.loading) {
          this.startWorkerTerminationTimeout(wrapper);
        }
        worker.removeEventListener('message', onResponse);
      };
      worker.addEventListener('message', onResponse);
      worker.postMessage(message, transfer ?? []);
    });
  }

  /**
   * Terminates all workers.
   */
  dispose() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._workers.forEach(w => w.worker.terminate());
  }
  startWorkerTerminationTimeout(wrapper) {
    const worker = wrapper.worker;
    wrapper.idleTimeout = setTimeout(() => {
      worker.terminate();
      this._workers.delete(wrapper);
    }, this._terminationDelay);
  }
  createWorker() {
    const worker = this._createWorker();
    const wrapper = {
      counter: new OperationCounter(),
      worker,
      idleTimeout: null
    };
    this._workers.add(wrapper);
    return wrapper;
  }
  getWorker() {
    // Create the first worker.
    if (this._workers.size === 0) {
      return this.createWorker();
    }
    const workers = [...this._workers];

    // Attempt to return the first idle worker.
    const idle = workers.find(w => !w.counter.loading);
    if (idle) {
      return idle;
    }

    // No idle worker, create one if possible.
    if (this._workers.size < this._concurrency) {
      return this.createWorker();
    }

    // All workers are busy and impossible to create one, just return the least busy.
    workers.sort((a, b) => a.counter.operations - b.counter.operations);
    const leastBusy = workers[0];
    return leastBusy;
  }
}