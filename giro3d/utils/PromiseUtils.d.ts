/**
 * Returns a promise that will resolve after the specified duration.
 *
 * @param duration - The duration, in milliseconds.
 * @returns The promise.
 */
declare function delay(duration: number): Promise<void>;
export declare enum PromiseStatus {
    Fullfilled = "fulfilled",
    Rejected = "rejected"
}
export declare class AbortError extends Error {
    constructor();
}
/**
 * Returns an Error with the 'aborted' reason.
 *
 * @returns The error.
 */
declare function abortError(): Error;
declare const _default: {
    delay: typeof delay;
    PromiseStatus: typeof PromiseStatus;
    abortError: typeof abortError;
};
export default _default;
//# sourceMappingURL=PromiseUtils.d.ts.map