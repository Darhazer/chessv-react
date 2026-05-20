# Phase 3 — deferred variants

The first Phase-3 batch ported 51 variants; follow-up sessions ported **FlexibleCastlingRule**, **PromoteByReplacementRule**, **Chess960** support, the **multi-move completion rules**, **pocket drops** and **two-board (Alice) geometry**, unlocking 17 more (clusters 1–5 and 7 below). The remaining ~92 are still blocked on the engine extensions described here.

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

## 5. Drop / pocket squares ✅ DONE (single-piece pocket)

**Status:** ported.
- `packages/engine/src/boardWithPockets.ts` — `BoardWithPockets` subclass:
  one extra "pocket" square per player, with `file === -1` /
  `rank === player`. The base `Board` already supports the extended-squares
  region; the subclass just stamps the pocket file/rank metadata and
  overrides `locationToSquare` for `file < 0`.
- `packages/rules/src/pocketDropRule.ts` — generates `MoveType.Drop` moves
  from a player's pocket onto any empty board square, and parses the
  `pieces in hand` FEN field on position load.

**Unlocked:** Pocket Knight / Chess With Pockets (8×8). Multi-piece hands
(Shogi/Crazyhouse) will extend this rule when the Shogi family lands —
the pocket-square infrastructure generalises naturally.

---

## 6. Cylindrical / non-rectangular geometry

**Engine work:** the existing `Board` is rectangular only. Cylindrical Chess
wraps left↔right edges, Omega Chess adds wizard corner squares with their own
notation/move-generation rules. The likely shape: introduce a `BoardGeometry`
subclass that customises `buildNextStepMatrix` / `nextSquare` and the
move-deduplication path. ChessV `Game.deduplicateMoves` flag already exists.

**Unlocks (~2):** Cylindrical Chess (8x8), Omega Chess.

---

## 7. Multi-board geometry ✅ DONE (minimal Alice)

**Status:** ported.
- `packages/engine/src/twoBoards.ts` — `TwoBoards` subclass holds two
  side-by-side `boardFiles × numRanks` sub-boards (so `numFiles ==
  2 * boardFiles`). Its `buildNextStepMatrix` snips the connection
  between file `boardFiles - 1` and file `boardFiles` so sliders can't
  cross the join.
- `packages/rules/src/aliceRule.ts` — intercepts every `StandardMove` /
  `StandardCapture` and redirects the destination to the mirror square
  on the other sub-board, gated on emptiness. King moves additionally
  check that the originating board's mirror isn't attacked.

**Unlocked:** Alice Chess (8×8 × 2). Castling, en passant and the pawn
double-move are intentionally disabled — porting `AliceCastlingRule`,
`AliceFlexibleCastlingRule` and `AliceEnPassantRule` (which wrap the
base rules with the mirror-emptiness check) is still pending; without
them the variant is fully playable but loses those niceties.

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
5. ✅ **Drops / pockets** — done (single-piece pocket). Pocket Knight unlocked;
   Shogi/Crazyhouse hands extend this naturally.
6. **Cylindrical geometry** — 1–2 variants.
7. ✅ **Multi-board (Alice)** — done. Alice Chess unlocked (castling /
   en passant disabled pending Alice-wrapped rules).
8. **Bespoke rules** — one variant at a time; do these last.
