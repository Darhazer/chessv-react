/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x12/GrossChess.cs
 ***************************************************************************/

import { type Location, MirrorSymmetry, type PieceType } from '@chessv/engine';
import {
  Archbishop,
  Cannon,
  Champion,
  Chancellor,
  Vao,
  Wizard,
} from '@chessv/pieces';
import { GrossChessPromotionRule, PromotionOption } from '@chessv/rules';
import { Generic12x12 } from '../abstract/generic12x12.js';

/**
 * Gross Chess — Fergus Duniho, 2009. A 12×12 super-variant with two ranks
 * of pieces per side (Marshall, Archbishop, Vao, Wizard, Cannon, Champion,
 * plus the standard set). Uses second-rank close-rook flexible castling,
 * a custom multi-rank promotion zone with per-rank target restrictions,
 * and the Generic__x12 "@3(2,3)" pawn-double-or-triple move.
 */
export class GrossChess extends Generic12x12 {
  archbishop!: PieceType;
  chancellor!: PieceType;
  cannon!: PieceType;
  vao!: PieceType;
  wizard!: PieceType;
  champion!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Gross Chess';
    this.array =
      'mavwc2cwvam/1rsnbqkbnsr1/pppppppppppp/12/12/12/12/12/12/PPPPPPPPPPPP/1RSNBQKBNSR1/MAVWC2CWVAM';
    this.castling.value = '2R Close-Rook Flexible';
    this.promotionRule.value = 'Custom';
    this.pawnMultipleMove.value = '@3(2,3)';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.chancellor = new Chancellor('Marshall', 'M', 1000, 1050)));
    this.addPieceType((this.archbishop = new Archbishop('Archbishop', 'A', 850, 900)));
    this.addPieceType((this.cannon = new Cannon('Cannon', 'C', 500, 250)));
    this.addPieceType((this.vao = new Vao('Vao', 'V', 350, 150)));
    this.addPieceType((this.wizard = new Wizard('Wizard', 'W', 600, 550)));
    this.addPieceType((this.champion = new Champion('Champion', 'S', 600, 600)));
  }

  protected override addRules(): void {
    super.addRules();
    const rule = new GrossChessPromotionRule(
      this.pawn,
      (loc: Location) =>
        loc.rank === 11
          ? PromotionOption.MustPromote
          : loc.rank === 9 || loc.rank === 10
            ? PromotionOption.CanPromote
            : PromotionOption.CannotPromote,
      () => ({
        queen: this.queen,
        rook: this.rook,
        bishop: this.bishop,
        knight: this.knight,
        wizard: this.wizard,
        vao: this.vao,
        archbishop: this.archbishop,
        chancellor: this.chancellor,
      }),
    );
    this.addRule(rule);
  }
}
