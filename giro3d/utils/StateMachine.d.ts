export type TransitionCallback<S, T> = (params: {
    /** The object that this transition applies to. */
    value: T;
    /** The starting state of the transition. */
    from: S;
    /** The end state of the transition. */
    to: S;
}) => void;
export type Transition<T> = [T, T];
type State = number | string;
/**
 * A simple state machine that supports a list of legal transitions, as well as callbacks
 * to call before and after each transition.
 *
 * Note: self-transitions are implicitly legal, so they don't have to be specified in the list of
 * legal transitions.
 */
export default class StateMachine<S extends State, T extends {
    state: S;
}> {
    private readonly _legalTransitions;
    private readonly _postTransitionCallbacks;
    private readonly _preTransitionCallbacks;
    constructor(params: {
        /**
         * The list of legal transitions.
         */
        legalTransitions: Transition<S>[];
    });
    /**
     * Registers a callback that will be called on each object
     * that makes a transition to {@link endState}.
     */
    addPostTransitionCallback(endState: S, callback: TransitionCallback<S, T>): void;
    /**
     * Registers a callback that will be called on each object
     * that makes a transition from {@link fromState}.
     */
    addPreTransitionCallback(fromState: S, callback: TransitionCallback<S, T>): void;
    isTransitionLegal(from: S, to: S): boolean;
    /**
     * Transition the object from its current state to the specified target state, applying
     * relevant pre-transition and post-transition callbacks on the object.
     *
     * If the start and end states are the same, nothing happens,
     * unless `allowSelftransition` is true.
     *
     * @throws If the transition is illegal, throws an error.
     *
     * @returns True if a transition happened, false otherwise.
     */
    transition(obj: T, to: S, options?: {
        /** Allow transitioning from the same starting and end state. */
        allowSelfTransition?: boolean;
    }): boolean;
}
export {};
//# sourceMappingURL=StateMachine.d.ts.map