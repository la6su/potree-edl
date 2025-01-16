function traversePickingCircle(radius, callback) {
  // iterate on radius so we get closer to the mouse
  // results first.
  // Result traversal order for radius=2
  // --3--
  // -323-
  // 32123
  // -323
  // --3--
  let prevSq = undefined;
  for (let r = 0; r <= radius; r++) {
    const sq = r * r;
    for (let x = -r; x <= r; x++) {
      const sqx = x * x;
      for (let y = -r; y <= r; y++) {
        const dist = sqx + y * y;
        // skip if too far
        if (dist > sq) {
          continue;
        }
        // skip if belongs to previous
        if (prevSq != null && dist <= prevSq) {
          continue;
        }
        const realX = radius + x;
        const realY = radius + y;
        if (callback(realX, realY, realY * (2 * radius) + realX) === false) {
          return;
        }
      }
    }
    prevSq = sq;
  }
}
export default traversePickingCircle;