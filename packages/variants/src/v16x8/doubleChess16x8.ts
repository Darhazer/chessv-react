/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/16x8/DoubleChess16x8.cs
 ***************************************************************************/

import { MirrorSymmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x8 } from '../abstract/generic__x8.js';

/**
 * Double Chess (16×8) — David Short's 1996 variant played on two boards
 * side-by-side, with two sets of pieces (the second King replaced with a
 * third Queen). The King sits on the i-file and can castle inward or
 * outward.
 */
export class DoubleChess16x8 extends Generic__x8 {
  constructor() {
    super(16, new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Double Chess (16 x 8)';
    this.array = 'rnbqrnbqkbnrqbnr/pppppppppppppppp/16/16/16/16/PPPPPPPPPPPPPPPP/RNBQRNBQKBNRQBNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRBN';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.rook = new Rook('Rook', 'R', 600, 650)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 325, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 275, 275)));
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1050, 1150)));
  }

  protected override addRules(): void {
    super.addRules();

    // Custom castling on the i-file — inside or outside.
    this.addCastlingRule();
    // White inside castling moves.
    this.castlingMove(0, 'i1', 'k1', 'l1', 'j1', 'L');
    this.castlingMove(0, 'i1', 'g1', 'e1', 'h1', 'E');
    // White outside castling moves.
    this.castlingMove(0, 'i1', 'm1', 'p1', 'l1', 'P');
    this.castlingMove(0, 'i1', 'e1', 'a1', 'f1', 'A');
    // Black inside castling moves.
    this.castlingMove(1, 'i8', 'k8', 'l8', 'j8', 'l');
    this.castlingMove(1, 'i8', 'g8', 'e8', 'h8', 'e');
    // Black outside castling moves.
    this.castlingMove(1, 'i8', 'm8', 'p8', 'l8', 'p');
    this.castlingMove(1, 'i8', 'e8', 'a8', 'f8', 'a');
  }
}
