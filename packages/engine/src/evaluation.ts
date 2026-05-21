/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/Evaluation.cs
 ***************************************************************************/

import { MoveEventResponse } from './basics.js';
import type { Board } from './board.js';
import type { Game } from './game.js';
import type { MoveInfo } from './moveInfo.js';
import type { PieceType } from './pieceType.js';

/**
 * Base class for a game-specific evaluation term (pawn structure, development,
 * king safety, ...). A game owns a list of these; the search's `evaluate()`
 * lets each adjust the running midgame/endgame score.
 *
 * Every hook has a no-op default. The concrete evaluation classes from
 * ChessV.Games/Evaluations are ported alongside the variants that use them.
 */
export class Evaluation {
  protected game: Game | null = null;
  protected board: Board | null = null;

  /** Bind the evaluation to its game. Override to add setup, calling `super`. */
  initialize(game: Game): void {
    this.game = game;
    this.board = game.board;
  }

  /** Second-phase setup, after every evaluation has had {@link initialize}. */
  postInitialize(): void {}

  /** Apply PST-style variation, if the evaluation supports it. */
  setVariation(_randomness: number): void {}

  /** Release any large allocations. */
  releaseMemoryAllocations(): void {}

  /**
   * Adjust the running evaluation. `scratch[0]` is midgame, `scratch[1]` is
   * endgame; subclasses mutate the slots in place to avoid per-node allocation.
   */
  adjustEvaluation(_scratch: number[]): void {}

  /** React to a move being made. */
  moveBeingMade(_move: MoveInfo, _ply: number): void {}

  /** React to a move being unmade. */
  moveBeingUnmade(_move: MoveInfo, _ply: number): void {}

  /** Decide whether the game is won, lost or drawn. */
  testForWinLossDraw(_currentPlayer: number, _ply: number): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** Append human-readable notes about a piece type. */
  getNotesForPieceType(_type: PieceType, _notes: string[]): void {}
}
