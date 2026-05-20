/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/MiscellaneousGames/AliceChess.cs
 ***************************************************************************/

import { type Board, type Direction, type PieceType, type Symmetry, TwoBoards } from '@chessv/engine';
import {
  AliceCastlingRule,
  AliceEnPassantRule,
  AliceFlexibleCastlingRule,
  AliceRule,
  FlexibleCastlingRule,
} from '@chessv/rules';
import { Chess } from '../v8x8/chess.js';

/**
 * Alice Chess — V. R. Parton (1953), the canonical two-board variant.
 *
 * Standard chess on two parallel boards. Each move teleports the piece to
 * the mirror square on the *other* sub-board (provided that square is
 * empty). Castling, en passant and the pawn double-move keep their
 * familiar semantics on the originating board, but with the additional
 * Alice constraint that the destination(s) on the other board must also
 * be empty. Those constraints live in the `Alice*` rule wrappers.
 */
export class AliceChess extends Chess {
  protected override createBoard(_numPlayers: number, numFiles: number, numRanks: number): Board {
    return new TwoBoards(numFiles, numRanks);
  }

  constructor(_symmetry?: Symmetry) {
    super();
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Alice Chess';
    // Standard chess setup on board A (files 0–7); board B (files 8–15)
    // starts empty. Each rank is explicitly padded to 16 files so the
    // parser doesn't leave any squares uncovered.
    this.array = 'rnbqkbnr8/pppppppp8/16/16/16/16/PPPPPPPP8/RNBQKBNR8';
    // The Alice-wrapped rules cover both boards; re-enable the standard
    // chess machinery they wrap.
    this.castling.value = 'Standard';
    this.enPassant = true;
    this.pawnDoubleMove = true;
  }

  protected override addCastlingRule(): void {
    this.castlingRule = new AliceCastlingRule();
    this.addRule(this.castlingRule);
  }

  protected override addFlexibleCastlingRule(): FlexibleCastlingRule {
    const rule = new AliceFlexibleCastlingRule();
    this.castlingRule = rule;
    this.addRule(rule);
    return rule;
  }

  protected override addEnPassantRule(pawnType: PieceType, direction: Direction): void {
    this.addRule(new AliceEnPassantRule(pawnType, this.getDirectionNumber(direction)));
  }

  protected override addRules(): void {
    super.addRules();
    const alice = new AliceRule();
    alice.royalType = this.king;
    this.addRule(alice);
  }
}
