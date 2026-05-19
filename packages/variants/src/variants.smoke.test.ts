/**
 * Smoke tests for the registered variants: each must initialize, expose legal
 * moves, and run a shallow perft without error.
 */
import { describe, expect, it } from 'vitest';
import { createVariant, listVariants } from './registry.js';
// Importing the index registers every variant.
import './index.js';

describe('variant registry', () => {
  it('registers the Phase 3 batch', () => {
    const names = listVariants().map((v) => v.name);
    expect(names).toContain('Chess');
    expect(names).toContain('Shatranj');
    expect(names).toContain('Makruk');
    expect(names).toContain('Knightmate');
  });

  for (const meta of listVariants()) {
    it(`${meta.name} initializes and generates moves`, () => {
      const game = createVariant(meta.name);
      game.initialize();
      const { count } = game.getRootMoves();
      expect(count).toBeGreaterThan(0);
      // A shallow perft must complete without throwing.
      expect(game.perft(2).nodes).toBeGreaterThan(0);
    });
  }
});
