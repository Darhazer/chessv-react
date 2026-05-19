/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/UnicornGreatChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Chancellor, Lion, Unicorn } from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/**
 * Unicorn Great Chess — David Paulowich's 10×10 variant adding the Lion
 * (Betza's HFD) and the Unicorn (Bishop + Nightrider).
 */
export class UnicornGreatChess extends Generic10x10 {
  unicorn!: PieceType;
  chancellor!: PieceType;
  lion!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Unicorn Great Chess';
    this.numberOfSquareColors = 3;
    this.array = 'crnbukbnrq/ppppllpppp/4pp4/10/10/10/10/4PP4/PPPPLLPPPP/CRNBUKBNRQ';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QCU';
    this.enPassant = true;
    this.pawnMultipleMove.value = 'Unicorn';
    this.castling.value = 'Close-Rook';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.unicorn = new Unicorn('Unicorn', 'U', 1050, 1125)));
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 925, 1000)));
    this.addPieceType((this.lion = new Lion('Lion', 'L', 450, 450)));
  }
}
