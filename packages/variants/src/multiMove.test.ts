/**
 * Verifies the multi-move completion rules: after white's single opening move,
 * each side plays two consecutive moves per turn (with Marseillais's
 * check-truncation exception).
 */
import { describe, expect, it } from 'vitest';
import { DoublemoveChess, MarseillaisChess } from './v8x8/multiMoveChess.js';

describe('DoublemoveChess', () => {
  it('white opens with a single move, then both sides move twice', () => {
    const game = new DoublemoveChess();
    game.initialize();
    expect(game.currentSide).toBe(0);

    // Move 1 — white's only move of turn 1.
    const m1 = game.getRootMoves();
    const e2e4 = Array.from({ length: m1.count }, (_, i) => m1.moves[i]!).find(
      (m) => game.getSquareNotation(m.fromSquare) === 'e2' && game.getSquareNotation(m.toSquare) === 'e4',
    );
    expect(e2e4).toBeDefined();
    game.makeMove(e2e4!, false);
    expect(game.currentSide).toBe(1);

    // Move 2 — black's first of two.
    const m2 = game.getRootMoves();
    const e7e5 = Array.from({ length: m2.count }, (_, i) => m2.moves[i]!).find(
      (m) => game.getSquareNotation(m.fromSquare) === 'e7' && game.getSquareNotation(m.toSquare) === 'e5',
    );
    expect(e7e5).toBeDefined();
    game.makeMove(e7e5!, false);
    // Black still has the move (second of two).
    expect(game.currentSide).toBe(1);

    // Move 3 — black's second of two.
    const m3 = game.getRootMoves();
    const d7d5 = Array.from({ length: m3.count }, (_, i) => m3.moves[i]!).find(
      (m) => game.getSquareNotation(m.fromSquare) === 'd7' && game.getSquareNotation(m.toSquare) === 'd5',
    );
    expect(d7d5).toBeDefined();
    game.makeMove(d7d5!, false);
    // Now white's turn.
    expect(game.currentSide).toBe(0);
  });

  it('undo restores the multi-move state', () => {
    const game = new DoublemoveChess();
    game.initialize();
    const m1 = game.getRootMoves();
    const move = Array.from({ length: m1.count }, (_, i) => m1.moves[i]!).find(
      (m) => game.getSquareNotation(m.fromSquare) === 'e2' && game.getSquareNotation(m.toSquare) === 'e4',
    )!;
    game.makeMove(move, false);
    expect(game.currentSide).toBe(1);
    game.undoMove();
    expect(game.currentSide).toBe(0);
  });
});

describe('MarseillaisChess', () => {
  it('initialises and generates legal moves', () => {
    const game = new MarseillaisChess();
    game.initialize();
    expect(game.getRootMoves().count).toBe(20);
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });
});
