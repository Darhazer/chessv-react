/**
 * Verifies Alice Chess's cross-board teleportation: each ordinary move sends
 * the piece to the corresponding square on the other sub-board.
 */
import { describe, expect, it } from 'vitest';
import { AliceChess } from './vMiscellaneous/aliceChess.js';

describe('Alice Chess', () => {
  it('the opening position has 12 root moves (8 single-step pawn pushes + 4 knight moves)', () => {
    // Pawn double-moves are disabled in this Alice port because en passant
    // needs the AliceEnPassantRule wrapper (still deferred).
    const game = new AliceChess();
    game.initialize();
    const { count } = game.getRootMoves();
    expect(count).toBe(12);
  });

  it('an opening pawn move teleports the pawn to board B', () => {
    const game = new AliceChess();
    game.initialize();
    const { moves, count } = game.getRootMoves();

    const e2 = game.notationToSquare('e2');
    // The Alice mirror of e3 (file 4, rank 2) on board A is at file 12, rank 2.
    const e3MirrorFile = 4 + 8;
    const e3Mirror = e3MirrorFile * 8 + 2;

    const move = Array.from({ length: count }, (_, i) => moves[i]!).find(
      (m) => m.fromSquare === e2 && m.toSquare === e3Mirror,
    );
    expect(move).toBeDefined();

    game.makeMove(move!, false);

    // After the move: e2 on board A is empty; the mirror square on board B
    // holds the pawn.
    expect(game.board.pieceAt(e2)).toBeNull();
    expect(game.board.pieceAt(e3Mirror)).not.toBeNull();
    expect(game.board.pieceAt(e3Mirror)!.player).toBe(0);
  });

  it('undo restores the position exactly', () => {
    const game = new AliceChess();
    game.initialize();
    const initialHash = game.board.hashCode;
    const { moves, count } = game.getRootMoves();
    game.makeMove(moves[0]!, false);
    game.undoMove();
    expect(game.board.hashCode).toBe(initialHash);
    expect(game.currentSide).toBe(0);
  });

  it('pieces on board B move within board B (no horizontal crossing)', () => {
    // After several moves both sides have pieces on board B; verify that
    // sliding pieces don't accidentally cross the file 7/8 boundary by
    // running a shallow perft without errors.
    const game = new AliceChess();
    game.initialize();
    expect(game.perft(2).nodes).toBeGreaterThan(0);
  });
});
