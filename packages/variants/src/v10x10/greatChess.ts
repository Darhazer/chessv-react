/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/GreatChess.cs
 *
 *  Phase note: only the "Classic" variant is ported; the "Faster Pawns" forms
 *  are simple variations deferred with the variant-selection UI.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Amazon, Archbishop, Chancellor } from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/** Great Chess — a historic 10×10 variant from the 1700s. */
export class GreatChess extends Generic10x10 {
  general!: PieceType;
  archbishop!: PieceType;
  chancellor!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Great Chess';
    this.array = 'rnbqkgabnr/ppppccpppp/4pp4/10/10/10/10/4PP4/PPPPCCPPPP/RNBQKGABNR';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'Q';
    this.pawnMultipleMove.value = 'None';
    this.enPassant = false;
    this.castling.value = 'None';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.archbishop = new Archbishop('Archbishop', 'A', 750, 800)));
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 925, 1000)));
    this.addPieceType((this.general = new Amazon('General', 'G', 1400, 1500)));
  }
}
