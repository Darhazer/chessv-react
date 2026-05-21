/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/MoveCompletionRule.cs and
 *  ChessV.Base/MoveCompletionDefaultRule.cs.
 ***************************************************************************/

import type { FEN } from './fen.js';
import type { Game } from './game.js';
import type { MoveInfo } from './moveInfo.js';
import { Rule } from './rule.js';

/**
 * A game always has exactly one move-completion rule. It owns the turn order:
 * after each move it decides whose turn is next and tracks the turn number.
 *
 * The default rule alternates white/black; double-move variants (e.g.
 * Marseillais Chess) supply a custom one.
 */
export abstract class MoveCompletionRule extends Rule {
  /** The current turn number (counts a white move and a black move as one). */
  abstract get turnNumber(): number;

  /** Advance turn state after a move has been made. */
  abstract completeMove(move: MoveInfo, ply: number): void;

  /** Roll back turn state as a move is unmade. */
  abstract undoingMove(): void;

  /** The side to move after the current move completes. */
  abstract getNextSide(): number;
}

/**
 * The standard turn order: players alternate, the turn number increments each
 * time play returns to player 0.
 */
/** Pre-computed side-to-move hash contributions: 0 for white, all-ones for black. */
const SIDE_HASH: readonly [bigint, bigint] = [0n, (1n << 64n) - 1n];

export class MoveCompletionDefaultRule extends MoveCompletionRule {
  protected turnNumberValue = 0;

  override get turnNumber(): number {
    return this.turnNumberValue;
  }

  override getPositionHashCode(_ply: number): bigint {
    return SIDE_HASH[this.requireGame().currentSide as 0 | 1];
  }

  override completeMove(_move: MoveInfo, _ply: number): void {
    const game = this.requireGame();
    game.currentSide ^= 1;
    if (game.currentSide === 0) this.turnNumberValue++;
  }

  override undoingMove(): void {
    const game = this.requireGame();
    game.currentSide ^= 1;
    if (game.currentSide === 1) this.turnNumberValue--;
  }

  override getNextSide(): number {
    return this.requireGame().currentSide ^ 1;
  }

  override positionLoaded(fen: FEN): void {
    const game = this.requireGame();
    const turnNumber = Number.parseInt(fen.get('turn number'), 10);
    if (!Number.isInteger(turnNumber)) {
      throw new Error(`FEN parse error - invalid turn number specified: '${fen.get('turn number')}'`);
    }
    this.turnNumberValue = turnNumber;
    const currentPlayer = fen.get('current player');
    if (currentPlayer === 'w') {
      game.currentSide = 0;
    } else if (currentPlayer === 'b') {
      game.currentSide = 1;
    } else {
      throw new Error(`FEN parse error - invalid current player specified: '${currentPlayer}'`);
    }
  }

  override savePositionToFEN(fen: FEN): void {
    fen.set('turn number', String(this.turnNumberValue));
    fen.set('current player', this.requireGame().currentSide === 0 ? 'w' : 'b');
  }

  private requireGame(): Game {
    if (this.game === null) throw new Error('MoveCompletionDefaultRule used before initialization');
    return this.game;
  }
}
