/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic11x8.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and is deferred. The "Flexible" and "Close-Rook Flexible" castling
 *  forms require the not-yet-ported FlexibleCastlingRule and are deferred.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x8 } from './generic__x8.js';

/**
 * Base class for chess variants on the 11×8 board. Extends {@link Generic__x8}
 * with castling support for the standard, long and close-rook styles.
 */
export abstract class Generic11x8 extends Generic__x8 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(11, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    this.castling.addChoice(
      'Standard',
      'King starting on the f file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Long',
      'King starting on the f file slides four squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Flexible',
      'King starting on the f file slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Close-Rook',
      'King starting on the f file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or j file',
    );
    this.castling.addChoice(
      'Close-Rook Flexible',
      'King starting on the f file slides two or more squares, ' +
        'subject to the usual restrictions, to castle with the piece on the b or j file',
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

    // The Kings must be centered on f1 and f8.
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    if (
      !this.startingPieces.get('f1')?.equals(whiteKing) ||
      !this.startingPieces.get('f8')?.equals(blackKing)
    ) {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    if (value === 'Standard') {
      this.addCastlingRule();
      this.castlingMove(0, 'f1', 'i1', 'k1', 'h1', 'K');
      this.castlingMove(0, 'f1', 'c1', 'a1', 'd1', 'A');
      this.castlingMove(1, 'f8', 'i8', 'k8', 'h8', 'k');
      this.castlingMove(1, 'f8', 'c8', 'a8', 'd8', 'a');
    } else if (value === 'Long') {
      this.addCastlingRule();
      this.castlingMove(0, 'f1', 'j1', 'k1', 'i1', 'K');
      this.castlingMove(0, 'f1', 'b1', 'a1', 'c1', 'A');
      this.castlingMove(1, 'f8', 'j8', 'k8', 'i8', 'k');
      this.castlingMove(1, 'f8', 'b8', 'a8', 'c8', 'a');
    } else if (value === 'Close-Rook') {
      this.addCastlingRule();
      this.castlingMove(0, 'f1', 'i1', 'j1', 'h1', 'J');
      this.castlingMove(0, 'f1', 'c1', 'b1', 'd1', 'B');
      this.castlingMove(1, 'f8', 'i8', 'j8', 'h8', 'j');
      this.castlingMove(1, 'f8', 'c8', 'b8', 'd8', 'b');
    }
    // "Flexible" and "Close-Rook Flexible" need the FlexibleCastlingRule
    // (not yet ported).
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1000, 1050)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 525, 550)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 350, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 285, 285)));
  }
}
