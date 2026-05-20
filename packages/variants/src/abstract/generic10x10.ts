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
 *  only and is deferred. The "Long", "Flexible" and "Close-Rook Flexible"
 *  castling forms (and their second-rank counterparts) plus the "Grand"
 *  promotion zone are wired through; the Generic10x10 family is ready to
 *  host Grand Chess and its descendants.
 ***************************************************************************/

import { ChoiceVariable, GenericPiece, type Location, type Symmetry } from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from '@chessv/pieces';
import { PromotionOption } from '@chessv/rules';
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
      'Long',
      'King slides three squares for short castling or four for long castling, ' +
        'subject to the usual restrictions, to castle with the piece in the corner',
    );
    this.castling.addChoice(
      'Flexible',
      'King slides two or more squares toward the corner piece',
    );
    this.castling.addChoice(
      'Close-Rook',
      'King starting on e or f file slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or i file',
    );
    this.castling.addChoice(
      'Close-Rook Flexible',
      'King slides two or more squares toward the partner piece on the b or i file',
    );
    this.castling.addChoice(
      '2R Standard',
      'King starting on e or f file on the second rank slides three squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the edge',
    );
    this.castling.addChoice(
      '2R Long',
      'Second-rank Long castling',
    );
    this.castling.addChoice(
      '2R Flexible',
      'Second-rank Flexible castling',
    );
    this.castling.addChoice(
      '2R Close-Rook',
      'King starting on e or f file on the second rank slides two squares either direction, ' +
        'subject to the usual restrictions, to castle with the piece on the b or i file on the second rank',
    );
    this.castling.addChoice(
      '2R Close-Rook Flexible',
      'Second-rank Close-Rook Flexible castling',
    );
    this.castling.addChoice('None', 'No castling');
    this.castling.value = 'None';
    // The "Grand" promotion zone (CanPromote at ranks 7/8, MustPromote at 9)
    // sits on top of the basic promotion choices the parent class declares.
    this.promotionRule.addChoice('Grand');
  }

  protected override addRules(): void {
    super.addRules();

    // *** PROMOTION (Grand zone) *** //
    if (this.promotionRule.value === 'Grand') {
      this.promotingType ??= this.pawn;
      // Grand Chess: optional promotion on ranks 7–8, mandatory on rank 9
      // (the last rank in 0-indexed coordinates).
      this.addPromoteByReplacementRule(this.promotingType, (loc: Location) => {
        if (loc.rank === 9) return PromotionOption.MustPromote;
        if (loc.rank === 7 || loc.rank === 8) return PromotionOption.CanPromote;
        return PromotionOption.CannotPromote;
      });
    }

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

    if (value === 'Standard' || value === '2R Standard') {
      this.addCastlingRule();
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
    } else if (value === 'Long' || value === '2R Long') {
      this.addCastlingRule();
      if (kingFile === 'f') {
        this.castlingMove(0, `f${r1}`, `i${r1}`, `j${r1}`, `h${r1}`, shredder ? 'J' : 'K');
        this.castlingMove(0, `f${r1}`, `b${r1}`, `a${r1}`, `c${r1}`, shredder ? 'A' : 'Q');
        this.castlingMove(1, `f${rN}`, `i${rN}`, `j${rN}`, `h${rN}`, shredder ? 'j' : 'k');
        this.castlingMove(1, `f${rN}`, `b${rN}`, `a${rN}`, `c${rN}`, shredder ? 'a' : 'q');
      } else {
        this.castlingMove(0, `e${r1}`, `b${r1}`, `a${r1}`, `c${r1}`, 'A');
        this.castlingMove(0, `e${r1}`, `i${r1}`, `j${r1}`, `h${r1}`, 'J');
        this.castlingMove(1, `e${rN}`, `b${rN}`, `a${rN}`, `c${rN}`, 'a');
        this.castlingMove(1, `e${rN}`, `i${rN}`, `j${rN}`, `h${rN}`, 'j');
      }
    } else if (value === 'Flexible' || value === '2R Flexible') {
      this.addFlexibleCastlingRule();
      if (kingFile === 'f') {
        this.flexibleCastlingMove(0, `f${r1}`, `h${r1}`, `j${r1}`, shredder ? 'J' : 'K');
        this.flexibleCastlingMove(0, `f${r1}`, `d${r1}`, `a${r1}`, shredder ? 'A' : 'Q');
        this.flexibleCastlingMove(1, `f${rN}`, `h${rN}`, `j${rN}`, shredder ? 'j' : 'k');
        this.flexibleCastlingMove(1, `f${rN}`, `d${rN}`, `a${rN}`, shredder ? 'a' : 'q');
      } else {
        this.flexibleCastlingMove(0, `e${r1}`, `c${r1}`, `a${r1}`, 'A');
        this.flexibleCastlingMove(0, `e${r1}`, `g${r1}`, `j${r1}`, 'J');
        this.flexibleCastlingMove(1, `e${rN}`, `c${rN}`, `a${rN}`, 'a');
        this.flexibleCastlingMove(1, `e${rN}`, `g${rN}`, `j${rN}`, 'j');
      }
    } else if (value === 'Close-Rook' || value === '2R Close-Rook') {
      this.addCastlingRule();
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
    } else if (value === 'Close-Rook Flexible' || value === '2R Close-Rook Flexible') {
      this.addFlexibleCastlingRule();
      if (kingFile === 'f') {
        this.flexibleCastlingMove(0, `f${r1}`, `h${r1}`, `i${r1}`, 'I');
        this.flexibleCastlingMove(0, `f${r1}`, `d${r1}`, `b${r1}`, 'B');
        this.flexibleCastlingMove(1, `f${rN}`, `h${rN}`, `i${rN}`, 'i');
        this.flexibleCastlingMove(1, `f${rN}`, `d${rN}`, `b${rN}`, 'b');
      } else {
        this.flexibleCastlingMove(0, `e${r1}`, `c${r1}`, `b${r1}`, 'B');
        this.flexibleCastlingMove(0, `e${r1}`, `g${r1}`, `i${r1}`, 'I');
        this.flexibleCastlingMove(1, `e${rN}`, `c${rN}`, `b${rN}`, 'b');
        this.flexibleCastlingMove(1, `e${rN}`, `g${rN}`, `i${rN}`, 'i');
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
