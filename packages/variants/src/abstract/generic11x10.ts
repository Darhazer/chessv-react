/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic11x10.cs
 *
 *  Phase note: the C# `AddEvaluations` is evaluation only and is deferred.
 *  The "Flexible", "Wildebeest", "Close-Rook Flexible", "2R Flexible",
 *  "2R Wildebeest" and "2R Close-Rook Flexible" castling forms require the
 *  not-yet-ported FlexibleCastlingRule and are deferred.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x10 } from './generic__x10.js';

/**
 * Base class for chess variants on the 11×10 board. Extends {@link Generic__x10}
 * with castling support for the standard, long, close-rook and second-rank
 * variants (non-flexible only).
 */
export abstract class Generic11x10 extends Generic__x10 {
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
      'Wildebeest',
      'King starting on the f file slides one or more squares, subject to the usual ' +
        'restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Close-Rook',
      'King starting on the f file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or j file',
    );
    this.castling.addChoice(
      'Close-Rook Flexible',
      'King starting on the f file slides two or more squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or j file',
    );
    this.castling.addChoice(
      '2R Standard',
      'King starting on the f file of the second rank slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the edge',
    );
    this.castling.addChoice(
      '2R Long',
      'King starting on the f file of the second rank slides four squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the edge',
    );
    this.castling.addChoice(
      '2R Flexible',
      'King starting on the f file of the second rank slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece on the edge',
    );
    this.castling.addChoice(
      '2R Wildebeest',
      'King starting on the f file of the second rank slides one or more squares, subject to the usual ' +
        'restrictions, to castle with the piece on the edge',
    );
    this.castling.addChoice(
      '2R Close-Rook',
      'King starting on the f file of the second rank slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or j file',
    );
    this.castling.addChoice(
      '2R Close-Rook Flexible',
      'King starting on the f file of the second rank slides two or more squares either direction, ' +
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

    // The Kings must be centered on f1 and f10.
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    if (
      !this.startingPieces.get('f1')?.equals(whiteKing) ||
      !this.startingPieces.get('f10')?.equals(blackKing)
    ) {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    if (value === 'Standard') {
      this.addCastlingRule();
      this.castlingMove(0, 'f1', 'i1', 'k1', 'h1', 'K');
      this.castlingMove(0, 'f1', 'c1', 'a1', 'd1', 'A');
      this.castlingMove(1, 'f10', 'i10', 'k10', 'h10', 'k');
      this.castlingMove(1, 'f10', 'c10', 'a10', 'd10', 'a');
    } else if (value === 'Long') {
      this.addCastlingRule();
      this.castlingMove(0, 'f1', 'j1', 'k1', 'i1', 'K');
      this.castlingMove(0, 'f1', 'b1', 'a1', 'c1', 'A');
      this.castlingMove(1, 'f10', 'j10', 'k10', 'i10', 'k');
      this.castlingMove(1, 'f10', 'b10', 'a10', 'c10', 'a');
    } else if (value === 'Close-Rook') {
      this.addCastlingRule();
      this.castlingMove(0, 'f1', 'i1', 'j1', 'h1', 'J');
      this.castlingMove(0, 'f1', 'c1', 'b1', 'd1', 'B');
      this.castlingMove(1, 'f10', 'i10', 'j10', 'h10', 'j');
      this.castlingMove(1, 'f10', 'c10', 'b10', 'd10', 'b');
    } else if (value === '2R Standard') {
      this.addCastlingRule();
      this.castlingMove(0, 'f2', 'i2', 'k2', 'h2', 'K');
      this.castlingMove(0, 'f2', 'c2', 'a2', 'd2', 'A');
      this.castlingMove(1, 'f9', 'i9', 'k9', 'h9', 'k');
      this.castlingMove(1, 'f9', 'c9', 'a9', 'd9', 'a');
    } else if (value === '2R Long') {
      this.addCastlingRule();
      this.castlingMove(0, 'f2', 'j2', 'k2', 'i2', 'K');
      this.castlingMove(0, 'f2', 'b2', 'a2', 'c2', 'A');
      this.castlingMove(1, 'f9', 'j9', 'k9', 'i9', 'k');
      this.castlingMove(1, 'f9', 'b9', 'a9', 'c9', 'a');
    } else if (value === '2R Close-Rook') {
      this.addCastlingRule();
      this.castlingMove(0, 'f2', 'i2', 'j2', 'h2', 'J');
      this.castlingMove(0, 'f2', 'c2', 'b2', 'd2', 'B');
      this.castlingMove(1, 'f9', 'i9', 'j9', 'h9', 'j');
      this.castlingMove(1, 'f9', 'c9', 'b9', 'd9', 'b');
    }
    // "Flexible", "Wildebeest", "Close-Rook Flexible", "2R Flexible",
    // "2R Wildebeest" and "2R Close-Rook Flexible" need the
    // FlexibleCastlingRule (not yet ported).
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1025, 1250)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 600)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 375, 375)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 275, 275)));
  }
}
