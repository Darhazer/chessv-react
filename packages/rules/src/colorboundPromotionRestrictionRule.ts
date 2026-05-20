/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/ColorboundPromotionRestrictionRule.cs
 ***************************************************************************/

import {
  MoveEventResponse,
  type MoveInfo,
  MoveType,
  moveTypeHasProperty,
  Rule,
} from '@chessv/engine';

/**
 * Rejects a promotion / replacement that would leave the player with two
 * pieces of the same colour-bound type on the same slice (e.g. two
 * dark-squared bishops). Inspected post-make: by the time this rule runs,
 * the promoted piece is already on the destination; if any other piece of
 * the same type sits in the same slice, the move is illegal.
 *
 * Used by Lemurian Shatranj's promotion zone to keep the player's
 * dabbabahs / bishops on opposite colours.
 */
export class ColorboundPromotionRestrictionRule extends Rule {
  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    if (
      !moveTypeHasProperty(move.moveType, MoveType.PromotionProperty) &&
      (move.moveType & MoveType.Replace) === 0
    ) {
      return MoveEventResponse.NotHandled;
    }
    const board = this.board!;
    const piece = board.pieceAt(move.toSquare);
    if (piece === null) return MoveEventResponse.NotHandled;
    const pieceType = piece.pieceType;
    if (pieceType.numSlices <= 1) return MoveEventResponse.NotHandled;

    const bitboard = board.getPieceTypeBitboard(piece.player, piece.typeNumber);
    const targetSlice = pieceType.sliceLookup[move.toSquare];
    for (const sq of bitboard) {
      if (sq === move.toSquare) continue;
      if (pieceType.sliceLookup[sq] === targetSlice) return MoveEventResponse.IllegalMove;
    }
    return MoveEventResponse.NotHandled;
  }
}
