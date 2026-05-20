/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/FischerRandomChess.cs
 ***************************************************************************/

import { GenericPiece } from '@chessv/engine';
import { Chess } from './chess.js';

/**
 * The ten KRN arrangements that remain after the two bishops and the queen
 * have been placed. The king must sit between the two rooks (so castling
 * directions are unambiguous).
 */
const KING_ROOK_KNIGHT: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ['n', 'n', 'r', 'k', 'r'],
  ['n', 'r', 'n', 'k', 'r'],
  ['n', 'r', 'k', 'n', 'r'],
  ['n', 'r', 'k', 'r', 'n'],
  ['r', 'n', 'n', 'k', 'r'],
  ['r', 'n', 'k', 'n', 'r'],
  ['r', 'n', 'k', 'r', 'n'],
  ['r', 'k', 'n', 'n', 'r'],
  ['r', 'k', 'n', 'r', 'n'],
  ['r', 'k', 'r', 'n', 'n'],
];

/**
 * Compute the 8-character back-rank string for the given Chess960 position
 * number (1..960). The standard encoding: light-bishop file ∈ {b,d,f,h},
 * dark-bishop file ∈ {a,c,e,g}, queen in one of the six remaining slots,
 * KRN drawn from the table above.
 */
export function chess960BackRank(positionNumber: number): string {
  const pieces = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
  let pos = positionNumber - 1;

  const lightBishop = pos % 4;
  pos = Math.floor(pos / 4);
  const darkBishop = pos % 4;
  pos = Math.floor(pos / 4);
  pieces[lightBishop * 2 + 1] = 'b';
  pieces[darkBishop * 2] = 'b';

  const queenSlot = pos % 6;
  pos = Math.floor(pos / 6);
  {
    let q = queenSlot;
    for (let x = 0; x < 8; x++) {
      if (pieces[x] === ' ' && q-- === 0) {
        pieces[x] = 'q';
        break;
      }
    }
  }

  const krn = KING_ROOK_KNIGHT[pos]!;
  for (let x = 0, y = 0; y < 5; x++) {
    if (pieces[x] === ' ') pieces[x] = krn[y++]!;
  }
  return pieces.join('');
}

/** Look up the (kingSquare, leftRookSquare, rightRookSquare) on white's back rank. */
function findKingAndRooks(
  game: FischerRandomChess,
): { kingSquare: string; leftRook: string; rightRook: string } | null {
  const whiteKing = new GenericPiece(0, game.king);
  const whiteRook = new GenericPiece(0, game.rook);
  let leftRook: string | null = null;
  let kingSquare: string | null = null;
  let rightRook: string | null = null;
  for (let file = 0; file < 8; file++) {
    const square = `${String.fromCharCode(97 + file)}1`;
    const piece = game.startingPieces.get(square);
    if (piece?.equals(whiteKing)) kingSquare = square;
    else if (piece?.equals(whiteRook)) {
      if (leftRook === null) leftRook = square;
      else rightRook = square;
    }
  }
  if (leftRook === null || rightRook === null || kingSquare === null) return null;
  return { kingSquare, leftRook, rightRook };
}

/**
 * Fischer Random Chess (Chess960) — Bobby Fischer's 1996 randomised opening
 * variant. The pieces on the back rank are shuffled (subject to the king
 * sitting between the two rooks and the bishops occupying squares of
 * opposite colour) so opening preparation is mostly neutralised.
 */
export class FischerRandomChess extends Chess {
  /** Position number 1..960; randomised at construction unless overridden. */
  positionNumber: number;

  constructor(positionNumber?: number) {
    super();
    this.positionNumber = positionNumber ?? Math.floor(Math.random() * 960) + 1;
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Fischer Random Chess';
    const backRank = chess960BackRank(this.positionNumber);
    this.array = `${backRank}/pppppppp/8/8/8/8/PPPPPPPP/${backRank.toUpperCase()}`;
    // Castling is wired manually in addRules — turn the parent's choice off.
    this.castling.value = 'None';
  }

  protected override addRules(): void {
    super.addRules();
    this.addFrcCastling();
  }

  protected addFrcCastling(): void {
    const found = findKingAndRooks(this);
    if (found === null) return;
    const { kingSquare, leftRook, rightRook } = found;
    const kingChar = kingSquare[0]!;
    const leftFile = leftRook[0]!;
    const rightFile = rightRook[0]!;
    this.addCastlingRule();
    // FRC: king ends on c1/g1; the rook ends on the king's other side (d1/f1).
    this.castlingMove(0, kingSquare, 'c1', leftRook, 'd1', leftFile.toUpperCase());
    this.castlingMove(0, kingSquare, 'g1', rightRook, 'f1', rightFile.toUpperCase());
    this.castlingMove(1, `${kingChar}8`, 'c8', `${leftFile}8`, 'd8', leftFile);
    this.castlingMove(1, `${kingChar}8`, 'g8', `${rightFile}8`, 'f8', rightFile);
  }
}

/**
 * Chess480 — John Kipling Lewis's 2005 variant on the Chess960 starting
 * positions but with simpler "king slides two toward the nearest rook"
 * castling. Falls back to a one-square slide when the king starts on the
 * b- or g-file.
 */
export class Chess480 extends FischerRandomChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chess480';
  }

  protected override addFrcCastling(): void {
    const found = findKingAndRooks(this);
    if (found === null) return;
    const { kingSquare, leftRook, rightRook } = found;
    const kingFile = kingSquare.charCodeAt(0);
    const kingChar = kingSquare[0]!;
    const leftFile = leftRook[0]!;
    const rightFile = rightRook[0]!;

    this.addCastlingRule();

    // Queenside (toward a-file).
    if (kingSquare === 'b1') {
      this.castlingMove(0, 'b1', 'a1', 'a1', 'b1', 'A');
      this.castlingMove(1, 'b8', 'a8', 'a8', 'b8', 'a');
    } else {
      const kingToFile = String.fromCharCode(kingFile - 2);
      const rookToFile = String.fromCharCode(kingFile - 1);
      this.castlingMove(
        0,
        kingSquare,
        `${kingToFile}1`,
        leftRook,
        `${rookToFile}1`,
        leftFile.toUpperCase(),
      );
      this.castlingMove(
        1,
        `${kingChar}8`,
        `${kingToFile}8`,
        `${leftFile}8`,
        `${rookToFile}8`,
        leftFile,
      );
    }

    // Kingside (toward h-file).
    if (kingSquare === 'g1') {
      this.castlingMove(0, 'g1', 'h1', 'h1', 'g1', 'H');
      this.castlingMove(1, 'g8', 'h8', 'h8', 'g8', 'h');
    } else {
      const kingToFile = String.fromCharCode(kingFile + 2);
      const rookToFile = String.fromCharCode(kingFile + 1);
      this.castlingMove(
        0,
        kingSquare,
        `${kingToFile}1`,
        rightRook,
        `${rookToFile}1`,
        rightFile.toUpperCase(),
      );
      this.castlingMove(
        1,
        `${kingChar}8`,
        `${kingToFile}8`,
        `${rightFile}8`,
        `${rookToFile}8`,
        rightFile,
      );
    }
  }
}
