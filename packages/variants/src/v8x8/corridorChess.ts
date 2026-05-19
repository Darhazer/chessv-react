/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/CorridorChess.cs
 ***************************************************************************/

import { Chess } from './chess.js';

/** Corridor Chess — standard chess with a different setup and no castling. */
export class CorridorChess extends Chess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Corridor Chess';
    this.array = '1nrqkrn1/2b2b2/1pppppp1/8/8/1PPPPPP1/2B2B2/1NRQKRN1';
    this.castling.value = 'None';
  }
}
