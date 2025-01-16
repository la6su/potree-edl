import { EventDispatcher } from 'three';
import type Progress from './Progress';
export interface OperationCounterEvents {
    /**
     * Raised when the counter is changed.
     */
    changed: unknown;
    /**
     * Raised when all operations are completed.
     */
    complete: unknown;
}
/**
 * Provides a way to track the progress of running operations.
 */
declare class OperationCounter extends EventDispatcher<OperationCounterEvents> implements Progress {
    private _operations;
    private _completed;
    private _total;
    constructor();
    /**
     * Gets the number of pending operations.
     */
    get operations(): number;
    /**
     * Gets the number of completed operations.
     */
    get completed(): number;
    /**
     * Gets whether at least one operation is being executed.
     */
    get loading(): boolean;
    /**
     * Returns a number between 0 and 1 which represent the ratio between
     * completed operations and total operations.
     */
    get progress(): number;
    /**
     * Decrements the number of pending operations.
     */
    decrement(): void;
    /**
     * Increments the counter before starting the promise, then decrements it safely when the
     * promises resolves or fails.
     */
    wrap<T>(promise: Promise<T>): Promise<T>;
    /**
     * Increment the number of pending operations.
     * @param count - How many increments to do. Default is 1.
     */
    increment(count?: number): void;
}
export default OperationCounter;
//# sourceMappingURL=OperationCounter.d.ts.map