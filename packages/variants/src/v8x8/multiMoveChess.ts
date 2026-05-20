/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/MarseillaisChess.cs and DoublemoveChess.cs
 ***************************************************************************/

import {
  CheckmateRule,
  DoubleMoveCompletionRule,
  EnPassantRule,
  ExtinctionRule,
  MarseillaisMoveCompletionRule,
} from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * Marseillais Chess (c. 1920): after white's single opening move, both
 * players move twice each turn. Giving check on the first of two moves
 * ends the player's turn early.
 */
export class MarseillaisChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Marseillais Chess';
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new MarseillaisMoveCompletionRule());
  }
}

/**
 * Doublemove Chess (Fred Galvin, 1957): same two-moves-per-turn pattern as
 * Marseillais but with no check — the king is a regular piece that must
 * actually be captured. En passant is removed; victory by extinction of
 * the opponent's king.
 */
export class DoublemoveChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Doublemove Chess';
  }

  protected override addRules(): void {
    super.addRules();
    this.removeRule(CheckmateRule);
    this.removeRule(EnPassantRule);
    this.addRule(new ExtinctionRule('K'));
    this.addRule(new DoubleMoveCompletionRule());
  }
}
