// original code from https://github.com/jakesgordon/bin-packing
// MIT License

function findNode(root, w, h) {
  if (root.used === true) {
    const used = root;
    return findNode(used.right, w, h) || findNode(used.down, w, h);
  }
  if (w <= root.w && h <= root.h) {
    return root;
  }
  return null;
}
function splitNode(node, w, h) {
  node.used = true;
  node.down = {
    x: node.x,
    y: node.y + h,
    w: node.w,
    h: node.h - h
  };
  node.right = {
    x: node.x + w,
    y: node.y,
    w: node.w - w,
    h
  };
  return node;
}

// 2D Bin Packing algorithm (fit N random dimension blocks in a w * h rectangle) implementation
function fit(blocks, w, h, previousRoot) {
  const root = previousRoot || {
    x: 0,
    y: 0,
    w,
    h
  };
  let maxX = 0;
  let maxY = 0;
  for (const block of blocks) {
    const node = findNode(root, block.w, block.h);
    if (node) {
      block.fit = splitNode(node, block.w, block.h);
      maxX = Math.max(maxX, node.x + block.w);
      maxY = Math.max(maxY, node.y + block.h);
    }
  }
  return {
    maxX,
    maxY
  };
}
export default fit;