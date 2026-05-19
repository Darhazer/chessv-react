/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic10x10.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost / rook-type) is evaluation
 *  only and is deferred. The "Flexible", "Long" and "Grand" promotion forms
 *  (which require the not-yet-ported FlexibleCastlingRule and
 *  PromoteByReplacementRule) are likewise deferred; variants depending on
 *  them are not registered.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { Generic__x10 } from './generic__x10.js';

/**
 * Base class for chess variants on the 10×10 board. Extends {@link Generic__x10}
 * with castling support for the standard, close-rook and second-rank styles.
 */
export abstract class Generic10x10 extends Generic__x10 {
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
      'Close-Rook',
      'King starting on e or f file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or i file',
    );
    this.castling.addChoice(
      '2R Standard',
      'King starting on e or f file on the second rank slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the edge',
    );
    this.castling.addChoice(
      '2R Close-Rook',
      'King starting on e or f file on the second rank slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or i file on the second rank',
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

    const secondRank = value[0] === '2';
    const r1 = secondRank ? '2' : '1';
    const rN = secondRank ? '9' : '10';

    // Find the king's start square (must be on the e or f file).
    const whiteKing = new GenericPiece(0, this.castlingType!);
    let kingFile: 'e' | 'f';
    if (this.startingPieces.get(`e${r1}`)?.equals(whiteKing)) {
      kingFile = 'e';
    } else if (this.startingPieces.get(`f${r1}`)?.equals(whiteKing)) {
      kingFile = 'f';
    } else {
      throw new Error('Cannot enable castling — King does not start on a supported square');
    }

    // Determine whether to use Shredder-FEN notation.
    const blackKing = new GenericPiece(1, this.castlingType!);
    const dq = this.startingPieces.get(`d${r1}`);
    const eq = this.startingPieces.get(`e${r1}`);
    const fN = this.startingPieces.get(`f${rN}`);
    const shredder = !(
      kingFile === 'f' &&
      fN != null &&
      fN.equals(blackKing) &&
      ((dq != null && dq.pieceType.notation[0] === 'Q') ||
        (eq != null && eq.pieceType.notation[0] === 'Q'))
    );

    this.addCastlingRule();

    if (value === 'Standard' || value === '2R Standard') {
      if (kingFile === 'f') {
        this.castlingMove(0, `f${r1}`, `i${r1}`, `j${r1}`, `h${r1}`, shredder ? 'J' : 'K');
        this.castlingMove(0, `f${r1}`, `c${r1}`, `a${r1}`, `d${r1}`, shredder ? 'A' : 'Q');
        this.castlingMove(1, `f${rN}`, `i${rN}`, `j${rN}`, `h${rN}`, shredder ? 'j' : 'k');
        this.castlingMove(1, `f${rN}`, `c${rN}`, `a${rN}`, `d${rN}`, shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, `e${r1}`, `b${r1}`, `a${r1}`, `c${r1}`, 'A');
        this.castlingMove(0, `e${r1}`, `h${r1}`, `j${r1}`, `i${r1}`, 'J');
        this.castlingMove(1, `e${rN}`, `b${rN}`, `a${rN}`, `c${rN}`, 'a');
        this.castlingMove(1, `e${rN}`, `h${rN}`, `j${rN}`, `i${rN}`, 'j');
      }
    } else if (value === 'Close-Rook' || value === '2R Close-Rook') {
      if (kingFile === 'f') {
        this.castlingMove(0, `f${r1}`, `h${r1}`, `i${r1}`, `g${r1}`, 'I');
        this.castlingMove(0, `f${r1}`, `d${r1}`, `b${r1}`, `e${r1}`, 'B');
        this.castlingMove(1, `f${rN}`, `h${rN}`, `i${rN}`, `g${rN}`, 'i');
        this.castlingMove(1, `f${rN}`, `d${rN}`, `b${rN}`, `e${rN}`, 'b');
      } else {
        this.castlingMove(0, `e${r1}`, `c${r1}`, `b${r1}`, `d${r1}`, 'B');
        this.castlingMove(0, `e${r1}`, `g${r1}`, `i${r1}`, `f${r1}`, 'I');
        this.castlingMove(1, `e${rN}`, `c${rN}`, `b${rN}`, `d${rN}`, 'b');
        this.castlingMove(1, `e${rN}`, `g${rN}`, `i${rN}`, `f${rN}`, 'i');
      }
    }
  }

  /** Register the standard rook, bishop, knight and queen piece types. */
  addChessPieceTypes(): void {
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1000, 1100)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 600)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 400, 400)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 275, 275)));
  }
}
