import { Texture } from 'three';
export default class EmptyTexture extends Texture {
  isEmptyTexture = true;
  constructor() {
    super();
  }
}
export function isEmptyTexture(obj) {
  return obj?.isEmptyTexture;
}