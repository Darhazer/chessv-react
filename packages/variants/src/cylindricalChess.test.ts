/**
 * Verifies the cylindrical board: stepping off the a-file lands on the
 * h-file (and vice versa), so sliders wrap around the board's edge.
 */
import { Direction } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { CylindricalChess } from './v8x8/cylindricalChess.js';

describe('Cylindrical Chess', () => {
  it('opens with the canonical 20 moves', () => {
    const game = new CylindricalChess();
    game.initialize();
    expect(game.getRootMoves().count).toBe(20);
  });

  it('a left-step from the a-file lands on the h-file (wrap-around)', () => {
    const game = new CylindricalChess();
    game.initialize();
    const a1 = game.notationToSquare('a1');
    const h1 = game.notationToSquare('h1');
    // West direction = (rank 0, file -1).
    const west = game.getDirectionNumber(new Direction(0, -1));
    expect(game.board.nextSquare(west, a1)).toBe(h1);
    // And east from h1 lands on a1.
    const east = game.getDirectionNumber(new Direction(0, 1));
    expect(game.board.nextSquare(east, h1)).toBe(a1);
  });

  it('runs a shallow perft cleanly', () => {
    const game = new CylindricalChess();
    game.initialize();
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });
});
