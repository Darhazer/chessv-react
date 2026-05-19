/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/RomanChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { General } from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/** Roman Chess — a 10×10 variant adding a non-royal "Archer" general. */
export class RomanChess extends Generic10x10 {
  archer!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Roman Chess';
    this.array = 'rnabqkbanr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNABQKBANR';
    this.pawnMultipleMove.value = 'Double';
    this.enPassant = true;
    this.castling.value = 'Standard';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRNBA';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.archer = new General('Archer', 'A', 325, 375)));
  }
}
