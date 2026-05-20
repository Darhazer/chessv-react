/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic9x9.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and is deferred. The "Flexible" castling form requires the
 *  not-yet-ported FlexibleCastlingRule and is deferred.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x9 } from './generic__x9.js';

/**
 * Base class for chess variants on the 9×9 board. Extends {@link Generic__x9}
 * with castling support for the standard, long and close-rook styles.
 */
export abstract class Generic9x9 extends Generic__x9 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(9, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    this.castling.addChoice(
      'Standard',
      'King starting on the e file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Long',
      'King starting on the e file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Flexible',
      'King starting on the e file slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Close-Rook',
      'King starting on the e file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or h file',
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

    // The Kings must be centered on e1 and e9.
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    if (
      !this.startingPieces.get('e1')?.equals(whiteKing) ||
      !this.startingPieces.get('e9')?.equals(blackKing)
    ) {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    // Shredder-FEN notation is used exclusively (IAia) because the king is centered.
    if (value === 'Standard') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'c1', 'a1', 'd1', 'A');
      this.castlingMove(0, 'e1', 'g1', 'i1', 'f1', 'I');
      this.castlingMove(1, 'e9', 'c9', 'a9', 'd9', 'a');
      this.castlingMove(1, 'e9', 'g9', 'i9', 'f9', 'i');
    } else if (value === 'Long') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'b1', 'a1', 'c1', 'A');
      this.castlingMove(0, 'e1', 'h1', 'i1', 'g1', 'I');
      this.castlingMove(1, 'e9', 'b9', 'a9', 'c9', 'a');
      this.castlingMove(1, 'e9', 'h9', 'i9', 'g9', 'i');
    } else if (value === 'Close-Rook') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'c1', 'b1', 'd1', 'B');
      this.castlingMove(0, 'e1', 'g1', 'h1', 'f1', 'H');
      this.castlingMove(1, 'e9', 'c9', 'b9', 'd9', 'b');
      this.castlingMove(1, 'e9', 'g9', 'h9', 'f9', 'h');
    }
    // "Flexible" needs the FlexibleCastlingRule (not yet ported).
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.rook = new Rook('Rook', 'R', 500, 525)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 325, 330)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 325, 325)));
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 950, 1000)));
  }
}
