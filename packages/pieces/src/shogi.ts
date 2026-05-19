/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/Shogi.cs (Phase 3 ports the pieces as the
 *  variants that use them are added).
 ***************************************************************************/

import { Direction, PieceType } from '@chessv/engine';

/** The Shogi Silver General: steps straight forward or to any diagonal. */
export class SilverGeneral extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Silver General', name, notation, midgameValue, endgameValue, preferredImageName);
    SilverGeneral.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(1, 0));
    type.step(new Direction(1, 1));
    type.step(new Direction(1, -1));
    type.step(new Direction(-1, 1));
    type.step(new Direction(-1, -1));
  }
}
