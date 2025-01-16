import { Color } from 'three';
export function has(obj, prop) {
  if (obj == null) {
    return false;
  }
  return obj[prop] !== undefined;
}
export function isObject3D(obj) {
  return obj?.isObject3D;
}
export function isMesh(obj) {
  return obj?.isMesh;
}
export function isLight(obj) {
  return obj?.isLight;
}
export function isBufferGeometry(obj) {
  return obj?.isBufferGeometry;
}
export function isTexture(obj) {
  return obj?.isTexture;
}
export function isRenderTarget(obj) {
  return obj?.isRenderTarget;
}
export function isDataTexture(obj) {
  return obj?.isDataTexture;
}
export function isCanvasTexture(obj) {
  return obj?.isCanvasTexture;
}
export function isPerspectiveCamera(obj) {
  return obj?.isPerspectiveCamera;
}
export function isOrthographicCamera(obj) {
  return obj?.isOrthographicCamera;
}
export function isMaterial(obj) {
  return obj?.isMaterial;
}
export function isColor(obj) {
  return obj?.isColor;
}
export function isVector2(obj) {
  return obj?.isVector2;
}
export function isVector3(obj) {
  return obj?.isVector3;
}
export function isFiniteNumber(obj) {
  if (typeof obj === 'number' && Number.isFinite(obj)) {
    return true;
  }
  return false;
}
export function getColor(input) {
  if (isColor(input)) {
    return input;
  }
  return new Color(input);
}