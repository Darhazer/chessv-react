/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic12x8.cs
 *
 *  Phase note: the C# `AddEvaluations` is evaluation only and is deferred.
 *  The "Flexible" and "Close-Rook Flexible" castling forms require the
 *  not-yet-ported FlexibleCastlingRule and are deferred.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x8 } from './generic__x8.js';

/**
 * Base class for chess variants on the 12×8 board. Extends {@link Generic__x8}
 * with castling support for the standard and close-rook styles (non-flexible).
 *
 * The castling rule names mirror the C# source — e.g. "3-3", "4-5",
 * "Close-Rook 2-3". The trailing digit pair encodes the short / long slide
 * distances.
 */
export abstract class Generic12x8 extends Generic__x8 {
  castling!: ChoiceVariable;

  constructor(symmetry: Symmetry) {
    super(12, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.castling = new ChoiceVariable();
    this.castling.addChoice(
      '3-3',
      'King starting on f or g file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      '3-4',
      'King starting on f or g file slides three squares when castling short ' +
        'or four when castling long, subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      '4-4',
      'King starting on f or g file slides four squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      '4-5',
      'King starting on f or g file slides four squares when castling short ' +
        'or five when castling long, subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Close-Rook 2-2',
      'King starting on f or g file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or k file',
    );
    this.castling.addChoice(
      'Close-Rook 2-3',
      'King starting on f or g file slides two squares when castling short ' +
        'or three when castling long, subject to the usual restrictions, to castle with the piece on the b or k file',
    );
    this.castling.addChoice(
      'Close-Rook 3-3',
      'King starting on f or g file slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or k file',
    );
    this.castling.addChoice(
      'Close-Rook 3-4',
      'King starting on f or g file slides three squares when castling short ' +
        'or four when castling long, subject to the usual restrictions, to castle with the piece on the b or k file',
    );
    this.castling.addChoice(
      'Flexible',
      'King starting on f or g file slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Close-Rook Flexible',
      'King starting on f or g file slides two or more squares, subject to the usual ' +
        'restrictions, to castle with the piece on the b or k file',
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

    // The Kings must be on f1/g1 (white) and f8/g8 (black).
    const whiteKing = new GenericPiece(0, this.castlingType!);
    const blackKing = new GenericPiece(1, this.castlingType!);
    let whiteKingSquare: 'f1' | 'g1' | null = null;
    let blackKingSquare: 'f8' | 'g8' | null = null;
    if (this.startingPieces.get('f1')?.equals(whiteKing)) whiteKingSquare = 'f1';
    else if (this.startingPieces.get('g1')?.equals(whiteKing)) whiteKingSquare = 'g1';
    if (this.startingPieces.get('f8')?.equals(blackKing)) blackKingSquare = 'f8';
    else if (this.startingPieces.get('g8')?.equals(blackKing)) blackKingSquare = 'g8';
    if (whiteKingSquare === null || blackKingSquare === null) {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    // Flexible variants use FlexibleCastlingRule: the king slides two or
    // more squares toward the partner piece, which jumps to the king's
    // other side once the slide stops.
    if (value === 'Flexible' || value === 'Close-Rook Flexible') {
      const closeRookFlex = value === 'Close-Rook Flexible';
      const partnerLeft = closeRookFlex ? 'b' : 'a';
      const partnerRight = closeRookFlex ? 'k' : 'l';
      this.addFlexibleCastlingRule();
      const offset = (ch: string, n: number): string =>
        String.fromCharCode(ch.charCodeAt(0) + n);
      const move = (player: 0 | 1, kingSquare: string, rank: '1' | '8'): void => {
        const kingChar = kingSquare[0]!;
        const priv = (c: string): string => (player === 0 ? c.toUpperCase() : c.toLowerCase());
        this.flexibleCastlingMove(
          player,
          kingSquare,
          `${offset(kingChar, 2)}${rank}`,
          `${partnerRight}${rank}`,
          priv(partnerRight),
        );
        this.flexibleCastlingMove(
          player,
          kingSquare,
          `${offset(kingChar, -2)}${rank}`,
          `${partnerLeft}${rank}`,
          priv(partnerLeft),
        );
      };
      move(0, whiteKingSquare, '1');
      move(1, blackKingSquare, '8');
      return;
    }

    // Algorithmic implementation for all other castling options.
    const closeRook = value.indexOf('Close-Rook') >= 0;
    const shortDistance = Number(value.charAt(value.length - 3));
    const longDistance = Number(value.charAt(value.length - 1));
    this.addCastlingRule();

    const offset = (ch: string, n: number): string => String.fromCharCode(ch.charCodeAt(0) + n);

    if (!closeRook) {
      // King-side rook on l, queen-side rook on a.
      if (whiteKingSquare === 'g1') {
        this.castlingMove(0, 'g1', `${offset('g', shortDistance)}1`, 'l1', `${offset('g', shortDistance - 1)}1`, 'L');
        this.castlingMove(0, 'g1', `${offset('g', -longDistance)}1`, 'a1', `${offset('g', -longDistance + 1)}1`, 'A');
      } else {
        this.castlingMove(0, 'f1', `${offset('f', longDistance)}1`, 'l1', `${offset('f', longDistance - 1)}1`, 'L');
        this.castlingMove(0, 'f1', `${offset('f', -shortDistance)}1`, 'a1', `${offset('f', -shortDistance + 1)}1`, 'A');
      }
      if (blackKingSquare === 'g8') {
        this.castlingMove(1, 'g8', `${offset('g', shortDistance)}8`, 'l8', `${offset('g', shortDistance - 1)}8`, 'l');
        this.castlingMove(1, 'g8', `${offset('g', -longDistance)}8`, 'a8', `${offset('g', -longDistance + 1)}8`, 'a');
      } else {
        this.castlingMove(1, 'f8', `${offset('f', longDistance)}8`, 'l8', `${offset('f', longDistance - 1)}8`, 'l');
        this.castlingMove(1, 'f8', `${offset('f', -shortDistance)}8`, 'a8', `${offset('f', -shortDistance + 1)}8`, 'a');
      }
    } else {
      // King-side castling piece on k, queen-side on b.
      if (whiteKingSquare === 'g1') {
        this.castlingMove(0, 'g1', `${offset('g', shortDistance)}1`, 'k1', `${offset('g', shortDistance - 1)}1`, 'K');
        this.castlingMove(0, 'g1', `${offset('g', -longDistance)}1`, 'b1', `${offset('g', -longDistance + 1)}1`, 'B');
      } else {
        this.castlingMove(0, 'f1', `${offset('f', longDistance)}1`, 'k1', `${offset('f', longDistance - 1)}1`, 'K');
        this.castlingMove(0, 'f1', `${offset('f', -shortDistance)}1`, 'b1', `${offset('f', -shortDistance + 1)}1`, 'B');
      }
      if (blackKingSquare === 'g8') {
        this.castlingMove(1, 'g8', `${offset('g', shortDistance)}8`, 'k8', `${offset('g', shortDistance - 1)}8`, 'k');
        this.castlingMove(1, 'g8', `${offset('g', -longDistance)}8`, 'b8', `${offset('g', -longDistance + 1)}8`, 'b');
      } else {
        this.castlingMove(1, 'f8', `${offset('f', longDistance)}8`, 'k8', `${offset('f', longDistance - 1)}8`, 'k');
        this.castlingMove(1, 'f8', `${offset('f', -shortDistance)}8`, 'b8', `${offset('f', -shortDistance + 1)}8`, 'b');
      }
    }
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1000, 1050)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 600)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 350, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 285, 285)));
  }
}
