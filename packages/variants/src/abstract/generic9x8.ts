/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic9x8.cs
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x8 } from './generic__x8.js';

/**
 * Base class for chess variants on the 9×8 board. Adds castling support
 * for Standard, Long, Flexible and Close-Rook styles centred on e1/e8.
 * Always uses Shredder-style FEN privilege chars since "king-side" /
 * "queen-side" is meaningless with the king on the centre file.
 */
export abstract class Generic9x8 extends Generic__x8 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(9, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    this.castling.addChoice(
      'Standard',
      'King on the e file slides two squares to castle with the corner piece',
    );
    this.castling.addChoice(
      'Long',
      'King on the e file slides three squares to castle with the corner piece',
    );
    this.castling.addChoice(
      'Flexible',
      'King on the e file slides two or more squares toward the corner piece',
    );
    this.castling.addChoice(
      'Close-Rook',
      'King on the e file slides two squares to castle with the piece on b or h',
    );
    this.castling.addChoice('None', 'No castling');
    this.castling.value = 'None';
  }

  protected override addRules(): void {
    super.addRules();
    const choices = this.castling.choices;
    const value = this.castling.value ?? 'None';
    if (choices.indexOf(value) >= choices.indexOf('None')) return;

    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    if (
      !this.startingPieces.get('e1')?.equals(whiteKing) ||
      !this.startingPieces.get('e8')?.equals(blackKing)
    ) {
      throw new Error('Generic9x8: king must start on e1 / e8 for castling');
    }

    if (value === 'Standard') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'c1', 'a1', 'd1', 'A');
      this.castlingMove(0, 'e1', 'g1', 'i1', 'f1', 'I');
      this.castlingMove(1, 'e8', 'c8', 'a8', 'd8', 'a');
      this.castlingMove(1, 'e8', 'g8', 'i8', 'f8', 'i');
    } else if (value === 'Long') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'b1', 'a1', 'c1', 'A');
      this.castlingMove(0, 'e1', 'h1', 'i1', 'g1', 'I');
      this.castlingMove(1, 'e8', 'b8', 'a8', 'c8', 'a');
      this.castlingMove(1, 'e8', 'h8', 'i8', 'g8', 'i');
    } else if (value === 'Flexible') {
      this.addFlexibleCastlingRule();
      this.flexibleCastlingMove(0, 'e1', 'c1', 'a1', 'A');
      this.flexibleCastlingMove(0, 'e1', 'g1', 'i1', 'I');
      this.flexibleCastlingMove(1, 'e8', 'c8', 'a8', 'a');
      this.flexibleCastlingMove(1, 'e8', 'g8', 'i8', 'i');
    } else if (value === 'Close-Rook') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'c1', 'b1', 'd1', 'B');
      this.castlingMove(0, 'e1', 'g1', 'h1', 'f1', 'H');
      this.castlingMove(1, 'e8', 'c8', 'b8', 'd8', 'b');
      this.castlingMove(1, 'e8', 'g8', 'h8', 'f8', 'h');
    }
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 900, 950)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 500, 550)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 325, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 285, 285)));
  }
}
