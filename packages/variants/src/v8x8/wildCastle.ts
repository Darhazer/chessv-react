/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/WildCastle.cs
 ***************************************************************************/

import { Chess } from './chess.js';

/**
 * Wild Castle — a Chess derivative with a randomized piece setup, but with
 * normal castling because the rooks and king keep their usual squares.
 *
 * The back rank is `r???k??r`; the four remaining squares hold two bishops
 * (one of each colour), the queen and a knight, chosen by the position number
 * (1..18). With no position number it shows `r3k2r`.
 */
export class WildCastle extends Chess {
  /** Position number, 1..18. Defaults to 1. */
  positionNumber = 1;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Wild Castle';
    this.castling.value = 'Standard';
  }

  protected override setOtherVariables(): void {
    super.setOtherVariables();
    const array: string[] = ['r', ' ', ' ', ' ', 'k', ' ', ' ', 'r'];
    let position = this.positionNumber - 1;
    const lightBishop = position % 3;
    position = Math.floor(position / 3);
    array[lightBishop * 2 + 1] = 'b';
    const darkBishop = position % 2;
    position = Math.floor(position / 2);
    array[darkBishop * 4 + 2] = 'b';
    let queen = position;
    for (let x = 0; x < 8; x++) {
      if (array[x] === ' ') {
        if (queen-- === 0) array[x] = 'q';
        else array[x] = 'n';
      }
    }
    const pieces = array.join('');
    this.array = `${pieces}/pppppppp/8/8/8/8/PPPPPPPP/${pieces.toUpperCase()}`;
  }
}
