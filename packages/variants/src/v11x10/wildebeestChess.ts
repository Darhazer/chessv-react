/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/11x10/WildebeestChess.cs
 *
 *  Phase note: the C# variant uses "Wildebeest" castling which requires the
 *  not-yet-ported FlexibleCastlingRule. Castling is therefore disabled in
 *  this port; everything else (Wildebeest pawn multi-move, Camel and
 *  Wildebeest pieces, loss-on-stalemate) works.
 ***************************************************************************/

import { RotationalSymmetry, type PieceType } from '@chessv/engine';
import { Camel, Wildebeest } from '@chessv/pieces';
import { Generic11x10 } from '../abstract/generic11x10.js';

/**
 * Wildebeest Chess — R. Wayne Schmittberger's 1987 11×10 variant balancing
 * leaping piece types with the Camel and the Wildebeest (Knight + Camel).
 */
export class WildebeestChess extends Generic11x10 {
  camel!: PieceType;
  wildebeest!: PieceType;

  constructor() {
    super(new RotationalSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Wildebeest Chess';
    this.array = 'rnccwkqbbnr/ppppppppppp/11/11/11/11/11/11/PPPPPPPPPPP/RNBBQKWCCNR';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QW';
    this.pawnMultipleMove.value = 'Wildebeest';
    // Castling "Wildebeest" needs the FlexibleCastlingRule — leave as 'None'.
    this.castling.value = 'None';
    this.enPassant = true;
    this.stalemateResult.value = 'Loss';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.camel = new Camel('Camel', 'C', 250, 250)));
    this.addPieceType((this.wildebeest = new Wildebeest('Wildebeest', 'W', 675, 675)));
  }
}
