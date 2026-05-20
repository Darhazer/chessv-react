/**
 * Hardening: for every registered variant, play a sequence of random legal
 * moves, then undo them all. The board's Zobrist hash and FEN string must
 * exactly match the starting state — any mismatch reveals an incremental-state
 * bug (hash, piece-list, material counter, …) somewhere in make/unmake or one
 * of the rules.
 *
 * Uses a seeded PRNG so failures are reproducible.
 */
import { describe, expect, it } from 'vitest';
import { createVariant, listVariants } from './registry.js';
// Importing the index registers every variant.
import './index.js';

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANDOM_SEED = 0xc0ffee;
const MAX_MOVES = 20;

describe('make / unmake invariant', () => {
  for (const meta of listVariants()) {
    it(`${meta.name}: random play then full takeback restores the start position`, () => {
      const game = createVariant(meta.name);
      game.initialize();

      const startHash = game.board.hashCode;
      const startFen = game.getFEN().toString();
      const startSide = game.currentSide;

      const random = mulberry32(RANDOM_SEED ^ meta.name.length);

      let played = 0;
      for (let i = 0; i < MAX_MOVES; i++) {
        if (!game.result.isNone) break;
        const { moves, count } = game.getRootMoves();
        if (count === 0) break;
        const choice = Math.floor(random() * count);
        // Snapshot the move's identity before making it — the underlying
        // MoveInfo object is reused on the next generation.
        const move = moves[choice]!.clone();
        game.makeMove(moves[choice]!, false);
        played++;
        // Live consistency check: gameMoveNumber must match.
        expect(game.gameMoveNumber).toBe(played);
        // The move's hash should be retrievable from the history.
        expect(game.getMoveHistory()[played - 1]!.hash).toBe(move.hash);
      }

      while (game.gameMoveNumber > 0) game.undoMove();

      expect(game.gameMoveNumber).toBe(0);
      expect(game.currentSide).toBe(startSide);
      expect(game.board.hashCode).toBe(startHash);
      expect(game.getFEN().toString()).toBe(startFen);
    });
  }
});
