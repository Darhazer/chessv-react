/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Omega/OmegaChessBorderRule.cs
 ***************************************************************************/

import { MoveEventResponse, type MoveList, type MoveType, Rule } from '@chessv/engine';

/**
 * Omega Chess border rule. The 12×12 board has only the four corners
 * (the "wizard squares") and the inner 10×10 playable; the rest of the
 * border ring is inaccessible. This rule rejects any move whose
 * destination is a non-corner border square.
 */
export class OmegaChessBorderRule extends Rule {
  override moveBeingGenerated(
    _moves: MoveList,
    _from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const board = this.board!;
    const loc = board.squareToLocation(to);
    const onLeftRight = loc.file === 0 || loc.file === board.numFiles - 1;
    const onTopBottom = loc.rank === 0 || loc.rank === board.numRanks - 1;
    const inCorner = onLeftRight && onTopBottom;
    if ((onLeftRight || onTopBottom) && !inCorner) return MoveEventResponse.IllegalMove;
    return MoveEventResponse.NotHandled;
  }
}
