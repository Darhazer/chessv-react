/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/OptionalCaptureByOvertakeRule.cs
 ***************************************************************************/

import {
  MoveEventResponse,
  type MoveList,
  MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Pieces in `affectedTypes` may, in addition to the normal move/capture,
 * scoop up *any subset* of enemy pieces sitting between them and their
 * destination on a straight line. Every non-empty subset becomes an
 * additional move. Used by Chess and a Half's Cat and Star Cat.
 *
 * Move types emitted:
 *  - `MoveType.ExtraCapture` when exactly one extra piece is taken;
 *  - `MoveType.CustomMove` when more than one. `move.tag` holds the bit
 *    pattern of intermediate squares being captured (bit n → the (n+1)-th
 *    square along the line from `from` to `to`).
 */
export class OptionalCaptureByOvertakeRule extends Rule {
  private readonly affectedTypes: PieceType[];

  constructor(affectedTypes: PieceType[]) {
    super();
    this.affectedTypes = affectedTypes;
  }

  override moveBeingGenerated(
    moves: MoveList,
    from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const board = this.board!;
    const piece = board.pieceAt(from);
    if (piece === null || !this.affectedTypes.includes(piece.pieceType)) {
      return MoveEventResponse.NotHandled;
    }
    const direction = board.directionFromTo(from, to);
    if (direction < 0) return MoveEventResponse.NotHandled;

    let victims = 0;
    let nSteps = 1;
    let nextSquare = board.nextSquare(direction, from);
    while (nextSquare !== to && nSteps <= 8 && nextSquare >= 0) {
      const occupant = board.pieceAt(nextSquare);
      if (occupant !== null && occupant.player !== piece.player) {
        victims |= 1 << (nSteps - 1);
      }
      nextSquare = board.nextSquare(direction, nextSquare);
      nSteps++;
    }
    if (victims !== 0) {
      this.generatePermutations(moves, from, to, victims, 0);
    }
    // Always NotHandled — we want normal move generation to continue.
    return MoveEventResponse.NotHandled;
  }

  private generatePermutations(
    moves: MoveList,
    from: number,
    to: number,
    pendingBits: number,
    activeBits: number,
  ): void {
    if (pendingBits === 0) {
      if (activeBits === 0) return;
      const board = this.board!;
      const moveType =
        (activeBits & (activeBits - 1)) === 0 ? MoveType.ExtraCapture : MoveType.CustomMove;
      let eval_ = 2000 + (board.pieceAt(to)?.pieceType.midgameValue ?? 0);
      moves.beginMoveAdd(moveType, from, to, activeBits);
      const movingPiece = moves.addPickup(from);
      if (board.pieceAt(to) !== null) moves.addPickup(to);
      const direction = board.directionFromTo(from, to);
      let nSteps = 1;
      let nextSquare = board.nextSquare(direction, from);
      let remaining = activeBits;
      while (nextSquare !== to && remaining !== 0) {
        if ((remaining & (1 << (nSteps - 1))) !== 0) {
          moves.addPickup(nextSquare);
          if (moveType === MoveType.ExtraCapture) moves.setMoveTag(nextSquare);
          eval_ += board.pieceAt(nextSquare)?.pieceType.midgameValue ?? 0;
          remaining ^= 1 << (nSteps - 1);
        }
        nextSquare = board.nextSquare(direction, nextSquare);
        nSteps++;
      }
      moves.addDrop(movingPiece, to, null);
      moves.endMoveAdd(eval_);
      return;
    }
    const lowest = pendingBits & -pendingBits;
    const newPending = pendingBits ^ lowest;
    // Both branches: with and without the lowest bit.
    this.generatePermutations(moves, from, to, newPending, activeBits);
    this.generatePermutations(moves, from, to, newPending, activeBits | lowest);
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (this.affectedTypes.includes(type)) notes.push('optional capture by overtake');
  }
}
