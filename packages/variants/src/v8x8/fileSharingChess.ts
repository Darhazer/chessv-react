/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/FileSharingChess.cs
 ***************************************************************************/

import { PawnSwapRule } from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * File Sharing Chess — standard chess, but a pawn directly opposed by an enemy
 * pawn may swap places with it (subject to restrictions), opening up positions.
 */
export class FileSharingChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'File Sharing Chess';
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new PawnSwapRule(this.pawn));
  }
}
