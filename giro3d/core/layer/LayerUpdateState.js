var UpdateState = /*#__PURE__*/function (UpdateState) {
  UpdateState[UpdateState["IDLE"] = 0] = "IDLE";
  UpdateState[UpdateState["PENDING"] = 1] = "PENDING";
  UpdateState[UpdateState["ERROR"] = 2] = "ERROR";
  UpdateState[UpdateState["DEFINITIVE_ERROR"] = 3] = "DEFINITIVE_ERROR";
  UpdateState[UpdateState["FINISHED"] = 4] = "FINISHED";
  return UpdateState;
}(UpdateState || {});
const PAUSE_BETWEEN_ERRORS = [1.0, 3.0, 7.0, 60.0];

/**
 * LayerUpdateState is the update state of a layer, for a given object (e.g tile).
 * It stores information to allow smart update decisions, and especially network
 * error handling.
 */
class LayerUpdateState {
  constructor() {
    this.state = UpdateState.IDLE;
    this.lastErrorTimestamp = 0;
    this.errorCount = 0;
  }
  canTryUpdate(timestamp) {
    switch (this.state) {
      case UpdateState.IDLE:
        {
          return true;
        }
      case UpdateState.DEFINITIVE_ERROR:
      case UpdateState.PENDING:
      case UpdateState.FINISHED:
        {
          return false;
        }
      case UpdateState.ERROR:
      default:
        {
          const errorDuration = this.secondsUntilNextTry() * 1000;
          return errorDuration <= timestamp - this.lastErrorTimestamp;
        }
    }
  }
  secondsUntilNextTry() {
    if (this.state !== UpdateState.ERROR) {
      return 0;
    }
    const idx = Math.max(0, Math.min(this.errorCount, PAUSE_BETWEEN_ERRORS.length) - 1);
    return PAUSE_BETWEEN_ERRORS[idx];
  }
  newTry() {
    this.state = UpdateState.PENDING;
  }
  success() {
    this.failureParams = undefined;
    this.lastErrorTimestamp = 0;
    this.state = UpdateState.IDLE;
  }
  noMoreUpdatePossible() {
    this.failureParams = undefined;
    this.state = UpdateState.FINISHED;
  }
  failure(timestamp, definitive, failureParams) {
    this.failureParams = failureParams;
    this.lastErrorTimestamp = timestamp;
    this.state = definitive ? UpdateState.DEFINITIVE_ERROR : UpdateState.ERROR;
    this.errorCount++;
  }
  inError() {
    return this.state === UpdateState.DEFINITIVE_ERROR || this.state === UpdateState.ERROR;
  }
}
export default LayerUpdateState;