/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/Shako.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Cannon, Elephant, Ferz } from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/**
 * Shako — Jean-Louis Cazaux's East-meets-West game adding the Xiangqi Cannon
 * and a stronger Elephant (a (2,2) leaper that also moves as a Ferz).
 */
export class Shako extends Generic10x10 {
  elephant!: PieceType;
  cannon!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Shako';
    this.array = 'c8c/ernbqkbnre/pppppppppp/10/10/10/10/PPPPPPPPPP/ERNBQKBNRE/C8C';
    this.pawnMultipleMove.value = 'Grand';
    this.castling.value = '2R Close-Rook';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRBNEC';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.cannon = new Cannon('Cannon', 'C', 400, 275)));
    this.elephant = new Elephant('Elephant', 'E', 225, 225);
    // Shako's Elephant also moves one step diagonally (as a Ferz).
    Ferz.addMoves(this.elephant);
    this.addPieceType(this.elephant);
  }
}
