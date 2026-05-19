/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/ExtinctionChess.cs
 ***************************************************************************/

import { CheckmateRule, ExtinctionRule } from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * Extinction Chess — the goal is to capture every piece of any one type the
 * opponent has. Kinglet Chess is the same idea restricted to pawns.
 */
export class ExtinctionChess extends Chess {
  /** Notations of the types whose extinction loses the game. */
  extinctionTypes = 'KQRNBP';

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Extinction Chess';
    this.extinctionTypes = 'KQRNBP';
    this.promotionTypes = 'QRNBK';
  }

  protected override addRules(): void {
    super.addRules();
    // Replace the checkmate rule with the extinction victory condition.
    this.removeRule(CheckmateRule);
    this.addRule(new ExtinctionRule(this.extinctionTypes));
  }
}

/** Kinglet Chess — win by capturing all of the opponent's pawns. */
export class KingletChess extends ExtinctionChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Kinglet Chess';
    this.extinctionTypes = 'P';
    this.promotionTypes = 'K';
  }
}
