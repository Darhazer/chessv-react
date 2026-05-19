/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic8x8.cs
 *
 *  Phase 1 note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and deferred to Phase 2.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x8 } from './generic__x8.js';

/**
 * Base class for chess variants on the 8×8 board. Extends {@link Generic__x8}
 * with castling support (standard, long and flexible styles).
 */
export abstract class Generic8x8 extends Generic__x8 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(8, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    this.castling.addChoice(
      'Standard',
      'King starting on d or e file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Long',
      'King starting on d or e file slides two squares when castling short ' +
        'or three when castling long, subject to the usual restrictions',
    );
    this.castling.addChoice(
      'Flexible',
      'King starting on d or e file slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice('None', 'No castling');
    this.castling.value = 'None';
  }

  protected override addRules(): void {
    super.addRules();

    // *** CASTLING *** //
    const choices = this.castling.choices;
    if (choices.indexOf(this.castling.value ?? 'None') >= choices.indexOf('None')) {
      return; // a non-castling choice ("None" or later)
    }

    // Accommodate the king starting on d1 or e1.
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    let kingSquare: 'd1' | 'e1';
    if (this.startingPieces.get('d1')?.equals(whiteKing)) {
      kingSquare = 'd1';
    } else if (this.startingPieces.get('e1')?.equals(whiteKing)) {
      kingSquare = 'e1';
    } else {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    // Use Shredder-FEN notation unless the kings start on e1/e8 with a 'Q'-rook on d1.
    const d1 = this.startingPieces.get('d1');
    const e8 = this.startingPieces.get('e8');
    const shredder = !(
      kingSquare === 'e1' &&
      e8 != null &&
      e8.equals(blackKing) &&
      d1 != null &&
      d1.pieceType.notation[0] === 'Q'
    );

    if (this.castling.value === 'Standard') {
      this.addCastlingRule();
      if (kingSquare === 'e1') {
        this.castlingMove(0, 'e1', 'g1', 'h1', 'f1', shredder ? 'H' : 'K');
        this.castlingMove(0, 'e1', 'c1', 'a1', 'd1', shredder ? 'A' : 'Q');
        this.castlingMove(1, 'e8', 'g8', 'h8', 'f8', shredder ? 'h' : 'k');
        this.castlingMove(1, 'e8', 'c8', 'a8', 'd8', shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, 'd1', 'f1', 'h1', 'e1', 'H');
        this.castlingMove(0, 'd1', 'b1', 'a1', 'c1', 'A');
        this.castlingMove(1, 'd8', 'f8', 'h8', 'e8', 'h');
        this.castlingMove(1, 'd8', 'b8', 'a8', 'c8', 'a');
      }
    } else if (this.castling.value === 'Long') {
      this.addCastlingRule();
      if (kingSquare === 'e1') {
        this.castlingMove(0, 'e1', 'g1', 'h1', 'f1', shredder ? 'H' : 'K');
        this.castlingMove(0, 'e1', 'b1', 'a1', 'c1', shredder ? 'A' : 'Q');
        this.castlingMove(1, 'e8', 'g8', 'h8', 'f8', shredder ? 'h' : 'k');
        this.castlingMove(1, 'e8', 'b8', 'a8', 'c8', shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, 'd1', 'g1', 'h1', 'f1', 'H');
        this.castlingMove(0, 'd1', 'b1', 'a1', 'c1', 'A');
        this.castlingMove(1, 'd8', 'g8', 'h8', 'f8', 'h');
        this.castlingMove(1, 'd8', 'b8', 'a8', 'c8', 'a');
      }
    } else if (this.castling.value === 'Flexible') {
      // Flexible castling reuses the castling-move registration; the
      // FlexibleCastlingRule is ported in a later phase.
      this.addCastlingRule();
      if (kingSquare === 'e1') {
        this.castlingMove(0, 'e1', 'g1', 'h1', 'f1', shredder ? 'H' : 'K');
        this.castlingMove(0, 'e1', 'c1', 'a1', 'd1', shredder ? 'A' : 'Q');
        this.castlingMove(1, 'e8', 'g8', 'h8', 'f8', shredder ? 'h' : 'k');
        this.castlingMove(1, 'e8', 'c8', 'a8', 'd8', shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, 'd1', 'f1', 'h1', 'e1', 'H');
        this.castlingMove(0, 'd1', 'b1', 'a1', 'c1', 'A');
        this.castlingMove(1, 'd8', 'f8', 'h8', 'e8', 'h');
        this.castlingMove(1, 'd8', 'b8', 'a8', 'c8', 'a');
      }
    }
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.rook = new Rook('Rook', 'R', 500, 550)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 325, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 325, 325)));
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 950, 1000)));
  }
}
