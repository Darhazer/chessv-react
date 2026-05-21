/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/YangQi/YangQiKingSwapRule.cs
 ***************************************************************************/

import {
  type MoveList,
  MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Yáng Qí's king-swap: when the king is not in check, it may swap places
 * with any adjacent friendly piece other than a pawn. The checkmate rule
 * will reject the move if the new king-square turns out to be attacked.
 */
export class YangQiKingSwapRule extends Rule {
  private readonly kingType: PieceType;
  private readonly pawnType: PieceType;
  private kingTypeNumber = -1;

  constructor(kingType: PieceType, pawnType: PieceType) {
    super();
    this.kingType = kingType;
    this.pawnType = pawnType;
  }

  override postInitialize(): void {
    super.postInitialize();
    this.kingTypeNumber = this.game!.getPieceTypeNumber(this.kingType);
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, _ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const king = board.getPieceTypeBitboard(game.currentSide, this.kingTypeNumber).lsb;
    if (king < 0) return;
    if (game.isSquareAttacked(king, game.currentSide ^ 1)) return;

    for (let dir = 0; dir < 8; dir++) {
      const target = board.nextSquare(dir, king);
      if (target < 0) continue;
      const piece = board.pieceAt(target);
      if (piece == null) continue;
      if (piece.player !== game.currentSide) continue;
      if (piece.pieceType === this.pawnType) continue;
      list.beginMoveAdd(MoveType.Swap, king, target);
      const kingPiece = list.addPickup(king);
      const otherPiece = list.addPickup(target);
      list.addDrop(kingPiece, target, null);
      list.addDrop(otherPiece, king, null);
      list.endMoveAdd(0);
    }
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.kingType) notes.push('swap ability');
  }
}
