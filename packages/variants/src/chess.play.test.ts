/**
 * End-to-end play tests for Standard Chess: exercises committed-move making,
 * checkmate detection and takeback through the public `Game` API (the path the
 * UI uses), complementing the perft tests which drive move generation.
 */
import type { Game } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { Chess } from './v8x8/chess.js';

/** Play the legal move from `from` to `to` (square notation). */
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

function freshGame(): Game {
  const game = new Chess();
  game.initialize();
  return game;
}

describe('Standard Chess — committed play', () => {
  it('starts with White to move and no result', () => {
    const game = freshGame();
    expect(game.currentSide).toBe(0);
    expect(game.result.isNone).toBe(true);
  });

  it("detects Fool's Mate (Black wins)", () => {
    const game = freshGame();
    play(game, 'f2', 'f3');
    play(game, 'e7', 'e5');
    play(game, 'g2', 'g4');
    play(game, 'd8', 'h4'); // checkmate
    expect(game.result.isNone).toBe(false);
    expect(game.result.winner).toBe(1);
  });

  it('takes back moves cleanly', () => {
    const game = freshGame();
    play(game, 'e2', 'e4');
    play(game, 'e7', 'e5');
    expect(game.currentSide).toBe(0);
    game.undoMove();
    expect(game.currentSide).toBe(1);
    game.undoMove();
    expect(game.currentSide).toBe(0);
    // Back at the start: 20 legal moves again.
    const { count } = game.getRootMoves();
    expect(count).toBe(20);
  });
});
