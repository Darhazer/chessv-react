/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Boards/BoardWithPockets.cs
 ***************************************************************************/

import { Location } from './basics.js';
import { Board } from './board.js';

/**
 * A regular board with one extra "pocket" square per player, used to hold
 * pieces awaiting a drop. Pocket pieces have `file === -1` and `rank ===
 * player`; their square index lives in `[numSquares, numSquaresExtended)`.
 *
 * The base `Board` already supports an extended-squares region (its
 * `nextStep`/`flipSquare` matrices treat the extra squares as disconnected
 * and stationary). This subclass just provides the location ↔ square
 * mapping for the pocket region.
 */
export class BoardWithPockets extends Board {
  /** Square index of the given player's pocket. */
  pocketSquareFor(player: number): number {
    return this.numSquares + player;
  }

  constructor(numFiles: number, numRanks: number, numPlayers: number) {
    super(numFiles, numRanks, numFiles * numRanks + numPlayers);
    // Stamp the file/rank tables for the pocket region with sentinel values
    // so `squareToLocation` (inherited) returns `Location(player, -1)` for
    // a pocket square, matching the C# original.
    for (let player = 0; player < numPlayers; player++) {
      const square = this.numSquares + player;
      this.fileBySquare[square] = -1;
      this.rankBySquare[square] = player;
    }
  }

  override locationToSquare(location: Location): number {
    if (location.file < 0) return this.numSquares + location.rank;
    return location.file * this.numRanks + location.rank;
  }
}
