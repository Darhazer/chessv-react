/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/LemurianShatranj.cs
 ***************************************************************************/

import { MirrorSymmetry, type Location, type PieceType } from '@chessv/engine';
import { BentHero, BentShaman, SlidingGeneral, WarElephant } from '@chessv/pieces';
import {
  ColorboundPromotionRestrictionRule,
  ComplexPromotionRule,
  PromotionOption,
} from '@chessv/rules';
import { Generic8x8 } from '../abstract/generic8x8.js';

/**
 * Lemurian Shatranj — Joe Joyce, 2006. A Shatranj-themed 8×8 variant with
 * four multi-path pieces (Sliding General, Bent Shaman, Bent Hero, War
 * Elephant). Pawns must promote on the back rank, but only into a piece
 * type the player has already lost (and the ColorboundPromotionRestriction
 * keeps the colour-bound types on opposite squares).
 */
export class LemurianShatranj extends Generic8x8 {
  slidingGeneral!: PieceType;
  bentShaman!: PieceType;
  bentHero!: PieceType;
  warElephant!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Lemurian Shatranj';
    this.array = 'whsgkshw/pppppppp/8/8/8/8/PPPPPPPP/WHSGKSHW';
    this.promotionRule.value = 'Custom';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType(
      (this.slidingGeneral = new SlidingGeneral('Sliding General', 'G', 1000, 1100)),
    );
    this.addPieceType((this.bentShaman = new BentShaman('Bent Shaman', 'S', 600, 650)));
    this.addPieceType((this.bentHero = new BentHero('Bent Hero', 'H', 750, 750)));
    this.addPieceType((this.warElephant = new WarElephant('War Elephant', 'W', 475, 475)));
  }

  protected override addRules(): void {
    super.addRules();
    const promotionTypes = [this.slidingGeneral];
    const replacementTypes = [this.bentShaman, this.bentHero, this.warElephant];
    const rule = new ComplexPromotionRule();
    rule.addPromotionCapability(this.pawn, promotionTypes, replacementTypes, (loc: Location) =>
      loc.rank === 7 ? PromotionOption.MustPromote : PromotionOption.CannotPromote,
    );
    this.addRule(rule);
    this.addRule(new ColorboundPromotionRestrictionRule());
  }
}
