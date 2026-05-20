/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/9x9/ChancellorChess.cs
 *
 *  Phase note: the C# `AddEvaluations` (rook-type) is evaluation only and is
 *  deferred.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Chancellor } from '@chessv/pieces';
import { Generic9x9 } from '../abstract/generic9x9.js';

/**
 * Chancellor Chess — Ben Foster's 1889 9×9 variant adding the Chancellor
 * (Rook + Knight).
 */
export class ChancellorChess extends Generic9x9 {
  chancellor!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chancellor Chess';
    this.array = 'rnbqkcnbr/ppppppppp/9/9/9/9/9/PPPPPPPPP/RNBQKCNBR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Standard';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QCRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 950, 900)));
  }
}
