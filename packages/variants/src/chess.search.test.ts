/**
 * Search (AI engine) tests for Standard Chess: verifies the alpha-beta search
 * returns legal moves and finds a forced mate.
 */
import { type Game, TimeControl } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { Chess } from './v8x8/chess.js';

function freshGame(): Game {
  const game = new Chess();
  game.initialize();
  return game;
}

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

describe('Standard Chess — alpha-beta search', () => {
  it('returns a legal move from the opening position', () => {
    const game = freshGame();
    const line = game.think(TimeControl.fixedDepth(4));
    expect(line.length).toBeGreaterThan(0);
    const best = line[0]!;
    // The chosen move must be one of the legal root moves.
    const { moves, count } = game.getRootMoves();
    const isLegal = moves
      .slice(0, count)
      .some((m) => m.fromSquare === best.fromSquare && m.toSquare === best.toSquare);
    expect(isLegal).toBe(true);
  });

  it('finds the mate-in-one (Qh4#) in the Fool’s Mate position', () => {
    const game = freshGame();
    play(game, 'f2', 'f3');
    play(game, 'e7', 'e5');
    play(game, 'g2', 'g4');
    // Black to move — d8-h4 is checkmate.
    const line = game.think(TimeControl.fixedDepth(4));
    expect(line.length).toBeGreaterThan(0);
    expect(game.getSquareNotation(line[0]!.fromSquare)).toBe('d8');
    expect(game.getSquareNotation(line[0]!.toSquare)).toBe('h4');

    // Playing it should end the game with Black winning.
    game.makeMovement(line[0]!, false);
    expect(game.result.isNone).toBe(false);
    expect(game.result.winner).toBe(1);
  });

  it('respects a fixed-node time control', () => {
    const game = freshGame();
    game.think(TimeControl.fixedNodes(20000));
    expect(game.statistics.nodes).toBeGreaterThan(0);
  });
});
