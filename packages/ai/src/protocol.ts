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
  | {
      type: 'init';
      variantId: string;
      /** Pre-game choices keyed by ChoiceVariable.displayName (e.g. army picks). */
      optionOverrides?: Record<string, string>;
      options?: Record<string, unknown>;
    }
  /**
   * Set the position by replaying moves from the variant's start position.
   * Each entry is a packed 32-bit `Movement` hash. Replaying (rather than
   * loading a FEN) keeps the worker's game state exactly consistent.
   */
  | { type: 'position'; moveHashes: number[] }
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
  /**
   * The chosen move, as a packed 32-bit `Movement` hash. The UI reconstructs
   * it with `Movement.fromHash` and plays it with `Game.makeMovement`.
   * `moveHash` is 0 when the search produced no move (game already over).
   */
  | { type: 'bestmove'; moveHash: number }
  | { type: 'error'; message: string };
