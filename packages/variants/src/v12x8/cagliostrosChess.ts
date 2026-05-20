/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x8/CagliostrosChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Amazon, Archbishop, Chancellor } from '@chessv/pieces';
import { Generic12x8 } from '../abstract/generic12x8.js';

/**
 * Cagliostro's Chess — Savio Cagliostro's 1970s 12×8 variant adding the
 * Archbishop, Chancellor and Amazon (here named "General").
 */
export class CagliostrosChess extends Generic12x8 {
  archbishop!: PieceType;
  chancellor!: PieceType;
  amazon!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = "Cagliostro's Chess";
    this.array = 'rnbacqkgabnr/pppppppppppp/12/12/12/12/PPPPPPPPPPPP/RNBACQKGABNR';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QCAGRNB';
    this.castling.value = '4-4';
    this.pawnDoubleMove = true;
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.archbishop = new Archbishop('Archbishop', 'A', 900, 900)));
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 950, 975)));
    this.addPieceType((this.amazon = new Amazon('General', 'G', 1250, 1250)));
  }
}
