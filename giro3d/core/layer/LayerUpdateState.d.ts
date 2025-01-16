declare enum UpdateState {
    IDLE = 0,
    PENDING = 1,
    ERROR = 2,
    DEFINITIVE_ERROR = 3,
    FINISHED = 4
}
/**
 * LayerUpdateState is the update state of a layer, for a given object (e.g tile).
 * It stores information to allow smart update decisions, and especially network
 * error handling.
 */
declare class LayerUpdateState {
    state: UpdateState;
    lastErrorTimestamp: number;
    errorCount: number;
    failureParams?: unknown;
    constructor();
    canTryUpdate(timestamp: number): boolean;
    secondsUntilNextTry(): 0 | 3 | 1 | 7 | 60;
    newTry(): void;
    success(): void;
    noMoreUpdatePossible(): void;
    failure(timestamp: number, definitive: boolean, failureParams?: unknown): void;
    inError(): boolean;
}
export default LayerUpdateState;
//# sourceMappingURL=LayerUpdateState.d.ts.map