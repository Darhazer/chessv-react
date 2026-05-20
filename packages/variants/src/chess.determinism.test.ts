/**
 * Hardening: the alpha-beta search is deterministic. Searching the same
 * position to the same depth from two independent `Game` objects must return
 * the same best move and the same node count.
 */
import { TimeControl } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { Chess } from './v8x8/chess.js';

describe('search determinism', () => {
  it('two independent searches of the start position match exactly', () => {
    const g1 = new Chess();
    g1.initialize();
    const line1 = g1.think(TimeControl.fixedDepth(5));
    const nodes1 = g1.statistics.nodes;

    const g2 = new Chess();
    g2.initialize();
    const line2 = g2.think(TimeControl.fixedDepth(5));
    const nodes2 = g2.statistics.nodes;

    expect(line1.length).toBeGreaterThan(0);
    expect(line2.length).toBeGreaterThan(0);
    expect(line1[0]!.hash).toBe(line2[0]!.hash);
    expect(nodes1).toBe(nodes2);
  });
});
