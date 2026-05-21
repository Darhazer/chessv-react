/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/PieceLocationRestrictionRule.cs
 ***************************************************************************/

import {
  type ConditionalLocationDelegate,
  MoveEventResponse,
  type MoveList,
  type MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Bars a piece type from entering a region of the board. The predicate
 * receives the destination in the moving player's frame of reference, so
 * a single condition serves both sides. Used by Xiangqi to keep the king
 * in the palace, and by Eurasian Chess to keep the king on his side of
 * the river.
 */
export class PieceLocationRestrictionRule extends Rule {
  private readonly pieceType: PieceType;
  private readonly condition: ConditionalLocationDelegate;

  constructor(pieceType: PieceType, condition: ConditionalLocationDelegate) {
    super();
    this.pieceType = pieceType;
    this.condition = condition;
  }

  override moveBeingGenerated(
    _moves: MoveList,
    from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const board = this.board!;
    const piece = board.pieceAt(from);
    if (piece === null || piece.pieceType !== this.pieceType) return MoveEventResponse.NotHandled;
    const loc = board.squareToLocation(board.playerSquare(piece.player, to));
    if (this.condition(loc)) return MoveEventResponse.IllegalMove;
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.pieceType) notes.push('movement restricted by location');
  }
}
