/**
 * Describes how a layer is blended into the background (either another layer or the background
 * color).
 */
var BlendingMode = /*#__PURE__*/function (BlendingMode) {
  BlendingMode[BlendingMode["None"] = 0] = "None";
  BlendingMode[BlendingMode["Normal"] = 1] = "Normal";
  BlendingMode[BlendingMode["Add"] = 2] = "Add";
  BlendingMode[BlendingMode["Multiply"] = 3] = "Multiply";
  return BlendingMode;
}(BlendingMode || {});
export default BlendingMode;