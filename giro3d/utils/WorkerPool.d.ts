import type Disposable from '../core/Disposable';
import type Progress from '../core/Progress';
/**
 * A message to send to the worker.
 */
export type Message<T = unknown> = {
    /**
     * The unique id of this message. Used to match the response to the original message.
     */
    id: number;
    type: string;
    payload: T;
};
export type BaseResponse = {
    requestId: number;
};
export type SuccessResponse<T = unknown> = BaseResponse & {
    payload: T;
};
export type ErrorResponse = BaseResponse & {
    error: string;
};
export type Response<T = unknown> = SuccessResponse<T> | ErrorResponse;
export declare class WorkerError extends Error {
    readonly messageId: number;
    constructor(messageId: number, message: string);
}
export type PoolWorker = {
    terminate(): void;
    postMessage(message: Message, transfer: Transferable[]): void;
    addEventListener(type: 'message', listener: (ev: MessageEvent<Response>) => void): void;
    removeEventListener(type: 'message', listener: (ev: MessageEvent<Response>) => void): void;
};
export declare function createErrorResponse(requestId: number, error: unknown): Response;
export type BaseMessageMap<K extends string> = Record<K, {
    payload: unknown;
    response: unknown;
}>;
/**
 * A simple Web Worker pool that can select idle workers to perform work.
 *
 * Additionally, idle workers are terminated after a delay to free resources.
 *
 * @typeParam TMessageType - The type of the messages supported by the workers.
 * @typeParam TMessageMap - The map between request and response messages.
 */
export default class WorkerPool<TMessageType extends string, TMessageMap extends BaseMessageMap<TMessageType>> implements Disposable, Progress {
    private readonly _concurrency;
    private readonly _workers;
    private readonly _createWorker;
    private _disposed;
    private _terminationDelay;
    private _messageId;
    get loading(): boolean;
    get progress(): number;
    constructor(options: {
        /**
         * The function to create a worker.
         */
        createWorker: () => PoolWorker;
        /**
         * Optional concurrency (i.e max number of simultaneous workers)
         * @defaultValue `navigator.hardwareConcurrency`
         */
        concurrency?: number;
        /**
         * The delay, in milliseconds, after which an idle worker is terminated.
         * @defaultValue 10000
         */
        terminationDelay?: number;
    });
    /**
     * Sends a message to the first available worker, then waits for a response matching this
     * message's id, then returns this response, or throw an error if an error response is received.
     */
    queue<K extends keyof TMessageMap>(type: K, payload: TMessageMap[K]['payload'], transfer?: Transferable[]): Promise<TMessageMap[K]['response']>;
    /**
     * Terminates all workers.
     */
    dispose(): void;
    private startWorkerTerminationTimeout;
    private createWorker;
    private getWorker;
}
//# sourceMappingURL=WorkerPool.d.ts.map