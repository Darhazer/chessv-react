# Phase 3 — deferred variants

The first Phase-3 batch ported 51 variants; follow-up sessions ported **FlexibleCastlingRule**, **PromoteByReplacementRule**, **Chess960** support, the **multi-move completion rules**, **pocket drops**, **two-board (Alice) geometry**, **cylindrical geometry** and the **KingsLeapRule**, unlocking 19 more (clusters 1–7 plus a head start on cluster 8). What remains is a handful of bespoke per-variant ports (cluster 8) and a few unlocking-rules that would each yield one variant — they are documented below as standalone follow-ups rather than blockers.

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

**Layered promotion rules — done.**
- `packages/rules/src/complexPromotionRule.ts` — `ComplexPromotionRule`
  bundles per-piece-type promotion capabilities (free-choice + replacement
  targets, with an optional from/to condition).
- `packages/rules/src/colorboundPromotionRestrictionRule.ts` — rejects a
  promotion / replacement that would leave the player with two pieces of
  the same colour-bound type on the same slice.

**Unlocked:** Mecklenbeck Chess and Lemurian Shatranj (both 8×8). The
multi-path piece machinery Lemurian needed (`BentShaman`, `BentHero`,
`SlidingGeneral`) lives in `packages/pieces/src/multiPath.ts` alongside
`Falcon`.

**Still deferred:**

- Eurasian Chess (10×10) — needs the xiangqi `KingFacingRule` and a
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

## 6. Cylindrical / non-rectangular geometry ✅ DONE (cylindrical)

**Status:** `packages/engine/src/cylindricalBoard.ts` ports
`CylindricalBoard`. The override of `buildNextStepMatrix` uses modular
file arithmetic so a step off the a-file lands on the h-file and vice
versa. `disableSimpleMoveGeneration` is set (multiple paths reach the
same square; SEE would be wrong) and variants enable `deduplicateMoves`
to drop the duplicate sliding moves that wrap produces.

**Unlocked:** Cylindrical Chess (8×8).

**Still deferred:** Omega Chess — its wizard corner squares (104 squares
on a hybrid 12×12 + 4) need a fresh geometry class with its own square
notation and a per-piece move generator for the corners. Out of scope
for this batch.

---

## 7. Multi-board geometry ✅ DONE

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
- `packages/rules/src/aliceCastlingRules.ts` — `AliceCastlingRule`,
  `AliceFlexibleCastlingRule` and `AliceEnPassantRule` wrap the base
  rules with the cross-board emptiness check, so the king/rook land on
  the mirror sub-board and en-passant captures teleport too. The
  variant uses these via overriding `addCastlingRule`,
  `addFlexibleCastlingRule` and `addEnPassantRule`.

**Unlocked:** Alice Chess (8×8 × 2). Fully playable, including castling,
en passant and the pawn double-move.

---

## 8. Bespoke custom rules / pieces — partial

Each of these is a one-off and self-contained. ✅ marks ones that landed in
the Phase-3 batches.

| Variant | Source file(s) | Notes |
| --- | --- | --- |
| ✅ Archchess (10×10) | `Rules/KingsLeapRule.cs` | King may leap once per game. Done. |
| Brouhaha (10x10) | `Rules/Brouhaha/` | Border rule + conditional move capabilities for Cleric/Scout. |
| Odin's Rune Chess (10x10) | `Pieces/OdinsRune/`, `Rules/OdinsRune/` | Custom move generators (adjacency-based). |
| Odyssey (12x12) | `Rules/Odyssey/` | Assassin trade-restriction rule; multi-char piece notation. |
| Symmetric Chess (9x8) | `Rules/Symmetric/BishopConversionRule.cs` | ~550 lines of bishop-conversion privilege bookkeeping. |
| ✅ Falcon Chess (10×8) | `Pieces/MultiPath.cs` | Multi-path piece; the engine's `MovePathInfo` machinery did the work. Done. |
| Yang Qi (9x10) | `Rules/YangQi/` | Custom king-swap rule (+ Replacement promotion). |
| Courier Chess Moderno (12x8) | `Rules/ExtraMovesForUnmovedPieceRule.cs` | Unmoved-piece extra move + a custom `"3-3"` castling style. |
| Chess And A Half (12x12) | `Rules/OptionalCaptureByOvertakeRule.cs` | Multi-target capture + complex promotion. |

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
6. ✅ **Cylindrical geometry** — done. Cylindrical Chess unlocked.
   Omega Chess (corner squares) still pending.
7. ✅ **Multi-board (Alice)** — done. Alice Chess unlocked (castling /
   en passant disabled pending Alice-wrapped rules).
8. **Bespoke rules** — ✅ KingsLeapRule + Archchess done; the rest are
   one-off ports remaining as future work.
