# Phase 3 — deferred variants

51 of ChessV's 160 variants are ported (see `git log --oneline | grep "Phase 3"`).
The remaining ~109 are blocked on **engine extensions**, not on more variant work.
This document is a checklist for the engine work that would unlock each cluster.

Each section names the work, points at the C# source to port, and lists the
variants it unblocks. Pick a cluster, port the engine piece, then the variants
in that cluster mostly follow the existing `packages/variants/src/v*/...`
pattern.

## Conventions

- Pattern for porting a variant: read `ChessV.Games/<size>/<Name>.cs` → TS
  class extending the right `Generic*` base; constructor calls
  `super(symmetry)`; override `setGameVariables` / `addPieceTypes` /
  `addRules` mirroring the C#. Skip the C# `AddEvaluations` override (the
  evaluation suite is deferred). Register in
  `packages/variants/src/index.ts` via `registerVariant({...})`.
- New piece types → `packages/pieces/src/` (extend `fairy.ts` or a new file).
- New rules → `packages/rules/src/`.
- After porting: `pnpm -r typecheck` and `pnpm vitest run
  packages/variants/src/variants.smoke.test.ts` must both pass.

---

## 1. Flexible castling

**Engine work:** port `ChessV.Games/Rules/FlexibleCastlingRule.cs` into
`packages/rules/src/`. It generalises `CastlingRule` to slides of two **or
more** squares, with the partner piece jumping to the adjacent square. Wire it
into `GenericChess.addCastlingRule` (already has the helper
`addFlexibleCastlingRule` in C#).

**Unlocks (~7):**

- 8x8: would not unblock new variants (the existing Flexible castling choice
  works once the rule exists).
- 10x8: Carrera's Chess, Schoolbook Chess, Grotesque Chess, Ladorean Chess,
  Univers Chess.
- 11x10: a Wildebeest Chess castling style ("Wildebeest" choice).
- 12x12: King's Court (needs both this and the bespoke King's-flight rule).
- Colossus uses a custom "Colossus" flexible variant — port that on top.

---

## 2. Replacement / Grand / complex promotion

**Engine work:** port these `ChessV.Games/Rules/` files in order — they layer:

- `PromoteByReplacementRule.cs` — "Replacement" promotion (the piece morphs in
  place when reaching the promotion zone; the choice depends on what's been
  captured).
- `ComplexPromotionRule.cs` — multi-rank, conditional promotion (Mecklenbeck,
  Lemurian).
- `ColorboundPromotionRestrictionRule.cs` — restricts promotion choices by
  colour-binding (Lemurian).

`GenericChess.setGameVariables` already declares `PromotionRule` as a
ChoiceVariable with `"None"`, `"Standard"`, `"Replacement"`, `"Custom"`; wire
`"Replacement"` to add `PromoteByReplacementRule` in `addRules`.

**Unlocks (~9):**

- 8x8: Lemurian Shatranj, Mecklenbeck Chess.
- 10x10: Grand Chess, Opulent Chess, Eurasian Chess, TenCubed Chess, Unicorn
  Grand Chess, Emperor's Game.
- 12x12: Gross Chess, Chess And A Half (also needs other rules — see below).
- 9x10: Yang Qi (also needs the custom king-swap rule).

---

## 3. Arbitrary-file castling (Fischer Random)

**Engine work:** generalise `CastlingRule` so the king and rook can start on
any file (not just d/e). The C# uses Shredder-FEN privileges with file letters.

**Unlocks (1):** FischerRandomChess (8x8). Also a prerequisite for any future
Chess960-style variants.

---

## 4. Multi-move turns

**Engine work:** port the alternative `MoveCompletionRule` subclasses in
`ChessV.Games/Rules/MultiMove/`. The current engine's
`MoveCompletionDefaultRule` flips `currentSide` after each move; the
multi-move rules keep `currentSide` for N consecutive moves.

**Unlocks (~3):** Marseillais Chess (8x8), Doublemove Chess (8x8), and a few
larger-board multi-move variants if present.

---

## 5. Drop / pocket squares

**Engine work:** virtual off-board squares (`NumSquaresExtended >
NumSquares`) for held pieces; pieces enter the board via "Drop" moves.
`ChessV.Games/Rules/Pocket/` has the rules; `ChessV.Base/Board` already
distinguishes `NumSquares` from `NumSquaresExtended`, so the wiring is
mostly: pocket initialisation, drop-square notation, drop move generation.

**Unlocks:** Chess With Pockets (8x8), plus the future Shogi/Crazyhouse-style
variants. Also a prerequisite for the Shogi family in a later port.

---

## 6. Cylindrical / non-rectangular geometry

**Engine work:** the existing `Board` is rectangular only. Cylindrical Chess
wraps left↔right edges, Omega Chess adds wizard corner squares with their own
notation/move-generation rules. The likely shape: introduce a `BoardGeometry`
subclass that customises `buildNextStepMatrix` / `nextSquare` and the
move-deduplication path. ChessV `Game.deduplicateMoves` flag already exists.

**Unlocks (~2):** Cylindrical Chess (8x8), Omega Chess.

---

## 7. Multi-board geometry

**Engine work:** Alice Chess plays on two parallel 8×8 boards; a moved piece
teleports to the corresponding square on the other board (gated on
emptiness). Needs a two-board `Board` subclass + an `AliceRule` that performs
the teleport, plus `AliceCastlingRule` / `AliceEnPassantRule` /
`AliceFlexibleCastlingRule` variants. Source: `ChessV.Games/Rules/Alice/`.

**Unlocks (1):** Alice Chess.

---

## 8. Bespoke custom rules / pieces

Each of these is a one-off and self-contained.

| Variant | Source file(s) | Notes |
| --- | --- | --- |
| Archchess (10x10) | `ChessV.Games/Rules/KingsLeapRule.cs` | King may leap once per game. |
| Brouhaha (10x10) | `ChessV.Games/Rules/Brouhaha/` | Custom file notation + border rule. |
| Odin's Rune Chess (10x10) | `ChessV.Games/Pieces/OdinsRune/`, rules in `Rules/OdinsRune/` | Custom move generators (adjacency-based) for OdinKing, ForestOx, Valkyrie. |
| Odyssey (12x12) | `ChessV.Games/Rules/Odyssey/` | Assassin trade-restriction rule; multi-char piece notation. |
| Symmetric Chess (9x8) | `ChessV.Games/Rules/Symmetric/` | Bishop-conversion rule plus the `{bishop-conversion}` FEN field. |
| Falcon Chess (10x8) | `ChessV.Games/Pieces/MultiPath.cs` | The Falcon is a multi-path piece — port the custom move generator. |
| Yang Qi (9x10) | `ChessV.Games/Rules/YangQi/` | Custom king-swap rule (and needs Replacement promotion). |
| Courier Chess Moderno (12x8) | `ChessV.Games/Rules/ExtraMovesForUnmovedPieceRule.cs` | Unmoved-piece extra move. |
| Chess And A Half (12x12) | `ChessV.Games/Rules/OptionalCaptureByOvertakeRule.cs` | Multi-target capture; plus complex promotion. |

---

## Suggested order

Tackling the clusters above roughly in this order is the best return on effort:

1. **Flexible castling** — small rule, unlocks ~7 variants.
2. **Replacement promotion** — small-to-medium rule, unlocks ~9.
3. **Fischer-style castling** — 1 variant but historically important.
4. **Multi-move turns** — 2–3 variants.
5. **Drops / pockets** — 1 variant now but big future leverage.
6. **Cylindrical geometry** — 1–2 variants.
7. **Multi-board (Alice)** — 1 variant; substantial.
8. **Bespoke rules** — one variant at a time; do these last.

A reasonable Phase-3.5 milestone would be cluster 1 + 2 — about 16 more
variants playable for a few weeks of engine work.
