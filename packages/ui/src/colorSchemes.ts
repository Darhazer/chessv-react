/**
 * Board colour schemes. The four originals (Classic Wood, Slate Blue, Sea
 * Green, Cinnamon, High Contrast) are hand-tuned for the web port; the rest
 * are ported from `ChessV.GUI/ColorSchemeLibrary.cs` via
 * `assets/colorSchemes.json` and derived to the `ColorScheme` shape below.
 */

import library from './assets/colorSchemes.json' with { type: 'json' };

export interface ColorScheme {
  /** Display name. */
  name: string;
  /** Light squares. */
  light: string;
  /** Dark squares. */
  dark: string;
  /** Selected-square highlight. */
  selected: string;
  /** Legal-move target marker. */
  target: string;
  /** Last-move highlight. */
  lastMove: string;
}

/** Hex `#RRGGBB` → `rgba(r,g,b,a)`. */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface RawScheme {
  name: string;
  light: string;
  dark: string;
  accent: string;
}

/** Derive a full `ColorScheme` from the raw light/dark/accent palette. */
function expand(raw: RawScheme): ColorScheme {
  return {
    name: raw.name,
    light: raw.light,
    dark: raw.dark,
    // Use the ChessV HighlightColor as the selection tint, with a moderate
    // alpha so the underlying square is still visible.
    selected: withAlpha(raw.accent, 0.55),
    // Move targets are a darker shade of the accent to read on both light
    // and dark squares.
    target: withAlpha(raw.accent, 0.45),
    // Use a warm yellow tint for the last-move highlight regardless of the
    // scheme — it stays distinct from the selection colour.
    lastMove: 'rgba(255, 220, 90, 0.42)',
  };
}

/**
 * The hand-tuned bundled schemes appear first; the ported ChessV library
 * follows. `Cinnamon` exists in both; the bundled version wins because the
 * derived overlay colours were tuned for it.
 */
const BUNDLED: ColorScheme[] = [
  {
    name: 'Classic Wood',
    light: '#e9d8b8',
    dark: '#9c6b3c',
    selected: '#f6e27a',
    target: 'rgba(40, 120, 40, 0.55)',
    lastMove: 'rgba(240, 220, 90, 0.45)',
  },
  {
    name: 'Slate Blue',
    light: '#dbe2ec',
    dark: '#3f5470',
    selected: '#f2c94c',
    target: 'rgba(56, 96, 168, 0.55)',
    lastMove: 'rgba(255, 204, 102, 0.4)',
  },
  {
    name: 'Sea Green',
    light: '#eaeed5',
    dark: '#7b9b65',
    selected: '#f3e266',
    target: 'rgba(40, 100, 60, 0.55)',
    lastMove: 'rgba(255, 215, 90, 0.4)',
  },
  {
    name: 'Cinnamon',
    light: '#f4d8a5',
    dark: '#a0522d',
    selected: '#ffe27a',
    target: 'rgba(70, 100, 40, 0.55)',
    lastMove: 'rgba(255, 230, 120, 0.4)',
  },
  {
    // Maximum-contrast palette for low-vision use: pure white / black squares
    // with saturated cyan/yellow highlights that are distinguishable on both.
    name: 'High Contrast',
    light: '#ffffff',
    dark: '#000000',
    selected: 'rgba(0, 200, 255, 0.55)',
    target: 'rgba(255, 220, 0, 0.7)',
    lastMove: 'rgba(255, 100, 0, 0.5)',
  },
];

const bundledNames = new Set(BUNDLED.map((s) => s.name));
const ported = (library.schemes as RawScheme[])
  .filter((raw) => !bundledNames.has(raw.name))
  .map(expand);

export const COLOR_SCHEMES: ColorScheme[] = [...BUNDLED, ...ported];

export const DEFAULT_SCHEME = COLOR_SCHEMES[0]!;
