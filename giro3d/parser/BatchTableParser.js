import utf8Decoder from '../utils/Utf8Decoder';
export default {
  /**
   * Parse batch table buffer and convert to JSON
   *
   * @param buffer - the batch table buffer.
   * @returns a promise that resolves with a JSON object.
   */
  parse(buffer) {
    const content = utf8Decoder.decode(new Uint8Array(buffer));
    const json = JSON.parse(content);
    return Promise.resolve(json);
  }
};