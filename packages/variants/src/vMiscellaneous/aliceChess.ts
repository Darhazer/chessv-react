/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/MiscellaneousGames/AliceChess.cs
 *
 *  Phase note: ChessV ships AliceCastlingRule, AliceFlexibleCastlingRule and
 *  AliceEnPassantRule that wrap their non-Alice counterparts with the
 *  cross-board emptiness check. Those are deferred in this initial port;
 *  Alice Chess plays with castling and en passant disabled, which is the
 *  most common simplification in published rules.
 ***************************************************************************/

import { type Board, type Symmetry, TwoBoards } from '@chessv/engine';
import { AliceRule, CastlingRule, EnPassantRule } from '@chessv/rules';
import { Chess } from '../v8x8/chess.js';

/** Alice Chess — V. R. Parton (1953), the canonical two-board variant. */
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
    // Castling and en passant need wrapping Alice* rules; disable them
    // for the initial port.
    this.castling.value = 'None';
    this.enPassant = false;
    this.pawnDoubleMove = false;
  }

  protected override addRules(): void {
    super.addRules();
    // Be defensive: if any base class wired up castling or en-passant,
    // drop them — the Alice teleport would let pieces cross-board in ways
    // those rules don't account for.
    this.removeRule(CastlingRule);
    this.removeRule(EnPassantRule);
    const alice = new AliceRule();
    alice.royalType = this.king;
    this.addRule(alice);
  }
}
