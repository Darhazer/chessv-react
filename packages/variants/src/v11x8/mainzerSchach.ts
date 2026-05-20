/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/11x8/MainzerSchach.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and is deferred.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Amazon, Archbishop, Chancellor } from '@chessv/pieces';
import { Generic11x8 } from '../abstract/generic11x8.js';

/**
 * Mainzer Schach — Jörg Knappen's 2004 11×8 variant with the Janus
 * (Archbishop), Marshall (Chancellor) and Amazon.
 */
export class MainzerSchach extends Generic11x8 {
  archbishop!: PieceType;
  chancellor!: PieceType;
  amazon!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Mainzer Schach';
    this.array = 'rjbbqkmnnjr/ppppppppppp/11/11/11/11/PPPPPPPPPPP/RJBBQKMNNJR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Long';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'AQMJRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.archbishop = new Archbishop('Janus', 'J', 900, 900)));
    this.addPieceType((this.chancellor = new Chancellor('Marshall', 'M', 950, 950)));
    this.addPieceType((this.amazon = new Amazon('Amazon', 'A', 1500, 1600)));
  }
}
