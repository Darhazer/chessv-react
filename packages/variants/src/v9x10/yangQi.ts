/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/9x10/YangQi.cs
 *
 *  Yang Qi doesn't use any castling, so this file skips porting the C#
 *  Generic9x10 castling base class and extends Generic__x10 directly.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Bishop, Cannon, Knight, Queen, Rook, Vao } from '@chessv/pieces';
import { YangQiKingSwapRule } from '@chessv/rules';
import { Generic__x10 } from '../abstract/generic__x10.js';

/**
 * Yáng Qí — Fergus Duniho, 2001. A 9×10 hybrid: Western pieces (rook,
 * bishop, knight) plus Chinese-style cannons; the king has the swap
 * ability with adjacent non-pawn pieces. Pawns promote by replacement.
 */
export class YangQi extends Generic__x10 {
  cannon!: PieceType;
  vao!: PieceType;
  // Advisor — Vao with notation 'A'; "Arrow" in Yáng Qí.
  advisor!: PieceType;

  constructor() {
    super(9, new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Yáng Qí';
    this.array = 'rnbakabnr/1c5c1/p1p1p1p1p/1p1p1p1p1/9/9/1P1P1P1P1/P1P1P1P1P/1C5C1/RNBAKABNR';
    this.pawnMultipleMove.value = 'Grand';
    this.promotionRule.value = 'Replacement';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.king.pstMidgameForwardness = 0;
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 600)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 350, 400)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 275, 275)));
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1000, 1100)));
    this.addPieceType((this.cannon = new Cannon('Cannon', 'C', 400, 275)));
    this.addPieceType((this.advisor = new Vao('Arrow', 'A', 300, 175)));
    this.vao = this.advisor;
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new YangQiKingSwapRule(this.king, this.pawn));
  }
}
