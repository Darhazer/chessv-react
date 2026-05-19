/// <reference lib="webworker" />
/**
 * AI Web Worker entry point.
 *
 * Phase 2 wires this to the ported alpha-beta search. For now it only
 * acknowledges `init` so the message channel can be exercised end to end.
 */
import type { FromWorker, ToWorker } from './protocol.js';

function post(message: FromWorker): void {
  (self as DedicatedWorkerGlobalScope).postMessage(message);
}

self.addEventListener('message', (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      post({ type: 'ready' });
      break;
    default:
      // Phase 2: handle position / go / stop / setoption.
      break;
  }
});
