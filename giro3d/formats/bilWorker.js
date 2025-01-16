import { createErrorResponse } from '../utils/WorkerPool';
export function decodeRaster(bil, noData) {
  let min = +Infinity;
  let max = -Infinity;
  const data = new Float32Array(bil.length * 2); // For alpha channel;

  // NOTE for BIL format, we consider everything that is under noDataValue as noDataValue
  // this is consistent with the servers behaviour we tested but if you see services that
  // expects something different, don't hesitate to question the next loop
  for (let i = 0; i < bil.length; i++) {
    const value = bil[i];
    if (noData != null && value <= noData) {
      data[i * 2 + 0] = 0; // Elevation at zero by default
      data[i * 2 + 1] = 0; // Transparent pixel because no-data
    } else {
      data[i * 2 + 0] = value;
      data[i * 2 + 1] = 1;
      min = Math.min(value, min);
      max = Math.max(value, max);
    }
  }
  return {
    data: data.buffer,
    min,
    max
  };
}

// Web worker implementation

onmessage = function (ev) {
  const message = ev.data;
  try {
    if (message.type === 'DecodeBilTerrainMessage') {
      const result = decodeRaster(new Float32Array(message.payload.buffer), message.payload.noData);
      const response = {
        requestId: message.id,
        payload: result
      };
      this.postMessage(response, {
        transfer: [response.payload.data]
      });
    }
  } catch (err) {
    this.postMessage(createErrorResponse(message.id, err));
  }
};