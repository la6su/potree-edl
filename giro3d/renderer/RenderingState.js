/**
 * The various states supported by a material (more precisely its fragment shader).
 */
var RenderingState = /*#__PURE__*/function (RenderingState) {
  RenderingState[RenderingState["FINAL"] = 0] = "FINAL";
  RenderingState[RenderingState["PICKING"] = 1] = "PICKING";
  return RenderingState;
}(RenderingState || {});
export default RenderingState;