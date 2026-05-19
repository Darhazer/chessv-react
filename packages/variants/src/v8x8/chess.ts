/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/Chess.cs
 ***************************************************************************/

import { MirrorSymmetry } from '@chessv/engine';
import { Generic8x8 } from '../abstract/generic8x8.js';

/**
 * Classic chess. Almost all behaviour is inherited from the generic chess
 * base classes; this class only sets the starting array and turns on the
 * pawn double-move, en passant, castling and promotion.
 */
export class Chess extends Generic8x8 {
  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chess';
    this.array = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Standard';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
  }
}
