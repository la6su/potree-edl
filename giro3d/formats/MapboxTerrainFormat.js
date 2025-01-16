import { DataTexture, FloatType, LinearFilter, RGFormat } from 'three';
import WorkerPool from '../utils/WorkerPool';
import ImageFormat from './ImageFormat';
import { decodeMapboxTerrainImage } from './mapboxWorker';
let workerPool = null;
function createWorker() {
  return new Worker(new URL('./mapboxWorker.js', import.meta.url), {
    type: 'module',
    name: 'mapbox'
  });
}

/**
 * Decoder for [Mapbox Terrain](https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-dem-v1/) images.
 */
class MapboxTerrainFormat extends ImageFormat {
  isMapboxTerrainFormat = true;
  type = 'MapboxTerrainFormat';
  _enableWorkers = true;

  /**
   * @param options - Decoder options.
   */
  constructor(options) {
    super(true, FloatType);
    this._enableWorkers = options?.enableWorkers ?? true;
  }

  /**
   * Decode a Mapbox Terrain blob into a
   * [DataTexture](https://threejs.org/docs/?q=texture#api/en/textures/DataTexture) containing
   * the elevation data.
   *
   * @param blob - the data to decode
   * @param options - the decoding options
   */
  async decode(blob, options) {
    let result;
    if (this._enableWorkers) {
      result = await this.getHeightValuesUsingWorker(blob, options?.noDataValue);
    } else {
      result = await decodeMapboxTerrainImage(blob, options?.noDataValue);
    }
    const texture = new DataTexture(new Float32Array(result.data), result.width, result.height, RGFormat, FloatType);
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    return {
      texture,
      min: result.min,
      max: result.max
    };
  }
  async getHeightValuesUsingWorker(blob, noData) {
    if (workerPool == null) {
      workerPool = new WorkerPool({
        createWorker
      });
    }
    const buffer = await blob.arrayBuffer();
    const result = await workerPool.queue('DecodeMapboxTerrainMessage', {
      buffer,
      noData
    }, [buffer]);
    return result;
  }
}
export default MapboxTerrainFormat;