# Phase 4 — UI / presentation work ✅ COMPLETE

Every UI item planned for Phase 4 has shipped. Preserved as a port reference.

## Delivered

- **PGN import / export, review mode, captured-pieces panel** — Phase 4
  original scope.
- **Multi-board / pocket presentations** —
  `packages/ui/src/components/BoardView.tsx` detects `TwoBoards` and
  `BoardWithPockets` from the engine and renders accordingly. Pockets
  sit above (black's) and below (white's) the main board and are
  clickable like ordinary squares; two-board layouts draw the two halves
  side-by-side with a 32-pixel gap.
- **Full ColorSchemeLibrary port** — 26 schemes ship: 5 hand-tuned plus
  21 ported from `ChessV.GUI/ColorSchemeLibrary.cs`
  (`packages/ui/src/assets/colorSchemes.json`). Overlays are derived from
  each scheme's `HighlightColor`.
- **Remaining bitmap piece sets** — all six sets ship: Standard, Abstract,
  Small (shared mode), Motif, Eurasian, Runes (per-side mode).
  `tools/convert-assets.ts` is configuration-driven.
- **Board-texture themes** — the 21 ChessV texture folders are converted
  to 64×64 PNGs in `packages/ui/public/assets/textures/`, with a
  manifest at `packages/ui/src/assets/textures.json`. `ColorScheme` now
  carries optional `lightTexture` / `darkTexture` fields that resolve to
  named textures; `BoardView` renders textured squares via an SVG
  `<pattern>` and falls back to the texture's `substituteColor` while
  the PNG loads. The six previously-skipped C# schemes (Luna Decorabat,
  Marmoor Quadraut, Lemon Cappuccino, Rosaliya, Brushed Steel, Norwegian
  Wood) now ship.
- **Settings persistence** — `useLocalStorage` persists theme, piece set,
  AI side and AI depth across sessions under the `chessv:` key prefix.
- **Accessibility** — roving `tabindex` + arrow-key navigation on the
  board, ARIA labels announcing each square's contents, a dashed focus
  ring on the currently keyboard-focused square, and a new "High
  Contrast" colour scheme.

## Future ideas (out of scope for the original port)

- Keyboard move input (Enter/Space selects, arrows move the focus, second
  Enter activates). The roving-tabindex infrastructure is already there.
- Per-variant default theme on first run — variants in the registry
  already carry a `colorScheme` field; today we just use it for the
  initial render. Persisting per-variant theme overrides would be a
  small addition to `useLocalStorage`.
- Multi-piece pocket presentation (Shogi-style hands). Would extend the
  current single-cell pocket renderer to a row of pocket cells once the
  Shogi-family engine support lands.
