import { EventDispatcher } from 'three';
/**
 * Provides a way to track the progress of running operations.
 */
class OperationCounter extends EventDispatcher {
  constructor() {
    super();
    this._operations = 0;
    this._completed = 0;
    this._total = 0;
  }

  /**
   * Gets the number of pending operations.
   */
  get operations() {
    return this._operations;
  }

  /**
   * Gets the number of completed operations.
   */
  get completed() {
    return this._completed;
  }

  /**
   * Gets whether at least one operation is being executed.
   */
  get loading() {
    return this._operations > 0;
  }

  /**
   * Returns a number between 0 and 1 which represent the ratio between
   * completed operations and total operations.
   */
  get progress() {
    if (this._operations === 0) {
      return 1;
    }
    return this._completed / this._total;
  }

  /**
   * Decrements the number of pending operations.
   */
  decrement() {
    if (this._operations === 0) {
      return;
    }
    this._operations--;
    this._completed++;
    this.dispatchEvent({
      type: 'changed'
    });
    if (this._operations === 0) {
      this._total = 0;
      this._completed = 0;
      this.dispatchEvent({
        type: 'complete'
      });
    }
  }

  /**
   * Increments the counter before starting the promise, then decrements it safely when the
   * promises resolves or fails.
   */
  wrap(promise) {
    this.increment();
    return promise.finally(() => this.decrement());
  }

  /**
   * Increment the number of pending operations.
   * @param count - How many increments to do. Default is 1.
   */
  increment(count = 1) {
    this._operations += count;
    this._total += count;
    this.dispatchEvent({
      type: 'changed'
    });
  }
}
export default OperationCounter;