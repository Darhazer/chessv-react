/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/NoMoveResultRule.cs
 ***************************************************************************/

import { MoveEventResponse, Rule } from '@chessv/engine';

/**
 * Overrides the default "no legal moves = stalemate draw" logic with a
 * fixed result (typically `GameLost`, used by Odin's Rune Chess so that
 * a side with no moves loses outright).
 */
export class NoMoveResultRule extends Rule {
  private readonly result: MoveEventResponse;

  constructor(result: MoveEventResponse) {
    super();
    this.result = result;
  }

  override noMovesResult(_currentPlayer: number, _ply: number): MoveEventResponse {
    return this.result;
  }
}
