/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/MultiMove/DoubleMoveCompletionRule.cs
 *                            and MarseillaisMoveCompletionRule.cs.
 ***************************************************************************/

import {
  type FEN,
  type Game,
  HashKeys,
  MAX_GAME_LENGTH,
  MAX_PLY,
  MoveCompletionRule,
  MoveEventResponse,
  type MoveInfo,
  type Piece,
  type PieceType,
} from '@chessv/engine';
import { CheckmateRule } from './checkmateRule.js';

/**
 * The four-state machine shared by both multi-move rules. Index → notation:
 * 0 = `w2` (white's second of two), 1 = `w` (white's first), 2 = `b2`, 3 = `b`.
 * The initial state is 1, so the very first move of the game is a single
 * white move (matching the classical Marseillais convention).
 */
const STATE_NOTATIONS = ['w2', 'w', 'b2', 'b'] as const;

abstract class FourStateCompletionRule extends MoveCompletionRule {
  protected currentState = 1;
  protected turnNumberValue = 0;
  protected hashKeyIndex = 0;

  override get turnNumber(): number {
    return this.turnNumberValue;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.hashKeyIndex = game.hashKeys.takeKeys(STATE_NOTATIONS.length);
  }

  override getPositionHashCode(_ply: number): bigint {
    return HashKeys.Keys[this.hashKeyIndex + this.currentState]!;
  }

  override positionLoaded(fen: FEN): void {
    const game = this.requireGame();
    const turn = Number.parseInt(fen.get('turn number'), 10);
    if (!Number.isInteger(turn)) {
      throw new Error(
        `FEN parse error - invalid turn number specified: '${fen.get('turn number')}'`,
      );
    }
    this.turnNumberValue = turn;
    const notation = fen.get('current player');
    const index = STATE_NOTATIONS.indexOf(notation as (typeof STATE_NOTATIONS)[number]);
    if (index < 0) {
      throw new Error(`FEN parse error - invalid current player specified: '${notation}'`);
    }
    this.currentState = index;
    game.currentSide = Math.floor(index / 2);
  }

  override savePositionToFEN(fen: FEN): void {
    fen.set('turn number', String(this.turnNumberValue));
    fen.set('current player', STATE_NOTATIONS[this.currentState]!);
  }

  protected requireGame(): Game {
    if (this.game === null) throw new Error('MoveCompletionRule used before initialization');
    return this.game;
  }
}

/**
 * Doublemove Chess (Fred Galvin, 1957): white plays a single move on turn 1,
 * after which both sides play two consecutive moves per turn. No check —
 * the game is won by capturing the opponent's king (ExtinctionRule).
 */
export class DoubleMoveCompletionRule extends FourStateCompletionRule {
  override completeMove(_move: MoveInfo, _ply: number): void {
    const game = this.requireGame();
    this.currentState = (this.currentState + 1) % 4;
    if (this.currentState === 0) this.turnNumberValue++;
    game.currentSide = Math.floor(this.currentState / 2);
  }

  override undoingMove(): void {
    const game = this.requireGame();
    this.currentState = (this.currentState + 3) % 4;
    if (this.currentState === 3) this.turnNumberValue--;
    game.currentSide = Math.floor(this.currentState / 2);
  }

  override getNextSide(): number {
    return Math.floor(((this.currentState + 1) % 4) / 2);
  }
}

/**
 * Marseillais Chess (c. 1920): same four-state pattern as Doublemove, but
 * giving check ends the player's turn early. If the first of two moves
 * delivers check, the second move is forfeited.
 */
export class MarseillaisMoveCompletionRule extends FourStateCompletionRule {
  private royalPieceType: PieceType | null = null;
  private royalPieces: Array<Piece | null> = [];
  private nextState = 1;
  private searchStateHistory = new Int32Array(0);
  private searchStateHistoryIndex = 0;

  override initialize(game: Game): void {
    super.initialize(game);
    this.searchStateHistory = new Int32Array(MAX_GAME_LENGTH + MAX_PLY);
    this.searchStateHistoryIndex = 0;
    this.searchStateHistory[this.searchStateHistoryIndex++] = this.currentState;
    const checkmateRule = game.findRule(CheckmateRule);
    if (checkmateRule != null) {
      this.royalPieceType = checkmateRule.royalPieceType;
      this.royalPieces = new Array<Piece | null>(game.numPlayers).fill(null);
    }
  }

  override positionLoaded(fen: FEN): void {
    super.positionLoaded(fen);
    if (this.royalPieceType !== null) {
      const game = this.requireGame();
      for (let player = 0; player < game.numPlayers; player++) {
        const list = game.getPlayerPieceList(player);
        for (const piece of list) {
          if (piece.pieceType === this.royalPieceType) {
            this.royalPieces[player] = piece;
          }
        }
      }
    }
  }

  override moveBeingMade(_move: MoveInfo, _ply: number): MoveEventResponse {
    const game = this.requireGame();
    const currentSide = Math.floor(this.currentState / 2);
    this.nextState = (this.currentState + 1) % 4;
    // If the side that just moved is still on the move and the opponent's
    // royal piece is now in check, the second move is forfeited.
    if (Math.floor(this.nextState / 2) === currentSide && this.royalPieceType !== null) {
      const royal = this.royalPieces[currentSide ^ 1] ?? null;
      if (royal !== null && royal.square >= 0 && game.isSquareAttacked(royal.square, currentSide)) {
        this.nextState = (this.nextState + 1) % 4;
      }
    }
    return MoveEventResponse.MoveOk;
  }

  override completeMove(_move: MoveInfo, _ply: number): void {
    const game = this.requireGame();
    this.searchStateHistory[this.searchStateHistoryIndex++] = this.currentState;
    const previous = this.currentState;
    this.currentState = this.nextState;
    if (this.currentState < previous) this.turnNumberValue++;
    game.currentSide = Math.floor(this.currentState / 2);
  }

  override undoingMove(): void {
    const game = this.requireGame();
    const previous = this.currentState;
    this.currentState = this.searchStateHistory[--this.searchStateHistoryIndex]!;
    if (this.currentState > previous) this.turnNumberValue--;
    game.currentSide = Math.floor(this.currentState / 2);
  }

  override getNextSide(): number {
    return Math.floor(this.nextState / 2);
  }
}
