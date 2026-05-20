/**
 * Board colour schemes. Picked from the `[Appearance(ColorScheme=...)]`
 * presets used by ChessV's GUI — a much fuller library lives in
 * `ChessV.GUI/ColorSchemeLibrary.cs` and will be ported with the theme work.
 */

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

export const COLOR_SCHEMES: ColorScheme[] = [
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
];

export const DEFAULT_SCHEME = COLOR_SCHEMES[0]!;
