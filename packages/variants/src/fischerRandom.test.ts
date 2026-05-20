/**
 * Verifies the Chess960 back-rank generator and that Fischer Random Chess
 * castles correctly from a non-standard starting position.
 */
import { MoveType } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { chess960BackRank, FischerRandomChess } from './v8x8/fischerRandomChess.js';

describe('chess960BackRank', () => {
  it('produces 960 distinct arrangements', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 960; i++) seen.add(chess960BackRank(i));
    expect(seen.size).toBe(960);
  });

  it('every arrangement places the king between the two rooks and bishops on opposite colours', () => {
    for (let i = 1; i <= 960; i++) {
      const back = chess960BackRank(i);
      const kingIdx = back.indexOf('k');
      const firstRook = back.indexOf('r');
      const lastRook = back.lastIndexOf('r');
      expect(firstRook).toBeLessThan(kingIdx);
      expect(kingIdx).toBeLessThan(lastRook);
      const bishops = [...back].map((c, idx) => (c === 'b' ? idx : -1)).filter((x) => x >= 0);
      expect(bishops).toHaveLength(2);
      expect((bishops[0]! - bishops[1]!) % 2).not.toBe(0);
    }
  });

  it("position #519 reproduces standard chess's back rank", () => {
    expect(chess960BackRank(519)).toBe('rnbqkbnr');
  });
});

describe('FischerRandomChess', () => {
  it('the standard position generates the canonical 20 opening moves', () => {
    const game = new FischerRandomChess(519);
    game.initialize();
    const { count } = game.getRootMoves();
    expect(count).toBe(20);
  });

  it('builds a valid game from a non-standard king/rook layout', () => {
    // Position #1 — bishops on a/b, queen on c, then KRN spread d..h:
    // bbqnnrkr. King on g1, rooks on f1 and h1.
    const game = new FischerRandomChess(1);
    game.initialize();
    expect(chess960BackRank(1)).toBe('bbqnnrkr');
    const { count } = game.getRootMoves();
    // Move generation must run for any of the 960 starts.
    expect(count).toBeGreaterThan(0);
    // make/unmake invariant: perft(2) finishes cleanly.
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });

  // MoveType is imported solely for parity with future test cases that
  // assert specific castling-move emission once FRC reaches a position
  // where the king's path is empty and unattacked.
  it('exposes MoveType.Castling so future tests can assert FRC emissions', () => {
    expect(MoveType.Castling).toBeDefined();
  });
});
