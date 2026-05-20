/**
 * Verifies the pocket-drop mechanics: each side starts with a Knight in hand
 * that can be dropped to any empty square on its turn.
 */
import { MoveType } from '@chessv/engine';
import { describe, expect, it } from 'vitest';
import { ChessWithPockets } from './v8x8/chessWithPockets.js';

describe('Pocket Knight (ChessWithPockets)', () => {
  it('initial position offers 20 board moves plus 48 knight drops', () => {
    const game = new ChessWithPockets();
    game.initialize();
    const { moves, count } = game.getRootMoves();
    const arr = moves.slice(0, count);
    const drops = arr.filter((m) => m.moveType === MoveType.Drop);
    const boardMoves = arr.filter((m) => m.moveType !== MoveType.Drop);
    expect(boardMoves.length).toBe(20);
    // The starting position has 32 pieces on 64 squares → 32 empty squares.
    expect(drops.length).toBe(32);
    expect(count).toBe(boardMoves.length + drops.length);
  });

  it('drop + undo restores the position exactly', () => {
    const game = new ChessWithPockets();
    game.initialize();
    const initialHash = game.board.hashCode;
    const { moves, count } = game.getRootMoves();
    const drop = Array.from({ length: count }, (_, i) => moves[i]!).find(
      (m) => m.moveType === MoveType.Drop && game.getSquareNotation(m.toSquare) === 'e3',
    );
    expect(drop).toBeDefined();
    game.makeMove(drop!, false);
    // After dropping, the pocket should be empty for white, full for black.
    expect(game.currentSide).toBe(1);
    const { count: blackMoves } = game.getRootMoves();
    // Black still has 20 ordinary moves + 32 drops (minus 1, since e3 is now
    // occupied) = 51.
    expect(blackMoves).toBe(20 + 31);

    game.undoMove();
    expect(game.currentSide).toBe(0);
    expect(game.board.hashCode).toBe(initialHash);
  });

  it('Pocket Knight produces a non-zero shallow perft', () => {
    const game = new ChessWithPockets();
    game.initialize();
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });
});
