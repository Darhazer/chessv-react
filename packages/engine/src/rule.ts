/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/Rule.cs
 ***************************************************************************/

import { MoveEventResponse, MoveNotation } from './basics.js';
import type { Board } from './board.js';
import type { FEN } from './fen.js';
import type { Game } from './game.js';
import type { MoveInfo } from './moveInfo.js';
import type { MoveList } from './moveList.js';
import type { MoveType } from './basics.js';
import type { PieceType } from './pieceType.js';

/**
 * A configurable, pluggable rule that can be attached to a game.
 *
 * Separating game rules into reusable modules is what makes defining new
 * variants tractable — most variants are combinations of the same handful of
 * rules. The game class deliberately cannot override move generation directly;
 * all such behaviour flows through rules and their hooks below.
 *
 * Every hook has a no-op default, so a concrete rule overrides only what it
 * needs. Hooks returning {@link MoveEventResponse} default to `NotHandled`.
 */
export class Rule {
  board: Board | null = null;
  game: Game | null = null;

  /** Bind the rule to its game. Override to add setup, calling `super`. */
  initialize(game: Game): void {
    this.game = game;
    this.board = game.board;
  }

  /** Second-phase setup, after every rule has had {@link initialize}. */
  postInitialize(): void {}

  /** Reset any per-game transient state. */
  clearGameState(): void {}

  /** Release any large allocations held by the rule. */
  releaseMemoryAllocations(): void {}

  /** Called after a position has been loaded from FEN. */
  positionLoaded(_fen: FEN): void {}

  /** Fill in this rule's defaults on a FEN that omits them. */
  setDefaultsInFEN(_fen: FEN): void {}

  /** Write this rule's state into a FEN being generated. */
  savePositionToFEN(_fen: FEN): void {}

  /** Called when the rule is removed from a game. */
  ruleRemoved(): void {}

  /** Extra contribution to the position hash for this ply. */
  getPositionHashCode(_ply: number): bigint {
    return 0n;
  }

  /** Veto or transform a move as it is generated. */
  moveBeingGenerated(
    _moves: MoveList,
    _from: number,
    _to: number,
    _type: MoveType,
  ): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** React to a move being made (may reject it as illegal). */
  moveBeingMade(_move: MoveInfo, _ply: number): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** React after a move has been made. */
  moveMade(_move: MoveInfo, _ply: number): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** React to a move being unmade. */
  moveBeingUnmade(_move: MoveInfo, _ply: number): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** Report whether the rule considers `square` attacked by `side`. */
  isSquareAttacked(_square: number, _side: number): boolean {
    return false;
  }

  /** Decide whether the game is won, lost or drawn. */
  testForWinLossDraw(_currentPlayer: number, _ply: number): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** Decide the result when the side to move has no legal moves. */
  noMovesResult(_currentPlayer: number, _ply: number): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }

  /** Generate moves not produced by normal piece movement (castling, drops...). */
  generateSpecialMoves(_list: MoveList, _capturesOnly: boolean, _ply: number): void {}

  /** Adjust the evaluation; returns the new midgame/endgame pair. */
  adjustEvaluation(_ply: number, midgameEval: number, endgameEval: number): [number, number] {
    return [midgameEval, endgameEval];
  }

  /** Produce a textual description of a move; returns it via the result. */
  describeMove(
    _move: MoveInfo,
    _format: MoveNotation,
    description: string,
  ): { response: MoveEventResponse; description: string } {
    return { response: MoveEventResponse.NotHandled, description };
  }

  /** Extra search depth to grant in this position. */
  positionalSearchExtension(_currentPlayer: number, _ply: number): number {
    return 0;
  }

  /** Append human-readable notes about a piece type. */
  getNotesForPieceType(_type: PieceType, _notes: string[]): void {}
}

/**
 * Marker subclass for rules whose primary concern is promotion. Carries no
 * behaviour of its own — it lets the game identify promotion rules.
 */
export class PromotionRule extends Rule {}
