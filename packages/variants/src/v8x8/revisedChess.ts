/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/RevisedChess.cs
 ***************************************************************************/

import { Direction, MoveCapability } from '@chessv/engine';
import { Chess } from './chess.js';

/**
 * Revised Chess — standard chess, but a pawn on its 7th rank gains the ability
 * to capture straight forward, reducing the number of drawn endgames.
 */
export class RevisedChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Revised Chess';
  }

  protected override addRules(): void {
    super.addRules();
    // The pawn has a forward capturing move on its 7th rank.
    const move = new MoveCapability();
    move.maxSteps = 1;
    move.mustCapture = true;
    move.canCapture = true;
    move.direction = new Direction(1, 0);
    move.condition = (location) => location.rank === 6;
    this.pawn.addMoveCapability(move);
  }
}
