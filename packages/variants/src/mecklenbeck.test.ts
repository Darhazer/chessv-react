/**
 * Verifies Mecklenbeck Chess's multi-rank promotion zone: pawns may
 * promote on the 6th or 7th ranks (optional) and must on the 8th.
 */
import { type Game, MoveType, moveTypeHasProperty } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { MecklenbeckChess } from './v8x8/mecklenbeckChess.js';

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

describe('Mecklenbeck Chess', () => {
  it('opens with the canonical 20 moves', () => {
    const game = new MecklenbeckChess();
    game.initialize();
    expect(game.getRootMoves().count).toBe(20);
  });

  it('a pawn reaching the 6th rank may optionally promote', () => {
    // White e-pawn marches up the file with the e-file otherwise empty.
    const game = new MecklenbeckChess();
    game.initialize();
    play(game, 'e2', 'e4');
    play(game, 'a7', 'a6'); // black quiet move
    play(game, 'e4', 'e5');
    play(game, 'a6', 'a5');
    // e5-e6 — the destination (rank 5 in 0-indexed terms = the 6th rank)
    // is the optional-promotion zone.
    const e5 = game.notationToSquare('e5');
    const e6 = game.notationToSquare('e6');
    const { moves, count } = game.getRootMoves();
    const matchingMoves = Array.from({ length: count }, (_, i) => moves[i]!).filter(
      (m) => m.fromSquare === e5 && m.toSquare === e6,
    );
    // At least one plain move + one promotion choice per available type.
    const promotionMoves = matchingMoves.filter((m) =>
      moveTypeHasProperty(m.moveType, MoveType.PromotionProperty),
    );
    const plainMoves = matchingMoves.filter((m) => m.moveType === MoveType.StandardMove);
    expect(plainMoves.length).toBe(1);
    expect(promotionMoves.length).toBe(4); // Q, R, B, N
  });

  it('runs a shallow perft cleanly', () => {
    const game = new MecklenbeckChess();
    game.initialize();
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });
});
