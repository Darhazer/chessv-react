/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/Miscellaneous.cs (Cannon, Vao)
 ***************************************************************************/

import { Direction, PieceType } from '@chessv/engine';

/** The Cannon from Xiangqi: moves orthogonally, captures by leaping a screen. */
export class Cannon extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Cannon', name, notation, midgameValue, endgameValue, preferredImageName);
    Cannon.addMoves(this);

    this.pstMidgameSmallCenterAttacks = 2;
    this.pstMidgameLargeCenterAttacks = 4;
  }

  static addMoves(type: PieceType): void {
    type.cannonMove(new Direction(0, 1));
    type.cannonMove(new Direction(0, -1));
    type.cannonMove(new Direction(1, 0));
    type.cannonMove(new Direction(-1, 0));
  }
}

/** The Vao: the diagonal counterpart of the Cannon. */
export class Vao extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Vao', name, notation, midgameValue, endgameValue, preferredImageName);
    Vao.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.cannonMove(new Direction(1, 1));
    type.cannonMove(new Direction(1, -1));
    type.cannonMove(new Direction(-1, 1));
    type.cannonMove(new Direction(-1, -1));
  }
}
