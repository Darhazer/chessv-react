# Phase 4 — deferred UI / presentation work

Phase 4 delivered the high-value UI items (PGN, review mode, captured-pieces
panel, a colour-scheme picker, the first bitmap piece set). The items below
are deferred — most are independent and can be added any time.

## 1. Multi-board / pocket presentations

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

## 2. Full ColorSchemeLibrary port

ChessV's `ChessV.GUI/ColorSchemeLibrary.cs` ships hundreds of named board
colour schemes (e.g. "Luna Decorabat", "Cinnamon", "Stone", …). Today the
port ships four schemes in `packages/ui/src/colorSchemes.ts`. To port the
full library: extract each scheme from `ColorSchemeLibrary.cs` into the JSON
data file, then key variants' default schemes by name (the registry already
carries a `colorScheme` field per variant).

## 3. Board-texture themes

`ChessV.GUI/Texture.cs` and the 21 texture folders under `Graphics/Textures/`
(Blue Marble, Stone, Dark Wood, Light Metal, …) render board squares and
borders with tileable images instead of flat colours. Each folder has a
`properties.txt` with the base ARGB colour. To port: convert the PNGs into
the UI asset pipeline (similar to the bitmap piece pipeline), let
`ColorScheme` reference a texture id, and have `BoardView` use SVG
`<pattern>` for textured squares.

## 4. Remaining bitmap piece sets

The first session ships the Standard set as bitmaps. The other five sets
(Motif, Runes, Eurasian, Abstract, Small) follow the same conversion
pipeline; each needs running `pnpm convert-assets` once the script is
extended to walk every set folder. About 200–250 extra PNGs total.

## 5. Settings persistence

The current theme / piece-set / AI-side preferences are React state — lost on
reload. A simple `localStorage` hook would persist them across sessions.

## 6. Accessibility polish

The board has basic keyboard focus on each square (via the SVG group), but
no keyboard move input, no screen-reader labels for pieces, and no high-
contrast scheme. Each of these is a small, scoped addition.
