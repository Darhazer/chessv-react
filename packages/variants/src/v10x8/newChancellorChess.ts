/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/NewChancellorChess.cs
 ***************************************************************************/

import { CapablancaChess } from './capablancaChess.js';

/**
 * New Chancellor Chess — David Paulowich's 1997 10×8 variant. The Chancellors
 * sit in the corners and the Archbishop is dropped.
 */
export class NewChancellorChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'New Chancellor Chess';
    this.array = 'crnbqkbnrc/pppppppppp/10/10/10/10/PPPPPPPPPP/CRNBQKBNRC';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Close-Rook';
    this.promotionTypes = 'QCRBN';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    // The Archbishop is not used in this game.
    this.archbishop.enabled = false;
  }
}
