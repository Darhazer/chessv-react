/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/MecklenbeckChess.cs
 ***************************************************************************/

import { type Location } from '@chessv/engine';
import { ComplexPromotionRule, PromotionOption } from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * Mecklenbeck Chess — Bernd Eickenscheidt & B. Schwarzkopf, 1973.
 * Standard chess with an extended promotion zone: pawns *may* promote on
 * the 6th or 7th ranks and *must* promote on the 8th. The relaxed rule
 * is the variant's only deviation from orthodox chess.
 */
export class MecklenbeckChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Mecklenbeck Chess';
    this.promotionRule.value = 'Custom';
  }

  protected override addRules(): void {
    super.addRules();
    const promotionTypes = this.parseTypeListFromString(this.promotionTypes);
    const rule = new ComplexPromotionRule();
    rule.addPromotionCapability(this.pawn, promotionTypes, null, (loc: Location) => {
      if (loc.rank === this.board.numRanks - 1) return PromotionOption.MustPromote;
      if (loc.rank >= this.board.numRanks - 3) return PromotionOption.CanPromote;
      return PromotionOption.CannotPromote;
    });
    this.addRule(rule);
  }
}
