# Phase 3 — port reference ✅ COMPLETE

Every variant blocker described here has been ported. The catalog now
registers **85 distinct chess variants** on top of `ChessWithDifferentArmies`
(one entry; covers all 16 CwDA matchups via ChoiceVariables). That matches
ChessV's published catalog modulo the 16 "Generic" UI templates (build-
your-own-variant templates, not playable as-is) and the 15 separately-
registered CwDA matchup default-army pairings.

This document is preserved as a port reference so future readers can see
which C# file each rule comes from. The original checklist follows; all
clusters are now ✅.

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

**Eurasian Chess — done.** Ports the xiangqi `KingFacingRule` and
`PieceLocationRestrictionRule` into `packages/rules/src/`. The variant
lives at `packages/variants/src/v10x10/eurasianChess.ts`.

**Still deferred:**

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

**Omega Chess — done.** Implemented as a 12×12 board with the
`OmegaChessBorderRule` blocking access to non-corner border squares.
The four corners ("wizard squares") remain reachable.

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

## 8. Bespoke custom rules / pieces — ✅ DONE

Every bespoke variant in this cluster now ships.

| Variant | Source file(s) | Notes |
| --- | --- | --- |
| ✅ Archchess (10×10) | `Rules/KingsLeapRule.cs` | King may leap once per game. |
| ✅ ArchCourier Chess (12×8) | `Pieces/...` | Five fairy pieces; Replacement promotion. |
| ✅ Brouhaha (10×10) | `Rules/Brouhaha/` | Border rule + conditional Cleric/Scout first moves. |
| ✅ Chess and a Half (12×12) | `Rules/OptionalCaptureByOvertakeRule.cs` | Multi-target capture; multi-target promotion. |
| ✅ Colossus (10×10) | inline | Bespoke 1-3 / 1-4 flexible castling. |
| ✅ Courier Chess Moderno (12×8) | `Rules/ExtraMovesForUnmovedPieceRule.cs` | Unmoved-piece extra move + 3-3 castling + bare king. |
| ✅ Duplex Chess (8×8) | `Rules/MultiMove/DuplexChessMoveCompletionRule.cs` | Multi-move with opening drops, three victory conditions. |
| ✅ Falcon Chess (10×8) | `Pieces/MultiPath.cs` | Multi-path piece via `MovePathInfo`. |
| ✅ Gross Chess (12×12) | `Rules/Gross/GrossChessPromotionRule.cs` | Pre-stocked reserve + per-rank promotion target restriction. |
| ✅ King's Court (12×12) | `Rules/KingsCourt/KingsFlightRule.cs` | King flees two squares when chased by a Chancellor. |
| ✅ Odin's Rune Chess (10×10) | `Pieces/OdinsRune/` | King adopts adjacent friendly piece moves; Valkyrie / Forest Ox custom move generators. |
| ✅ Odyssey (12×12) | `Rules/Odyssey/AssassinTradeRestrictionRule.cs` | Rifle-capturing Assassin with anti-trade restriction. |
| ✅ Omega Chess (12×12 + corners) | `Rules/Omega/OmegaChessBorderRule.cs` | Inner 10×10 with four wizard corners; rest of the border ring inaccessible. |
| ✅ Symmetric Chess (9×8) | `Rules/Symmetric/BishopConversionRule.cs` | Bishop-conversion privilege bookkeeping. |
| ✅ Yáng Qí (9×10) | `Rules/YangQi/` | King-swap rule + Replacement promotion. |

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
8. ✅ **Bespoke rules** — done. 15 variants ported.
