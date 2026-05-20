/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/ChessWithPockets.cs
 ***************************************************************************/

import { Board, BoardWithPockets } from '@chessv/engine';
import { PocketDropRule } from '@chessv/rules';
import { Chess } from './chess.js';

/**
 * Pocket Knight (Chess With Pockets): standard chess, but each side starts
 * with a Knight in an off-board pocket that may be dropped to any empty
 * square in lieu of a move.
 */
export class ChessWithPockets extends Chess {
  /** Notation string of the pieces each side starts with in hand. */
  pocketPieces = 'Nn';

  protected override createBoard(numPlayers: number, numFiles: number, numRanks: number): Board {
    return new BoardWithPockets(numFiles, numRanks, numPlayers);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Pocket Knight';
    this.fenFormat =
      '{array} {current player} {pieces in hand} {castling} {en-passant} {half-move clock} {turn number}';
    this.fenStart = '#{Array} w #{PocketPieces} KQkq - 0 1';
    this.array = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  }

  protected override lookupGameVariable(name: string): unknown {
    if (name === 'PocketPieces') return this.pocketPieces;
    return super.lookupGameVariable(name);
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new PocketDropRule());
  }
}
