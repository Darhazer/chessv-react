/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/RelativeRoyaltyChess.cs
 ***************************************************************************/

import { MoveEventResponse } from '@chessv/engine';
import { CheckmateRule, RelativeRoyaltyCheckmateRule } from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * Relative Royalty Chess — each side has two kings; the king nearer one's own
 * back rank is the one that must not be left in check.
 */
export class RelativeRoyaltyChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Relative Royalty Chess';
    this.array = 'rnbqkknr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKKNR';
  }

  protected override addRules(): void {
    super.addRules();
    this.removeRule(CheckmateRule);
    const rule = new RelativeRoyaltyCheckmateRule(this.king);
    if (this.stalemateResult.value === 'Loss') {
      rule.stalemateResult = MoveEventResponse.GameLost;
    } else if (this.stalemateResult.value === 'Win') {
      rule.stalemateResult = MoveEventResponse.GameWon;
    }
    this.addRule(rule);
  }
}
