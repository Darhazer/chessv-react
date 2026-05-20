/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/9x9/Warochess.cs
 ***************************************************************************/

import { RotationalSymmetry } from '@chessv/engine';
import { Generic9x9 } from '../abstract/generic9x9.js';

/**
 * Warochess — Eric Warolus's 2010 9×9 variant. A totally symmetric layout
 * adding a Queen with an extra pawn in front; standard chess rules apply but
 * without castling.
 */
export class Warochess extends Generic9x9 {
  constructor() {
    super(new RotationalSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Warochess';
    this.array = 'rbnqkqbnr/ppppppppp/9/9/9/9/9/PPPPPPPPP/RNBQKQNBR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'None';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
  }
}
