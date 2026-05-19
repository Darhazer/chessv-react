/**
 * Message protocol between the UI thread and the AI Web Worker.
 *
 * Ports the role of ChessV.Base/InternalEngine + Match: the worker reconstructs
 * a Game from a variant id + FEN, searches, and streams back thinking info.
 */

/** Time/search budget for one `go` request. Ports ChessV.Base/TimeControl. */
export interface TimeControl {
  /** Search until stopped (analysis mode). */
  infinite?: boolean;
  /** Base time per side, in milliseconds. */
  baseTimeMs?: number;
  /** Fischer increment added each move, in milliseconds. */
  incrementMs?: number;
  /** Fixed thinking time per move, in milliseconds. */
  moveTimeMs?: number;
  /** Hard depth cap (plies). */
  maxDepth?: number;
  /** Hard node cap. */
  maxNodes?: number;
}

/** Messages sent from the UI thread to the worker. */
export type ToWorker =
  | { type: 'init'; variantId: string; options?: Record<string, unknown> }
  | { type: 'position'; fen: string; moves?: string[] }
  | { type: 'go'; timeControl: TimeControl }
  | { type: 'stop' }
  | { type: 'setoption'; name: string; value: unknown };

/** Messages sent from the worker back to the UI thread. */
export type FromWorker =
  | { type: 'ready' }
  | {
      type: 'info';
      depth: number;
      score: number;
      nodes: number;
      nps: number;
      pv: string[];
    }
  | { type: 'bestmove'; move: string }
  | { type: 'error'; message: string };
