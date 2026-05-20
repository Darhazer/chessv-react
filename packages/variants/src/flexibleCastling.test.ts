/**
 * Verifies the FlexibleCastlingRule actually emits the extra-distance castling
 * destinations, by driving Schoolbook Chess to a position where the king's
 * kingside path (g1, h1, i1) is clear and the Chancellor still sits on j1.
 */
import { type Game, MoveType } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { SchoolbookChess } from './v10x8/capablancaChess.js';

function play(game: Game, from: string, to: string): void {
  const fromSquare = game.notationToSquare(from);
  const toSquare = game.notationToSquare(to);
  const { moves, count } = game.getRootMoves();
  for (let i = 0; i < count; i++) {
    if (moves[i]!.fromSquare === fromSquare && moves[i]!.toSquare === toSquare) {
      game.makeMove(moves[i]!, false);
      return;
    }
  }
  throw new Error(`No legal move ${from}-${to}`);
}

describe('FlexibleCastlingRule (Schoolbook Chess)', () => {
  it('offers two kingside castling destinations once the path is clear', () => {
    // Schoolbook initial back rank: RQNBAKBNCR.
    // White: a1=R b1=Q c1=N d1=B e1=A f1=K g1=B h1=N i1=C j1=R
    // Clear g1, h1, i1 by moving the knight, chancellor and bishop out.
    const game = new SchoolbookChess();
    game.initialize();

    play(game, 'h1', 'g3'); // Nh1-g3 — vacates h1
    play(game, 'h7', 'h6');
    play(game, 'i1', 'j3'); // Ci1-j3 (chancellor knight-jump) — vacates i1
    play(game, 'a7', 'a6');
    play(game, 'f2', 'f3'); // open the f-bishop's diagonal
    play(game, 'a6', 'a5');
    play(game, 'g1', 'f2'); // Bg1-f2 — vacates g1
    play(game, 'a5', 'a4');

    const { moves, count } = game.getRootMoves();
    const castlingMoves = moves
      .slice(0, count)
      .filter((m) => m.moveType === MoveType.Castling);

    const kingsideDestinations = new Set(
      castlingMoves
        .filter((m) => game.getSquareNotation(m.fromSquare) === 'f1')
        .map((m) => game.getSquareNotation(m.toSquare)),
    );
    // h1 = canonical (king slides 2 files toward the j1 partner);
    // i1 = extra-distance form unlocked by FlexibleCastlingRule
    // (king slides 3 files, partner jumps to h1 instead of g1).
    expect(kingsideDestinations.has('h1')).toBe(true);
    expect(kingsideDestinations.has('i1')).toBe(true);
  });
});
