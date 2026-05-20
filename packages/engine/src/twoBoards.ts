/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Boards/TwoBoards.cs
 ***************************************************************************/

import { Location } from './basics.js';
import { Board, NOT_CONNECTED } from './board.js';

/**
 * Two side-by-side boards of the same size, presented as a single board
 * with double the file count. Pieces on the left board ("board A", files
 * 0..N-1) and the right board ("board B", files N..2N-1) move using the
 * normal direction set, but **not** across the boundary — there is no
 * neighbour at the file-N/file-N-1 join.
 *
 * Used by Alice Chess: an extra rule (`AliceRule`) lets a piece teleport
 * between the two boards when it moves; this Board class only provides
 * the disconnected geometry the rule sits on top of.
 */
export class TwoBoards extends Board {
  /** Files per single sub-board (numFiles is `2 * boardFiles`). */
  readonly boardFiles: number;

  constructor(boardFiles: number, numRanks: number) {
    super(boardFiles * 2, numRanks);
    this.boardFiles = boardFiles;
    // Static exchange evaluation relies on simple movement geometry; with
    // the file-boundary gap it'd give wrong answers, so opt out.
    this.disableSimpleMoveGeneration = true;
  }

  /**
   * Override the parent's next-step builder to chop the connection between
   * file `boardFiles - 1` and file `boardFiles`. The standard rectangular
   * geometry produced by the parent would let sliders walk across the
   * join; we want each sub-board self-contained.
   */
  protected override buildNextStepMatrix(): void {
    super.buildNextStepMatrix();
    const game = this.game;
    if (game === null) return;
    const directions = game.getDirections();
    for (let d = 0; d < directions.length; d++) {
      const row = this.nextStep[d]!;
      for (let sq = 0; sq < this.numSquares; sq++) {
        const next = row[sq]!;
        if (next < 0) continue;
        // Block any neighbour that crosses the sub-board boundary.
        const aBoard = this.getFile(sq) < this.boardFiles;
        const bBoard = this.getFile(next) < this.boardFiles;
        if (aBoard !== bBoard) row[sq] = NOT_CONNECTED;
      }
    }
  }

  /** The mirror square on the other sub-board. */
  mirrorSquare(square: number): number {
    const half = this.numSquares / 2;
    return square >= half ? square - half : square + half;
  }

  /** True iff the square is on the right-hand sub-board. */
  isOnSecondBoard(square: number): boolean {
    return this.getFile(square) >= this.boardFiles;
  }

  /**
   * Approximate `squareToLocation` for callers that don't care which
   * sub-board they're on. The parent's behaviour (rank, file) over the
   * full 2N-wide board is preserved; callers that need to distinguish
   * the boards should use `isOnSecondBoard` / `mirrorSquare`.
   */
  override squareToLocation(square: number): Location {
    return super.squareToLocation(square);
  }
}
