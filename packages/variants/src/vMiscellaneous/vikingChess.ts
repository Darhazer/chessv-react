/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/MiscellaneousGames/VikingChess.cs
 ***************************************************************************/

import { NoSymmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { GenericChess } from '../abstract/genericChess.js';

/**
 * Viking Chess — a 12×7 asymmetric variant by Tomas Forsman (2002). Both
 * sides' pieces are interleaved across the bottom two ranks, with no
 * symmetry between the players; pieces and pawns advance toward the far
 * (high-rank) edge for both colors.
 */
export class VikingChess extends GenericChess {
  constructor() {
    super(12, 7, new NoSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Viking Chess';
    this.array = '12/12/12/12/1PPPP2pppp1/RPNNPPppnnpr/RBKQBPpbqkbr';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.rook = new Rook('Rook', 'R', 500, 550)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 325, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 325, 325)));
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 900, 1000)));
  }
}
