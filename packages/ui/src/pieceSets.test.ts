import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PIECE_SET,
  PIECE_SETS,
  pickPieceSet,
  resolvePieceImage,
} from './pieceSets.js';

describe('resolvePieceImage', () => {
  it('returns the entry under the first matching name', () => {
    const standard = PIECE_SETS.Standard!;
    expect(resolvePieceImage(standard, ['King'])).toBe(standard.pieces.King);
  });

  it('walks the preference list to find a fallback', () => {
    // "Diamond Pawn" is not in any set; the variant pushes "Pawn" as a
    // fallback in the imagePreferenceList so it inherits the Pawn image.
    const standard = PIECE_SETS.Standard!;
    expect(resolvePieceImage(standard, ['Diamond Pawn', 'Pawn'])).toBe(
      standard.pieces.Pawn,
    );
  });

  it('returns undefined when no name matches', () => {
    const standard = PIECE_SETS.Standard!;
    expect(resolvePieceImage(standard, ['Wizard'])).toBeUndefined();
  });
});

describe('pickPieceSet', () => {
  it('keeps the preferred set when it covers every piece', () => {
    // Standard chess: K Q R B N P — Standard set has all six.
    const pieces = [['King'], ['Queen'], ['Rook'], ['Bishop'], ['Knight'], ['Pawn']];
    expect(pickPieceSet('Standard', pieces)).toBe('Standard');
  });

  it('auto-switches to the first set that covers the variant', () => {
    // Omega Chess piece types — Standard ships Champion but not Wizard,
    // so we should skip Standard and land on Abstract (the first set with
    // both Wizard and Champion in declaration order).
    const pieces = [
      ['King'],
      ['Queen'],
      ['Rook'],
      ['Bishop'],
      ['Knight'],
      ['Pawn'],
      ['Wizard'],
      ['Champion'],
    ];
    expect(pickPieceSet('Standard', pieces)).toBe('Abstract');
  });

  it('respects an explicit Unicode (null) choice', () => {
    const pieces = [['Wizard']];
    expect(pickPieceSet('Unicode', pieces)).toBe('Unicode');
  });

  it('falls back to the default when the preferred name is unknown', () => {
    const pieces = [['King']];
    expect(pickPieceSet('NotARealSet', pieces)).toBe(DEFAULT_PIECE_SET);
  });

  it('uses imagePreferenceList fallbacks when checking coverage', () => {
    // A "Diamond Pawn" piece falls back to "Pawn" via its preference list,
    // so Standard does cover it even without a "Diamond Pawn" entry.
    const pieces = [['King'], ['Diamond Pawn', 'Pawn']];
    expect(pickPieceSet('Standard', pieces)).toBe('Standard');
  });

  it('returns the preferred set when no set can cover the variant', () => {
    // A piece type whose preference list contains only names that no set
    // ships — we keep the user's pick rather than picking an unrelated set.
    const pieces = [['Definitely Not A Real Piece']];
    expect(pickPieceSet('Standard', pieces)).toBe('Standard');
  });
});
