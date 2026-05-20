/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Boards/CylindricalBoard.cs
 ***************************************************************************/

import { Location } from './basics.js';
import { Board, NOT_CONNECTED } from './board.js';

/**
 * A board whose left and right edges are connected, so a piece moving off
 * one side wraps around to the other. Used by Cylindrical Chess (and any
 * future toroidal variants we add).
 *
 * The only override is `buildNextStepMatrix`, which uses modular file
 * arithmetic; everything else is inherited from `Board`. SEE-friendly
 * "simple" move generation is disabled because the wrap creates multiple
 * paths between the same pair of squares.
 */
export class CylindricalBoard extends Board {
  constructor(numFiles: number, numRanks: number) {
    super(numFiles, numRanks);
    this.disableSimpleMoveGeneration = true;
  }

  protected override buildNextStepMatrix(): void {
    const game = this.game;
    if (game === null) return;
    const directions = game.getDirections();
    this.numberOfDirections = directions.length;
    this.nextStep = [];

    for (let d = 0; d < directions.length; d++) {
      const row = new Int32Array(this.numSquaresExtended);
      const direction = directions[d]!;
      for (let sq = 0; sq < this.numSquaresExtended; sq++) {
        if (sq >= this.numSquares) {
          row[sq] = NOT_CONNECTED;
          continue;
        }
        const location = this.squareToLocation(sq);
        const nextRank = location.rank + direction.rankOffset;
        // Wrap files modulo numFiles; add numFiles first so negative
        // offsets land in [0, numFiles).
        const nextFile =
          ((location.file + direction.fileOffset) % this.numFiles + this.numFiles) %
          this.numFiles;
        row[sq] =
          nextRank >= 0 && nextRank < this.numRanks
            ? this.locationToSquare(new Location(nextRank, nextFile))
            : NOT_CONNECTED;
      }
      this.nextStep[d] = row;
    }
  }
}
