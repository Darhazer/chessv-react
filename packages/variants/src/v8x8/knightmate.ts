/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/Knightmate.cs
 ***************************************************************************/

import { CheckmateRule } from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * Knightmate — the knight and king swap roles: a royal Knight where the king
 * stands, and two (non-royal) kings where the knights stand.
 */
export class Knightmate extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Knightmate';
    this.array = 'rkbqnbkr/pppppppp/8/8/8/8/PPPPPPPP/RKBQNBKR';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.castlingType = this.knight;
    this.knight.midgameValue = 0;
    this.knight.endgameValue = 0;
    this.king.midgameValue = 325;
    this.king.endgameValue = 325;

    // The King is no longer royal — give it sensible piece-square tables.
    this.king.pstMidgameInSmallCenter = 4;
    this.king.pstMidgameInLargeCenter = 4;
    this.king.pstMidgameSmallCenterAttacks = 1;
    this.king.pstMidgameLargeCenterAttacks = 1;
    this.king.pstMidgameForwardness = 2;
    this.king.pstEndgameInSmallCenter = 3;
    this.king.pstEndgameInLargeCenter = 3;
    this.king.pstEndgameSmallCenterAttacks = 1;
    this.king.pstEndgameLargeCenterAttacks = 1;
    this.king.pstEndgameForwardness = 1;

    // Keep the now-royal Knight out of the centre in the midgame.
    this.knight.pstMidgameInSmallCenter = 0;
    this.knight.pstMidgameInLargeCenter = 0;
    this.knight.pstMidgameSmallCenterAttacks = 0;
    this.knight.pstMidgameLargeCenterAttacks = 0;
    this.knight.pstMidgameForwardness = -15;
  }

  protected override addRules(): void {
    super.addRules();
    // Replace the King-royal checkmate rule with a Knight-royal one.
    this.removeRule(CheckmateRule);
    this.addRule(new CheckmateRule(this.knight));
  }
}
