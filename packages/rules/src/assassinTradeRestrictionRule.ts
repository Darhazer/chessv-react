/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Odyssey/AssassinTradeRestrictionRule.cs
 ***************************************************************************/

import {
  MoveEventResponse,
  type MoveInfo,
  MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Odyssey's Assassin can normally capture from a distance, but it cannot
 * voluntarily *trade* itself for another Assassin — if the captured
 * Assassin is protected and the attacker moves more than one square to
 * make the trade, the move is illegal. Hand-to-hand trades (1-square
 * moves) and trades where the target is unprotected stay legal.
 */
export class AssassinTradeRestrictionRule extends Rule {
  private readonly executionerType: PieceType;

  constructor(executionerType: PieceType) {
    super();
    this.executionerType = executionerType;
  }

  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    if (
      move.moveType !== MoveType.StandardCapture ||
      move.pieceMoved?.pieceType !== this.executionerType ||
      move.pieceCaptured?.pieceType !== this.executionerType
    ) {
      return MoveEventResponse.NotHandled;
    }
    const board = this.board!;
    const game = this.game!;
    const dx = Math.abs(board.getFile(move.fromSquare) - board.getFile(move.toSquare));
    const dy = Math.abs(board.getRank(move.fromSquare) - board.getRank(move.toSquare));
    if (dx > 1 || dy > 1) {
      // Long-range Assassin take: legal only if the victim was unprotected.
      if (game.isSquareAttacked(move.toSquare, move.pieceCaptured.player)) {
        return MoveEventResponse.IllegalMove;
      }
    }
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.executionerType) notes.push('piece trading restriction');
  }
}
