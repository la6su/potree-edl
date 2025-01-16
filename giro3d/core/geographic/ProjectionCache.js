import proj4 from 'proj4';
import NestedMap from '../../utils/NestedMap';
const createConverter = (src, dst) => proj4(src, dst);
const cache = new NestedMap();

/**
 * Returns a coordinate converter from the specified source and destination CRSes.
 */
export function getConverter(crsIn, crsOut) {
  return cache.getOrCreate(crsIn, crsOut, createConverter);
}