import fit from './Packer';

/**
 * An atlas image.
 */

/**
 * Build a texture atlas from N images.
 *
 * @param maxSize - The maximum texture size of the atlas, in pixels.
 * @param images - The images to pack.
 * @param oldAtlas - The previous atlas.
 */
function pack(maxSize, images, oldAtlas) {
  const blocks = [];
  for (let i = 0; i < images.length; i++) {
    if (oldAtlas && images[i].id in oldAtlas) {
      continue;
    }
    const sWidth = images[i].size.width;
    const sHeight = images[i].size.height;
    blocks.push({
      layerId: images[i].id,
      w: Math.min(maxSize, sWidth),
      h: Math.min(maxSize, sHeight)
    });
  }

  // sort from big > small images (the packing alg works best if big images are treated first)
  // @ts-expect-error (we ignore the typing error of casting booleans to numbers to maintain speed)
  blocks.sort((a, b) => Math.max(a.w, a.h) < Math.max(b.w, b.h));
  let previousRoot = null;
  if (oldAtlas) {
    for (const k of Object.keys(oldAtlas)) {
      const fitResult = oldAtlas[k];
      if (fitResult.x === 0 && fitResult.y === 0) {
        // Updating
        previousRoot = fitResult;
        break;
      }
    }
  }
  if (oldAtlas && !previousRoot) {
    throw new Error('oldAtlas is defined, but not previousRoot');
  }
  const {
    maxX,
    maxY
  } = fit(blocks, maxSize, maxSize, previousRoot);
  const atlas = oldAtlas || {};
  for (let i = 0; i < blocks.length; i++) {
    // @ts-expect-error invalid
    atlas[blocks[i].layerId] = {
      ...blocks[i].fit,
      offset: 0
    };
  }
  return {
    atlas,
    maxX,
    maxY
  };
}
export default {
  pack
};