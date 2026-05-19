/**
 * @chessv/ai — alpha-beta search engine.
 *
 * Ports ChessV.Base Search / Evaluate / Hashtable / InternalEngine. The search
 * runs inside a Web Worker (see `worker.ts`) so the UI thread stays responsive.
 */

export type { FromWorker, ToWorker, TimeControl } from './protocol.js';
