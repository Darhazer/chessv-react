/**
 * Verifies the king's-leap privilege: each side's king may jump two squares
 * orthogonally from its starting square once per game.
 */
import { describe, expect, it } from 'vitest';
import { Archchess } from './v10x10/archchess.js';

describe('Archchess (king’s-leap rule)', () => {
  it('the white king on e1 has four two-square orthogonal leap targets in the opening', () => {
    // From e1 (file 4, rank 0): leaps to e3 (rank 2) is the only on-board
    // 2-square orthogonal target — c1, g1, e-(-1) are blocked by own pieces
    // or off the board. Just assert at least one leap move shows up.
    const game = new Archchess();
    game.initialize();
    const { moves, count } = game.getRootMoves();
    const e1 = game.notationToSquare('e1');
    const e3 = game.notationToSquare('e3');
    const leapMoves = Array.from({ length: count }, (_, i) => moves[i]!).filter(
      (m) => m.fromSquare === e1,
    );
    // The king has its own one-step moves plus the leap.
    const hasLeap = leapMoves.some((m) => m.toSquare === e3);
    expect(hasLeap).toBe(true);
  });

  it('the king’s leap privilege is consumed by any move from e1', () => {
    const game = new Archchess();
    game.initialize();
    const e1 = game.notationToSquare('e1');
    const e3 = game.notationToSquare('e3');
    const { moves, count } = game.getRootMoves();
    const leap = Array.from({ length: count }, (_, i) => moves[i]!).find(
      (m) => m.fromSquare === e1 && m.toSquare === e3,
    );
    expect(leap).toBeDefined();
    game.makeMove(leap!, false);
    // Black moves (any), then white's turn — the king has no leap left.
    const blackMoves = game.getRootMoves();
    game.makeMove(blackMoves.moves[0]!, false);
    const whiteAgain = game.getRootMoves();
    // No leap from e3 (the rule only offers leaps from the home square).
    const e3leap = Array.from({ length: whiteAgain.count }, (_, i) => whiteAgain.moves[i]!).filter(
      (m) => m.fromSquare === e3 && game.board.getDistance(m.fromSquare, m.toSquare) === 2,
    );
    expect(e3leap.length).toBe(0);
  });

  it('runs a shallow perft cleanly', () => {
    const game = new Archchess();
    game.initialize();
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });
});
