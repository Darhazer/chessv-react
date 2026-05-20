# Phase 4 — deferred UI / presentation work

Phase 4 delivered the high-value UI items (PGN, review mode, captured-pieces
panel, a colour-scheme picker, the first bitmap piece set). The post-Phase-5
session then ported the rest of the colour-scheme library, all five remaining
bitmap piece sets, added `localStorage` settings persistence, and an
accessibility pass. The items below remain deferred — most are independent
and can be added any time.

## 1. Multi-board / pocket presentations (still deferred)

The C# `BoardWithPocketsPresentation`, `BoardWithHandsPresentation` and
`TwoBoardsPresentation` from `ChessV.GUI/BoardPresentations/` render variants
that don't fit a single rectangular board:

- **Pockets** (Chess With Pockets, Shogi-style drops): off-board reservoir
  squares where held pieces wait to be dropped.
- **Hands** (Shogi family): per-side trays of captured/held pieces.
- **Two boards** (Alice Chess and friends): two parallel boards rendered
  side by side, with mid-game teleportation between them.

These are blocked on engine support (drop / pocket squares, multi-board
geometry — see `docs/phase-3-deferred.md` §5 and §7). The UI work itself is
modest once the engine pieces exist: extend `BoardView` to render the extra
zones and accept clicks on them, and add `from = pocketSquare` to move input.

## 2. Board-texture themes (still deferred)

`ChessV.GUI/Texture.cs` and the 21 texture folders under `Graphics/Textures/`
(Blue Marble, Stone, Dark Wood, Light Metal, …) render board squares and
borders with tileable images instead of flat colours. Each folder has a
`properties.txt` with the base ARGB colour. To port: convert the PNGs into
the UI asset pipeline (similar to the bitmap piece pipeline), let
`ColorScheme` reference a texture id, and have `BoardView` use SVG
`<pattern>` for textured squares. The six texture-based colour schemes
(Luna Decorabat, Marmoor Quadraut, Lemon Cappuccino, Rosaliya, Brushed
Steel, Norwegian Wood) are skipped from `assets/colorSchemes.json` until
this lands.

## Delivered post-Phase-5

- **Full ColorSchemeLibrary port** — 20 schemes ship: 5 hand-tuned plus
  15 ported from `ChessV.GUI/ColorSchemeLibrary.cs` (see
  `packages/ui/src/assets/colorSchemes.json`). Overlays are derived from
  each scheme's `HighlightColor`; texture schemes await §2.
- **Remaining bitmap piece sets** — all six sets ship: Standard, Abstract,
  Small (shared mode), Motif, Eurasian, Runes (per-side mode).
  `tools/convert-assets.ts` is now configuration-driven.
- **Settings persistence** — `useLocalStorage` persists theme, piece set,
  AI side and AI depth across sessions under the `chessv:` key prefix.
- **Accessibility** — roving `tabindex` + arrow-key navigation on the
  board, ARIA labels announcing each square's contents, a dashed focus
  ring on the currently keyboard-focused square, and a new "High
  Contrast" colour scheme.
