import { getLazPerfPath } from './config';
// Note: this function has to be in its own file to avoid circular dependencies
// when using webpack (and possibly other bundlers)
// It cannot be in worker.ts nor in config.ts, unfortunately.

export default function createWorker() {
  const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module'
  });
  worker.postMessage({
    type: 'SetWasmPath',
    path: getLazPerfPath()
  });
  return worker;
}