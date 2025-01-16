import { EventDispatcher } from 'three';
import type Progress from './Progress';
export interface RequestQueueEvents {
    /**
     * Raised when a task has been executed.
     */
    'task-executed': unknown;
    /**
     * Raised when a task has been cancelled.
     */
    'task-cancelled': unknown;
}
/**
 * A generic priority queue that ensures that the same request cannot be added twice in the queue.
 */
declare class RequestQueue extends EventDispatcher<RequestQueueEvents> implements Progress {
    private readonly _pendingIds;
    private readonly _queue;
    private readonly _opCounter;
    private readonly _maxConcurrentRequests;
    private _concurrentRequests;
    /**
     * @param options - Options.
     */
    constructor(options?: {
        /** The maximum number of concurrent requests. */
        maxConcurrentRequests?: number;
    });
    get length(): number;
    get progress(): number;
    get loading(): boolean;
    get pendingRequests(): number;
    get concurrentRequests(): number;
    onQueueAvailable(): void;
    /**
     * Enqueues a request. If a request with the same id is currently in the queue, then returns
     * the promise associated with the existing request.
     *
     * @param options - Options.
     * @returns A promise that resolves when the requested is completed.
     */
    enqueue<T>(options: {
        /** The unique identifier of this request. */
        id: string;
        /** The request. */
        request: () => Promise<T>;
        /** The abort signal. */
        signal?: AbortSignal;
        /** The priority of this request. */
        priority?: number;
        /** The optional predicate used to discard a task: if the function returns `false`,
         * the task is not executed. */
        shouldExecute?: () => boolean;
    }): Promise<T>;
}
/**
 * A global singleton queue.
 */
declare const DefaultQueue: RequestQueue;
export { DefaultQueue };
export default RequestQueue;
/**
 * Defers the action by queueing it to the default queue.
 */
export declare function defer<T>(action: () => T, signal?: AbortSignal): Promise<T>;
//# sourceMappingURL=RequestQueue.d.ts.map