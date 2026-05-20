/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic__x9.cs
 ***************************************************************************/

import { Direction, MoveCapability, type Symmetry } from '@chessv/engine';
import { GenericChess } from './genericChess.js';

/**
 * Base class for chess variants on a board with 9 ranks. Adds optional support
 * for the pawn's two-square initial move (en passant comes from GenericChess).
 */
export abstract class Generic__x9 extends GenericChess {
  pawnDoubleMove = false;

  constructor(numFiles: number, symmetry: Symmetry) {
    super(numFiles, 9, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.pawnDoubleMove = false;
  }

  protected override addRules(): void {
    super.addRules();

    // *** PAWN DOUBLE MOVE *** //
    if (this.pawnDoubleMove && this.pawn.enabled) {
      const doubleMove = new MoveCapability();
      doubleMove.minSteps = 2;
      doubleMove.maxSteps = 2;
      doubleMove.mustCapture = false;
      doubleMove.canCapture = false;
      doubleMove.direction = new Direction(1, 0);
      doubleMove.condition = (location) => location.rank === 1;
      this.pawn.addMoveCapability(doubleMove);
    }
  }
}
