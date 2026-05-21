/**
 * Verifies that Chess with Different Armies honours `Game.optionOverrides`
 * (the per-side army selection surfaced in the UI) and exposes the two army
 * picks via {@link Game.getOptions}.
 */
import { describe, expect, it } from 'vitest';
import { ChessWithDifferentArmies } from './v8x8/chessWithDifferentArmies.js';

function setup(overrides?: Record<string, string>): ChessWithDifferentArmies {
  const game = new ChessWithDifferentArmies();
  if (overrides !== undefined) game.optionOverrides = overrides;
  game.initialize();
  return game;
}

describe('ChessWithDifferentArmies options', () => {
  it('defaults both sides to Fabulous FIDEs (so the game is plain chess)', () => {
    const game = setup();
    expect(game.whiteArmy.value).toBe('Fabulous FIDEs');
    expect(game.blackArmy.value).toBe('Fabulous FIDEs');
    // Standard chess starting position.
    expect(game.fenStart.split(' ')[0]).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  });

  it('exposes both armies via getOptions with the expected displayNames', () => {
    const game = setup();
    const options = game.getOptions();
    expect(options).toHaveLength(2);
    const labels = options.map((option) => option.displayName);
    expect(labels).toContain('White army');
    expect(labels).toContain('Black army');
  });

  it('applies optionOverrides set before initialize()', () => {
    const game = setup({ 'White army': 'Nutty Knights', 'Black army': 'Remarkable Rookies' });
    expect(game.whiteArmy.value).toBe('Nutty Knights');
    expect(game.blackArmy.value).toBe('Remarkable Rookies');
    // The back ranks reflect the chosen armies (Black's lower-case army comes
    // first in the FEN, then White's uppercase). See `backRank()` in the variant.
    const board = game.fenStart.split(' ')[0]!;
    expect(board).toContain('stlcklts'); // Remarkable Rookies (Black)
    expect(board).toContain('RLNCKNLR'); // Nutty Knights (White)
    expect(board).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  });

  it('ignores overrides for unknown option names', () => {
    const game = setup({ 'Bogus option': 'whatever' });
    expect(game.whiteArmy.value).toBe('Fabulous FIDEs');
  });
});
