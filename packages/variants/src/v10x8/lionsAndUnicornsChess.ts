/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/LionsAndUnicornsChess.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and is deferred.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Chancellor, Lion, Unicorn } from '@chessv/pieces';
import { Generic10x8 } from '../abstract/generic10x8.js';

/**
 * Lions and Unicorns Chess — David Paulowich's 2005 10×8 variant adding the
 * Lion (Betza's HFD) and the Unicorn (Bishop + Nightrider).
 */
export class LionsAndUnicornsChess extends Generic10x8 {
  unicorn!: PieceType;
  chancellor!: PieceType;
  lion!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Lions and Unicorns Chess';
    this.numberOfSquareColors = 3;
    this.array = 'lrcbqkburl/nppppppppn/10/10/10/10/NPPPPPPPPN/LRCBQKBURL';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QCU';
    this.castling.value = 'Close-Rook';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.unicorn = new Unicorn('Unicorn', 'U', 1050, 1125)));
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 1050, 1125)));
    this.addPieceType((this.lion = new Lion('Lion', 'L', 400, 400)));
  }
}
