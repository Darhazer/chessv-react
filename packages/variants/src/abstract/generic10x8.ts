/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic10x8.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and is deferred. The "Flexible" and "Close-Rook Flexible" castling
 *  forms require the not-yet-ported FlexibleCastlingRule and are deferred;
 *  variants depending on them are not registered.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x8 } from './generic__x8.js';

/**
 * Base class for chess variants on the 10×8 board. Extends {@link Generic__x8}
 * with castling support for the standard, long and close-rook styles.
 */
export abstract class Generic10x8 extends Generic__x8 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(10, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    this.castling.addChoice(
      'Standard',
      'King starting on e or f file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Long',
      'King starting on e or f file slides three squares when castling short ' +
        'or four when castling long, subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Flexible',
      'King starting on e or f file slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Close-Rook',
      'King starting on e or f file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or i file',
    );
    this.castling.addChoice(
      'Close-Rook Flexible',
      'King starting on e or f file slides two or more squares, ' +
        'subject to the usual restrictions, to castle with the piece on the b or i file',
    );
    this.castling.addChoice('None', 'No castling');
    this.castling.value = 'None';
  }

  protected override addRules(): void {
    super.addRules();

    // *** CASTLING *** //
    const choices = this.castling.choices;
    const value = this.castling.value ?? 'None';
    if (choices.indexOf(value) >= choices.indexOf('None')) {
      return; // a non-castling choice
    }

    // Find the king's start square (must be on the e or f file).
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    let kingSquare: 'e1' | 'f1';
    if (this.startingPieces.get('e1')?.equals(whiteKing)) {
      kingSquare = 'e1';
    } else if (this.startingPieces.get('f1')?.equals(whiteKing)) {
      kingSquare = 'f1';
    } else {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    // Determine whether to use Shredder-FEN notation.
    const d1 = this.startingPieces.get('d1');
    const e1 = this.startingPieces.get('e1');
    const f8 = this.startingPieces.get('f8');
    const shredder = !(
      kingSquare === 'f1' &&
      f8 != null &&
      f8.equals(blackKing) &&
      ((d1 != null && d1.pieceType.notation[0] === 'Q') ||
        (e1 != null && e1.pieceType.notation[0] === 'Q'))
    );

    if (value === 'Standard') {
      this.addCastlingRule();
      if (kingSquare === 'f1') {
        this.castlingMove(0, 'f1', 'i1', 'j1', 'h1', shredder ? 'J' : 'K');
        this.castlingMove(0, 'f1', 'c1', 'a1', 'd1', shredder ? 'A' : 'Q');
        this.castlingMove(1, 'f8', 'i8', 'j8', 'h8', shredder ? 'j' : 'k');
        this.castlingMove(1, 'f8', 'c8', 'a8', 'd8', shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, 'e1', 'b1', 'a1', 'c1', 'A');
        this.castlingMove(0, 'e1', 'h1', 'j1', 'g1', 'J');
        this.castlingMove(1, 'e8', 'b8', 'a8', 'c8', 'a');
        this.castlingMove(1, 'e8', 'h8', 'j8', 'g8', 'j');
      }
    } else if (value === 'Long') {
      this.addCastlingRule();
      if (kingSquare === 'f1') {
        this.castlingMove(0, 'f1', 'i1', 'j1', 'h1', shredder ? 'J' : 'K');
        this.castlingMove(0, 'f1', 'b1', 'a1', 'c1', shredder ? 'A' : 'Q');
        this.castlingMove(1, 'f8', 'i8', 'j8', 'h8', shredder ? 'j' : 'k');
        this.castlingMove(1, 'f8', 'b8', 'a8', 'c8', shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, 'e1', 'b1', 'a1', 'c1', 'A');
        this.castlingMove(0, 'e1', 'i1', 'j1', 'h1', 'J');
        this.castlingMove(1, 'e8', 'b8', 'a8', 'c8', 'a');
        this.castlingMove(1, 'e8', 'i8', 'j8', 'h8', 'j');
      }
    } else if (value === 'Close-Rook') {
      this.addCastlingRule();
      if (kingSquare === 'f1') {
        this.castlingMove(0, 'f1', 'h1', 'i1', 'g1', 'I');
        this.castlingMove(0, 'f1', 'd1', 'b1', 'e1', 'B');
        this.castlingMove(1, 'f8', 'h8', 'i8', 'g8', 'i');
        this.castlingMove(1, 'f8', 'd8', 'b8', 'e8', 'b');
      } else {
        this.castlingMove(0, 'e1', 'c1', 'b1', 'd1', 'B');
        this.castlingMove(0, 'e1', 'g1', 'i1', 'f1', 'I');
        this.castlingMove(1, 'e8', 'c8', 'b8', 'd8', 'b');
        this.castlingMove(1, 'e8', 'g8', 'i8', 'f8', 'i');
      }
    } else if (value === 'Flexible') {
      // King slides two or more squares toward the corner piece, which
      // jumps over to the adjacent square — see FlexibleCastlingRule.
      this.addFlexibleCastlingRule();
      if (kingSquare === 'f1') {
        this.flexibleCastlingMove(0, 'f1', 'h1', 'j1', shredder ? 'J' : 'K');
        this.flexibleCastlingMove(0, 'f1', 'd1', 'a1', shredder ? 'A' : 'Q');
        this.flexibleCastlingMove(1, 'f8', 'h8', 'j8', shredder ? 'j' : 'k');
        this.flexibleCastlingMove(1, 'f8', 'd8', 'a8', shredder ? 'a' : 'q');
      } else {
        this.flexibleCastlingMove(0, 'e1', 'c1', 'a1', 'A');
        this.flexibleCastlingMove(0, 'e1', 'g1', 'j1', 'J');
        this.flexibleCastlingMove(1, 'e8', 'c8', 'a8', 'a');
        this.flexibleCastlingMove(1, 'e8', 'g8', 'j8', 'j');
      }
    } else if (value === 'Close-Rook Flexible') {
      this.addFlexibleCastlingRule();
      if (kingSquare === 'f1') {
        this.flexibleCastlingMove(0, 'f1', 'h1', 'i1', 'I');
        this.flexibleCastlingMove(0, 'f1', 'd1', 'b1', 'B');
        this.flexibleCastlingMove(1, 'f8', 'h8', 'i8', 'i');
        this.flexibleCastlingMove(1, 'f8', 'd8', 'b8', 'b');
      } else {
        this.flexibleCastlingMove(0, 'e1', 'c1', 'b1', 'B');
        this.flexibleCastlingMove(0, 'e1', 'g1', 'i1', 'I');
        this.flexibleCastlingMove(1, 'e8', 'c8', 'b8', 'b');
        this.flexibleCastlingMove(1, 'e8', 'g8', 'i8', 'i');
      }
    }
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 950, 950)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 475, 500)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 350, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 310, 310)));
  }
}
