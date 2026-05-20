/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/CylindricalChess.cs
 ***************************************************************************/

import { type Board, CylindricalBoard } from '@chessv/engine';
import { Chess } from './chess.js';

/**
 * Cylindrical Chess — standard chess on a board whose left and right edges
 * are connected. A rook on an open rank threatens every square on it; a
 * bishop's diagonal wraps too. Move deduplication is on, since wrapping
 * creates two paths to many squares (and the move generator would
 * otherwise emit duplicates for long-range sliders).
 */
export class CylindricalChess extends Chess {
  protected override createBoard(_numPlayers: number, numFiles: number, numRanks: number): Board {
    return new CylindricalBoard(numFiles, numRanks);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Cylindrical Chess';
    // Many pieces reach the same square by two paths (left-wrap and
    // right-wrap); without deduplication the move generator would emit
    // both, breaking perft and the hash.
    this.deduplicateMoves = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    // Cylindrical Chess revalues the pieces (ChessV uses tighter ranges
    // since pieces threaten more squares than on a flat board).
    this.queen.midgameValue = 1100;
    this.queen.endgameValue = 1100;
    this.rook.midgameValue = 500;
    this.rook.endgameValue = 500;
    this.bishop.midgameValue = 400;
    this.bishop.endgameValue = 400;
    this.knight.midgameValue = 325;
    this.knight.endgameValue = 325;
  }
}
