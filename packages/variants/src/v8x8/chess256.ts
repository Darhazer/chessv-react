/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/Chess256.cs
 ***************************************************************************/

import { Chess } from './chess.js';

/**
 * Chess256 — a Chess derivative whose opening pawn formation is one of 256
 * randomized arrangements, eliminating the memorization of openings.
 *
 * Each side's pawns occupy ranks 2 and 3 (mirrored): every file holds exactly
 * one pawn, on one of those two ranks, chosen by the bits of the position
 * number (1..256).
 */
export class Chess256 extends Chess {
  /** Position number, 1..256. Defaults to 1. */
  positionNumber = 1;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chess256';
    this.array = 'rnbqkbnr/#{BlackPawns}/8/8/#{WhitePawns}/RNBQKBNR';
  }

  protected override setOtherVariables(): void {
    super.setOtherVariables();
    const position = this.positionNumber - 1;

    // Black's second-rank pawns: a file holds a pawn where the bit is 0.
    let rank2 = '';
    let bit = 0;
    while (bit < 8) {
      if ((position & (1 << bit)) === 0) {
        rank2 += 'p';
        bit++;
      } else {
        let empty = 1;
        bit++;
        while (bit < 8 && (position & (1 << bit)) !== 0) {
          empty++;
          bit++;
        }
        rank2 += String(empty);
      }
    }

    // Black's third-rank pawns: a file holds a pawn where the bit is 1.
    let rank3 = '';
    bit = 0;
    while (bit < 8) {
      if ((position & (1 << bit)) !== 0) {
        rank3 += 'p';
        bit++;
      } else {
        let empty = 1;
        bit++;
        while (bit < 8 && (position & (1 << bit)) === 0) {
          empty++;
          bit++;
        }
        rank3 += String(empty);
      }
    }

    this.setCustomProperty('BlackPawns', `${rank2}/${rank3}`);
    this.setCustomProperty('WhitePawns', `${rank3.toUpperCase()}/${rank2.toUpperCase()}`);
  }
}
