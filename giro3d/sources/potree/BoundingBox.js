import { Box3, Vector3 } from 'three';
export function toBox3(input) {
  const box = new Box3(new Vector3(input.lx, input.ly, input.lz), new Vector3(input.ux, input.uy, input.uz));
  return box;
}