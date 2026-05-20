/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2020 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/9x9/MinistersChess.cs
 ***************************************************************************/

import { MirrorSymmetry } from '@chessv/engine';
import { Generic9x9 } from '../abstract/generic9x9.js';

/**
 * Ministers Chess — Michael Corinthios's 1975 9×9 variant. The King is flanked
 * by two Ministers (Queens).
 */
export class MinistersChess extends Generic9x9 {
  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Ministers Chess';
    this.array = 'rnbmkmbnr/ppppppppp/9/9/9/9/9/PPPPPPPPP/RNBMKMBNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Long';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'MRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    // Rename the Queen to the Minister.
    this.queen.name = 'Minister';
    this.queen.setNotation('M');
  }
}
