/**
 * Perft (move-generation correctness) tests for Standard Chess.
 *
 * The expected node counts are the long-established perft values for the
 * standard chess starting position — any deviation localises a move-generation
 * or legality bug.
 */
import { describe, expect, it } from 'vitest';
import { Chess } from './v8x8/chess.js';

function perftNodes(depth: number): number {
  const game = new Chess();
  game.initialize();
  return game.perft(depth).nodes;
}

describe('Standard Chess perft', () => {
  it('depth 1 → 20', () => {
    expect(perftNodes(1)).toBe(20);
  });

  it('depth 2 → 400', () => {
    expect(perftNodes(2)).toBe(400);
  });

  it('depth 3 → 8902', () => {
    expect(perftNodes(3)).toBe(8902);
  });

  it('depth 4 → 197281', () => {
    expect(perftNodes(4)).toBe(197281);
  });
});

describe('Standard Chess perft — detailed leaf counts at depth 3', () => {
  it('matches known capture / castle / en-passant tallies', () => {
    const game = new Chess();
    game.initialize();
    const results = game.perft(3);
    expect(results.nodes).toBe(8902);
    expect(results.captures).toBe(34);
    expect(results.enPassants).toBe(0);
    expect(results.castles).toBe(0);
  });
});
