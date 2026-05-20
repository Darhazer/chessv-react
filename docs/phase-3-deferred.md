# Phase 3 — deferred variants

The first Phase-3 batch ported 51 variants; follow-up sessions ported **FlexibleCastlingRule**, **PromoteByReplacementRule**, **Chess960** support, and the **multi-move completion rules**, unlocking 15 more (clusters 1–4 below). The remaining ~94 are still blocked on the engine extensions described here.

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

## 1. Flexible castling ✅ DONE

**Status:** ported. `packages/rules/src/flexibleCastlingRule.ts` subclasses
`CastlingRule`; `GenericChess` exposes `addFlexibleCastlingRule()` and
`flexibleCastlingMove()`; `Generic10x8` and `Generic10x10` wire it through
the `"Flexible"` / `"Close-Rook Flexible"` / `"2R Flexible"` castling choices.

**Unlocked (5 variants registered):** Carrera's Chess, Schoolbook Chess,
Grotesque Chess, Ladorean Chess, Univers Chess (all 10×8 Capablanca-family).
Other variants in the original list (the Wildebeest-style castling on
11×10, King's Court, Colossus's custom "Colossus" flexible variant) are
still gated on additional bespoke work.

---

## 2. Replacement / Grand promotion ✅ PARTIAL

**Status:** `PromoteByReplacementRule` is ported and wired through.
- `packages/rules/src/promoteByReplacementRule.ts` with the
  `PromotionOption` / `OptionalPromotionLocationDelegate` exports.
- `GenericChess` handles the `"Replacement"` promotion choice (back-rank
  zone). `Generic10x10` adds a `"Grand"` choice with the wider 8th–9th rank
  optional zone.

**Unlocked (6 variants registered):** Grand Chess, Opulent Chess, TenCubed
Chess, Unicorn Grand Chess, Emperor's Game (10×10) — and FlexibleCastlingRule
is a soft prerequisite for some of them.

**Still deferred — additional layered rules:**

- `ComplexPromotionRule.cs` — multi-rank, conditional promotion required by
  Mecklenbeck Chess (8×8) and Lemurian Shatranj (8×8).
- `ColorboundPromotionRestrictionRule.cs` — colour-binding restriction
  required by Lemurian Shatranj.
- Eurasian Chess (10×10) — also needs the xiangqi `KingFacingRule` and a
  `PieceLocationRestrictionRule` (palace).
- 12×12: Gross Chess, Chess And A Half — both need bespoke rules.
- 9×10: Yang Qi — also needs the custom king-swap rule.

---

## 3. Arbitrary-file castling (Fischer Random) ✅ DONE

**Status:** `packages/variants/src/v8x8/fischerRandomChess.ts` exports
`FischerRandomChess` and `Chess480`, both subclasses of `Chess`. The existing
`CastlingRule` already supports arbitrary king/rook files; the variants just
provide a random Chess960 back-rank array and register castling moves with
the actual king/rook file letters as Shredder-FEN privs.

**Unlocked (2 variants):** Fischer Random Chess, Chess480.

---

## 4. Multi-move turns ✅ DONE

**Status:** `packages/rules/src/multiMoveCompletionRules.ts` exports
`DoubleMoveCompletionRule` and `MarseillaisMoveCompletionRule`, both
subclasses of the engine's `MoveCompletionRule`. They share a four-state
machine (`w2`/`w`/`b2`/`b`) — Marseillais adds the check-truncation
exception (giving check ends the turn early).

**Unlocked (2 variants):** Marseillais Chess, Doublemove Chess (8×8).
Larger-board multi-move variants would slot in trivially if any exist.

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

1. ✅ **Flexible castling** — done. 5 variants unlocked.
2. ✅ **Replacement promotion** — done (base rule). 6 variants unlocked.
   Complex / colorbound promotion still pending.
3. ✅ **Fischer-style castling** — done. 2 variants unlocked.
4. ✅ **Multi-move turns** — done. 2 variants unlocked.
5. **Drops / pockets** — 1 variant now but big future leverage.
6. **Cylindrical geometry** — 1–2 variants.
7. **Multi-board (Alice)** — 1 variant; substantial.
8. **Bespoke rules** — one variant at a time; do these last.
