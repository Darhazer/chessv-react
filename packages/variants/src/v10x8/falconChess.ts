/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/FalconChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Falcon } from '@chessv/pieces';
import { Generic10x8 } from '../abstract/generic10x8.js';

/**
 * Falcon Chess — George Duke, 1992. A 10×8 variant introducing the
 * Falcon, a multi-path leaper that completes a three-step "knight-plus"
 * journey if any of the three relevant unit-step paths is unobstructed.
 */
export class FalconChess extends Generic10x8 {
  falcon!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Falcon Chess';
    this.array = 'rnbfqkfbnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNBFQKFBNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Flexible';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'RBNF';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.falcon = new Falcon('Falcon', 'F', 600, 650)));
  }
}
