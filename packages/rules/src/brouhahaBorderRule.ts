/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Brouhaha/BrouhahaBorderRule.cs
 ***************************************************************************/

import { MoveEventResponse, type MoveList, type MoveType, Rule } from '@chessv/engine';

/**
 * Brouhaha border rule: a move *into* an unoccupied edge square is illegal.
 * The extra pieces (Cleric, Scout) start on the border ring and "leave" it
 * when developed — once a border square is vacated it becomes inaccessible.
 * The net effect is that the 10×10 game collapses to a standard 8×8 game
 * once the border pieces have moved.
 */
export class BrouhahaBorderRule extends Rule {
  override moveBeingGenerated(
    _moves: MoveList,
    _from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const board = this.board!;
    const loc = board.squareToLocation(to);
    const onBorder =
      loc.file === 0 ||
      loc.file === board.numFiles - 1 ||
      loc.rank === 0 ||
      loc.rank === board.numRanks - 1;
    if (onBorder && board.pieceAt(to) === null) return MoveEventResponse.IllegalMove;
    return MoveEventResponse.NotHandled;
  }
}
