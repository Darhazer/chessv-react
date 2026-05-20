/**
 * PGN round-trip tests for Standard Chess.
 */
import { applyMoveToken, exportPgn, type Game, importPgn } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { Chess } from './v8x8/chess.js';

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

describe('PGN round-trip', () => {
  it('exports and re-imports a short game (Italian opening)', () => {
    const g1 = new Chess();
    g1.initialize();
    play(g1, 'e2', 'e4');
    play(g1, 'e7', 'e5');
    play(g1, 'g1', 'f3');
    play(g1, 'g8', 'f6');
    play(g1, 'f1', 'c4');
    play(g1, 'f8', 'c5');
    play(g1, 'e1', 'g1'); // O-O (white)
    play(g1, 'e8', 'g8'); // O-O (black)

    const pgn = exportPgn(g1, g1.getMoveHistory(), { White: 'Alice', Black: 'Bob' });
    expect(pgn).toContain('[White "Alice"]');
    expect(pgn).toContain('[Black "Bob"]');
    expect(pgn).toContain('[Variant "Chess"]');
    expect(pgn).toMatch(/1\. e2-e4 e7-e5/);
    expect(pgn).toContain('O-O');

    const parsed = importPgn(pgn);
    expect(parsed.tags.White).toBe('Alice');
    expect(parsed.moves[0]).toBe('e2-e4');
    expect(parsed.moves).toContain('O-O');

    const g2 = new Chess();
    g2.initialize();
    for (const token of parsed.moves) applyMoveToken(g2, token);
    expect(g2.gameMoveNumber).toBe(8);
    expect(g2.currentSide).toBe(0);
  });

  it('records captures with × and parses them back', () => {
    const g = new Chess();
    g.initialize();
    play(g, 'e2', 'e4');
    play(g, 'd7', 'd5');
    play(g, 'e4', 'd5'); // capture

    const pgn = exportPgn(g, g.getMoveHistory());
    expect(pgn).toContain('e4xd5');

    const parsed = importPgn(pgn);
    expect(parsed.moves).toEqual(['e2-e4', 'd7-d5', 'e4xd5']);

    const g2 = new Chess();
    g2.initialize();
    for (const token of parsed.moves) applyMoveToken(g2, token);
    expect(g2.gameMoveNumber).toBe(3);
  });
});
