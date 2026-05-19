/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/GenericPiece.cs
 ***************************************************************************/

import type { PieceType } from './pieceType.js';

/**
 * The minimal description of a piece: its type and its owning player.
 *
 * It knows nothing of the game or board it belongs to — that context is added
 * by the `Piece` subclass.
 */
export class GenericPiece {
  player: number;
  pieceType: PieceType;

  constructor(player: number, pieceType: PieceType) {
    this.player = player;
    this.pieceType = pieceType;
  }

  /** Value equality: same player and same piece type. */
  equals(other: GenericPiece | null): boolean {
    return other !== null && other.player === this.player && other.pieceType === this.pieceType;
  }
}
