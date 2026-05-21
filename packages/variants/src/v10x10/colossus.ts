/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/Colossus.cs
 ***************************************************************************/

import { GenericPiece, MirrorSymmetry } from '@chessv/engine';
import { Generic10x10 } from '../abstract/generic10x10.js';

/**
 * Colossus — Charles Daniel, 2010. A 10×10 variant with the standard
 * piece set but twice as many rooks, knights and bishops scattered
 * across two back ranks. The bespoke "Colossus" castling style is a
 * flexible 2R-style castle that may land the king onto the partner
 * piece's square (allowMoveOntoCastlingPiece).
 */
export class Colossus extends Generic10x10 {
  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Colossus';
    this.array = 'r1nb2bn1r/1rnbqkbnr1/pppppppppp/10/10/10/10/PPPPPPPPPP/1RNBQKBNR1/R1NB2BN1R';
    this.promotionTypes = 'QRBN';
    this.pawnMultipleMove.value = 'Fast Pawn';
    this.enPassant = true;
    this.castling.addChoice(
      'Colossus',
      'King on the second rank slides 1-3 spaces short or 1-4 long to castle with the b/i piece',
    );
    this.castling.value = 'Colossus';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
  }

  protected override addRules(): void {
    super.addRules();
    if (this.castling.value !== 'Colossus') return;

    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    let kingFile: 'e' | 'f';
    if (this.startingPieces.get('f2')?.equals(whiteKing) && this.startingPieces.get('f9')?.equals(blackKing)) {
      kingFile = 'f';
    } else if (this.startingPieces.get('e2')?.equals(whiteKing) && this.startingPieces.get('e9')?.equals(blackKing)) {
      kingFile = 'e';
    } else {
      throw new Error('Colossus: king does not start on a supported square');
    }

    this.addFlexibleCastlingRule();
    if (kingFile === 'f') {
      this.flexibleCastlingMove(0, 'f2', 'g2', 'i2', 'K', true);
      this.flexibleCastlingMove(0, 'f2', 'e2', 'b2', 'Q', true);
      this.flexibleCastlingMove(1, 'f9', 'g9', 'i9', 'k', true);
      this.flexibleCastlingMove(1, 'f9', 'e9', 'b9', 'q', true);
    } else {
      this.flexibleCastlingMove(0, 'e2', 'd2', 'b2', 'B', true);
      this.flexibleCastlingMove(0, 'e2', 'f2', 'i2', 'I', true);
      this.flexibleCastlingMove(1, 'e9', 'd9', 'b9', 'b', true);
      this.flexibleCastlingMove(1, 'e9', 'f9', 'i9', 'i', true);
    }
  }
}
