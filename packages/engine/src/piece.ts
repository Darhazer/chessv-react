/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/Piece.cs
 ***************************************************************************/

import { Location, SpecialAttacks } from './basics.js';
import type { Board } from './board.js';
import type { Game } from './game.js';
import { GenericPiece } from './genericPiece.js';
import type { MoveCapability } from './moveCapability.js';
import type { MoveList } from './moveList.js';
import type { PieceType } from './pieceType.js';

/**
 * A piece in play: a {@link GenericPiece} that also knows its game, its board,
 * the square it stands on and how many times it has moved.
 *
 * The move-generation routines here are the heart of the engine — they walk
 * the board's direction matrices to enumerate a piece's pseudo-legal moves.
 */
export class Piece extends GenericPiece {
  readonly game: Game;
  readonly board: Board;
  /** Game-specific sequential piece-type number. */
  typeNumber: number;
  /** Current square, or -1 if captured / off-board. */
  square: number;
  /** Total number of moves the piece has made this game. */
  moveCount = 0;

  constructor(game: Game, player: number, pieceType: PieceType, square: number) {
    super(player, pieceType);
    this.game = game;
    this.board = game.board;
    this.square = square;
    this.typeNumber = game.getPieceTypeNumber(pieceType);
  }

  /** Construct a board piece from a generic (type + player) description. */
  static fromGeneric(game: Game, generic: GenericPiece, square: number): Piece {
    return new Piece(game, generic.player, generic.pieceType, square);
  }

  get midgameValue(): number {
    return this.pieceType.midgameValue;
  }

  get endgameValue(): number {
    return this.pieceType.endgameValue;
  }

  /** The piece's current board location (throws if off-board). */
  get location(): Location {
    return this.board.squareToLocation(this.square);
  }
  set location(value: Location) {
    this.square = this.board.locationToSquare(value);
  }

  /** Maximum attack range in the given direction, from this player's frame. */
  getAttackRange(nDirection: number): number {
    return this.pieceType.attackRangePerDirection[
      this.game.playerDirection(this.player, nDirection)
    ]!;
  }

  /** Maximum cannon-style attack range in the given direction. */
  getCannonAttackRange(nDirection: number): number {
    return this.pieceType.cannonAttackRangePerDirection[
      this.game.playerDirection(this.player, nDirection)
    ]!;
  }

  /** Generate this piece's moves into `list`. */
  generateMoves(list: MoveList, capturesOnly: boolean): void {
    this.generateMovesAs(this.pieceType, list, capturesOnly);
  }

  /**
   * Generate moves assuming the piece is of `pieceType` (usually its own type;
   * useful for polymorphic pieces that move as other types).
   */
  generateMovesAs(pieceType: PieceType, list: MoveList, capturesOnly: boolean): void {
    // A custom generator runs first and decides whether default generation follows.
    if (pieceType.customMoveGenerator != null) {
      if (!pieceType.customMoveGenerator(pieceType, this, list, capturesOnly)) {
        return;
      }
    }

    const moves = pieceType.moveCapabilities;
    const count = pieceType.nMoveCapabilities;
    for (let n = 0; n < count; n++) {
      const move = moves[n]!;
      if (
        move.conditionalBySquare == null ||
        move.conditionalBySquare[this.player]!.isBitSet(this.square)
      ) {
        this.generateMovesForCapability(pieceType.simpleMoveGeneration, move, list, capturesOnly);
      }
    }
  }

  /** Enumerate the moves produced by a single capability. */
  generateMovesForCapability(
    simpleMoveGeneration: boolean,
    move: MoveCapability,
    list: MoveList,
    capturesOnly: boolean,
  ): void {
    if (simpleMoveGeneration) {
      // Fast path: plain slides and steps.
      let step = 1;
      let nextSquare = this.board.nextSquareForPlayer(this.player, move.nDirection, this.square);
      while (nextSquare >= 0 && step <= move.maxSteps) {
        const pieceOnSquare = this.board.pieceAt(nextSquare);
        if (pieceOnSquare != null) {
          if (step >= move.minSteps && move.canCapture && pieceOnSquare.player !== this.player) {
            list.addCapture(this.square, nextSquare);
          }
          nextSquare = -1;
        } else {
          if (step >= move.minSteps && !move.mustCapture && !capturesOnly) {
            list.addMove(this.square, nextSquare);
          }
          nextSquare = this.board.nextSquareForPlayer(this.player, move.nDirection, nextSquare);
          step++;
        }
      }
      return;
    }

    // Full path: cannon-style captures and path-constrained (lame-leaper) moves.
    let step = 1;
    let passedScreen = false;
    let nextSquare = this.board.nextSquareForPlayer(this.player, move.nDirection, this.square);
    while (nextSquare >= 0 && step <= move.maxSteps) {
      const pieceOnSquare = this.board.pieceAt(nextSquare);

      if (move.pathInfo != null) {
        if (pieceOnSquare == null && capturesOnly) return;
        if (pieceOnSquare != null && pieceOnSquare.player === this.player) return;
        if (step > 1 || move.specialAttacks !== 0 || move.pathInfo.allowMultiCapture) {
          throw new Error(
            `Piece type ${this.pieceType.name} has an unsupported movement capability`,
          );
        }
        for (const path of move.pathInfo.pathNDirections) {
          let pathSquare = this.square;
          let pathIsClear = true;
          for (const nDirection of path) {
            pathSquare = this.board.nextSquareForPlayer(this.player, nDirection, pathSquare);
            if (
              pathSquare < 0 ||
              (this.board.pieceAt(pathSquare) != null &&
                this.board.pieceAt(pathSquare) !== pieceOnSquare)
            ) {
              pathIsClear = false;
              break;
            }
          }
          if (pathIsClear) {
            if (pieceOnSquare != null && move.canCapture) {
              list.addCapture(this.square, nextSquare);
            } else if (pieceOnSquare == null) {
              list.addMove(this.square, nextSquare);
            }
            return;
          }
        }
        return;
      }

      if (pieceOnSquare != null) {
        if (
          step >= move.minSteps &&
          pieceOnSquare.player !== this.player &&
          (move.canCapture ||
            ((move.specialAttacks & SpecialAttacks.CannonCapture) !== 0 && passedScreen))
        ) {
          if (move.specialAttacks !== SpecialAttacks.RifleCapture) {
            list.addCapture(this.square, nextSquare);
          } else {
            list.addRifleCapture(this.square, nextSquare);
          }
        }
        if ((move.specialAttacks & SpecialAttacks.CannonCapture) !== 0 && !passedScreen) {
          passedScreen = true;
          nextSquare = this.board.nextSquareForPlayer(this.player, move.nDirection, nextSquare);
        } else {
          nextSquare = -1;
        }
      } else {
        if (step >= move.minSteps && !move.mustCapture && !capturesOnly && !passedScreen) {
          list.addMove(this.square, nextSquare);
        }
        nextSquare = this.board.nextSquareForPlayer(this.player, move.nDirection, nextSquare);
        step++;
      }
    }
  }
}
