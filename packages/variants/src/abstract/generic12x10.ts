/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic12x10.cs
 *
 *  Phase note: the C# `AddEvaluations` is evaluation only and is deferred.
 *  The "Flexible", "Close-Rook Flexible", "2R Flexible" and
 *  "2R Close-Rook Flexible" castling forms require the not-yet-ported
 *  FlexibleCastlingRule and are deferred.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x10 } from './generic__x10.js';

/**
 * Base class for chess variants on the 12×10 board. Extends {@link Generic__x10}
 * with castling support for the standard, close-rook and second-rank
 * variants (non-flexible only).
 */
export abstract class Generic12x10 extends Generic__x10 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(12, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    for (const [label, desc] of [
      ['3-3', 'King starting on f or g file slides three squares either direction, subject to the usual restrictions, to castle with the piece in the corner'],
      ['3-4', 'King starting on f or g file slides three squares when castling short or four when castling long, subject to the usual restrictions, to castle with the piece in the corner'],
      ['4-4', 'King starting on f or g file slides four squares either direction, subject to the usual restrictions, to castle with the piece in the corner'],
      ['4-5', 'King starting on f or g file slides four squares when castling short or five when castling long, subject to the usual restrictions, to castle with the piece in the corner'],
      ['Close-Rook 2-2', 'King starting on f or g file slides two squares either direction, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['Close-Rook 2-3', 'King starting on f or g file slides two squares when castling short or three when castling long, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['Close-Rook 3-3', 'King starting on f or g file slides three squares either direction, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['Close-Rook 3-4', 'King starting on f or g file slides three squares when castling short or four when castling long, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['Flexible', 'King starting on f or g file slides two or more squares, subject to the usual restrictions, to castle with the piece in the corner'],
      ['Close-Rook Flexible', 'King starting on f or g file slides two or more squares, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['2R 3-3', 'King starting on f or g file of the second rank slides three squares either direction, subject to the usual restrictions, to castle with the piece on the edge'],
      ['2R 3-4', 'King starting on f or g file of the second rank slides three squares when castling short or four when castling long, subject to the usual restrictions, to castle with the piece on the edge'],
      ['2R 4-4', 'King starting on f or g file of the second rank slides four squares either direction, subject to the usual restrictions, to castle with the piece on the edge'],
      ['2R 4-5', 'King starting on f or g file of the second rank slides four squares when castling short or five when castling long, subject to the usual restrictions, to castle with the piece on the edge'],
      ['2R Close-Rook 2-2', 'King starting on f or g file of the second rank slides two squares either direction, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['2R Close-Rook 2-3', 'King starting on f or g file of the second rank slides two squares when castling short or three when castling long, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['2R Close-Rook 3-3', 'King starting on f or g file of the second rank slides three squares either direction, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['2R Close-Rook 3-4', 'King starting on f or g file of the second rank slides three squares when castling short or four when castling long, subject to the usual restrictions, to castle with the piece on the b or k file'],
      ['2R Flexible', 'King starting on f or g file of the second rank slides two or more squares, subject to the usual restrictions, to castle with the piece on the edge'],
      ['2R Close-Rook Flexible', 'King starting on f or g file of the second rank slides two or more squares, subject to the usual restrictions, to castle with the piece on the b or k file'],
    ] as const) {
      this.castling.addChoice(label, desc);
    }
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

    // Skip Flexible / Close-Rook Flexible / 2R Flexible / 2R Close-Rook Flexible —
    // these need the FlexibleCastlingRule (not yet ported).
    if (
      value === 'Flexible' ||
      value === 'Close-Rook Flexible' ||
      value === '2R Flexible' ||
      value === '2R Close-Rook Flexible'
    ) {
      return;
    }

    // Find the king's start squares (must be f1, f2, g1 or g2 / f9, f10, g9 or g10).
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    let whiteKingSquare: string | null = null;
    let blackKingSquare: string | null = null;
    for (const sq of ['f1', 'g1', 'f2', 'g2']) {
      if (this.startingPieces.get(sq)?.equals(whiteKing)) {
        whiteKingSquare = sq;
        break;
      }
    }
    for (const sq of ['f10', 'g10', 'f9', 'g9']) {
      if (this.startingPieces.get(sq)?.equals(blackKing)) {
        blackKingSquare = sq;
        break;
      }
    }
    if (whiteKingSquare === null || blackKingSquare === null) {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    const offset = (ch: string, n: number): string => String.fromCharCode(ch.charCodeAt(0) + n);

    const rankPlayer0 = value.indexOf('2R') >= 0 ? '2' : '1';
    const rankPlayer1 = value.indexOf('2R') >= 0 ? '9' : '10';
    const closeRook = value.indexOf('Close-Rook') >= 0;
    const file0Char0 = closeRook ? 'B' : 'A';
    const file1Char0 = closeRook ? 'K' : 'L';
    const file0Char1 = closeRook ? 'b' : 'a';
    const file1Char1 = closeRook ? 'k' : 'l';
    const shortDistance = Number(value.charAt(value.length - 3));
    const longDistance = Number(value.charAt(value.length - 1));
    this.addCastlingRule();

    if (whiteKingSquare[0] === 'g') {
      this.castlingMove(
        0,
        `g${rankPlayer0}`,
        `${offset('g', shortDistance)}${rankPlayer0}`,
        `${file1Char1.toLowerCase()}${rankPlayer0}`,
        `${offset('g', shortDistance - 1)}${rankPlayer0}`,
        file1Char0,
      );
      this.castlingMove(
        0,
        `g${rankPlayer0}`,
        `${offset('g', -longDistance)}${rankPlayer0}`,
        `${file0Char1.toLowerCase()}${rankPlayer0}`,
        `${offset('g', -longDistance + 1)}${rankPlayer0}`,
        file0Char0,
      );
    } else {
      this.castlingMove(
        0,
        `f${rankPlayer0}`,
        `${offset('f', longDistance)}${rankPlayer0}`,
        `${file1Char1.toLowerCase()}${rankPlayer0}`,
        `${offset('f', longDistance - 1)}${rankPlayer0}`,
        file1Char0,
      );
      this.castlingMove(
        0,
        `f${rankPlayer0}`,
        `${offset('f', -shortDistance)}${rankPlayer0}`,
        `${file0Char1.toLowerCase()}${rankPlayer0}`,
        `${offset('f', -shortDistance + 1)}${rankPlayer0}`,
        file0Char0,
      );
    }
    if (blackKingSquare[0] === 'g') {
      this.castlingMove(
        1,
        `g${rankPlayer1}`,
        `${offset('g', shortDistance)}${rankPlayer1}`,
        `${file1Char1}${rankPlayer1}`,
        `${offset('g', shortDistance - 1)}${rankPlayer1}`,
        file1Char1,
      );
      this.castlingMove(
        1,
        `g${rankPlayer1}`,
        `${offset('g', -longDistance)}${rankPlayer1}`,
        `${file0Char1}${rankPlayer1}`,
        `${offset('g', -longDistance + 1)}${rankPlayer1}`,
        file0Char1,
      );
    } else {
      this.castlingMove(
        1,
        `f${rankPlayer1}`,
        `${offset('f', longDistance)}${rankPlayer1}`,
        `${file1Char1}${rankPlayer1}`,
        `${offset('f', longDistance - 1)}${rankPlayer1}`,
        file1Char1,
      );
      this.castlingMove(
        1,
        `f${rankPlayer1}`,
        `${offset('f', -shortDistance)}${rankPlayer1}`,
        `${file0Char1}${rankPlayer1}`,
        `${offset('f', -shortDistance + 1)}${rankPlayer1}`,
        file0Char1,
      );
    }
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1000, 1100)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 600)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 350, 400)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 275, 275)));
  }
}
