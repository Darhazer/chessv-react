/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/ComplexPromotionRule.cs
 ***************************************************************************/

import {
  type Game,
  type Location,
  MoveEventResponse,
  type MoveList,
  MoveType,
  type PieceType,
  PromotionRule,
} from '@chessv/engine';
import {
  type OptionalPromotionLocationDelegate,
  PromotionOption,
} from './promoteByReplacementRule.js';

/** Per-square decision for an `OptionalPromotion` zone with a known source. */
export type OptionalPromotionFromAndToLocationDelegate = (
  fromLoc: Location,
  toLoc: Location,
) => PromotionOption;

/** Promotion capability bundle attached to one piece type. */
interface PromotionCapability {
  promotingType: PieceType;
  promotingTypeNumber: number;
  /** Free-choice promotion targets (may be null). */
  promotionTypes: PieceType[] | null;
  /** Promote-by-replacement targets (a subset of the player's captured pieces). */
  replacementPromotionTypes: PieceType[] | null;
  /** Destination-only condition; xor with `fromAndToConditionDelegate`. */
  conditionDelegate: OptionalPromotionLocationDelegate | null;
  fromAndToConditionDelegate: OptionalPromotionFromAndToLocationDelegate | null;
}

/**
 * Layered, conditional promotion. Variants like Mecklenbeck Chess (optional
 * on the 6th-7th ranks, mandatory on the 8th) and Lemurian Shatranj
 * (multi-target promotion + replacement) need richer logic than
 * `BasicPromotionRule` / `PromoteByReplacementRule` provide.
 *
 * Build one rule with one or more `addPromotionCapability` calls; each call
 * pairs a piece type with its target list(s) and a location predicate.
 */
export class ComplexPromotionRule extends PromotionRule {
  private readonly capabilities: PromotionCapability[] = [];

  /** Register a promotion capability with a destination-only condition. */
  addPromotionCapability(
    promotingType: PieceType,
    promotionTypes: PieceType[] | null,
    replacementPromotionTypes: PieceType[] | null,
    condition: OptionalPromotionLocationDelegate,
  ): void {
    this.capabilities.push({
      promotingType,
      promotingTypeNumber: 0,
      promotionTypes,
      replacementPromotionTypes,
      conditionDelegate: condition,
      fromAndToConditionDelegate: null,
    });
  }

  /** Register a capability whose condition sees both source and destination. */
  addPromotionCapabilityFromTo(
    promotingType: PieceType,
    promotionTypes: PieceType[] | null,
    replacementPromotionTypes: PieceType[] | null,
    condition: OptionalPromotionFromAndToLocationDelegate,
  ): void {
    this.capabilities.push({
      promotingType,
      promotingTypeNumber: 0,
      promotionTypes,
      replacementPromotionTypes,
      conditionDelegate: null,
      fromAndToConditionDelegate: condition,
    });
  }

  override initialize(game: Game): void {
    super.initialize(game);
    for (const cap of this.capabilities) {
      cap.promotingTypeNumber = game.getPieceTypeNumber(cap.promotingType);
    }
  }

  override moveBeingGenerated(
    moves: MoveList,
    from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const board = this.board!;
    const game = this.game!;
    const movingPiece = board.pieceAt(from);
    if (movingPiece === null) return MoveEventResponse.NotHandled;

    for (const cap of this.capabilities) {
      if (movingPiece.typeNumber !== cap.promotingTypeNumber) continue;

      const toLocation = board.squareToLocation(board.playerSquare(movingPiece.player, to));
      const option =
        cap.fromAndToConditionDelegate !== null
          ? cap.fromAndToConditionDelegate(
              board.squareToLocation(board.playerSquare(movingPiece.player, from)),
              toLocation,
            )
          : cap.conditionDelegate!(toLocation);
      if (option === PromotionOption.CannotPromote) continue;

      const typesUsed = new Set<number>();
      const capturedPiece = board.pieceAt(to);

      // Optional zone: also emit the pass-through (non-promoting) move.
      if (option === PromotionOption.CanPromote) {
        if (capturedPiece === null) moves.addMove(from, to, true);
        else moves.addCapture(from, to, true);
      }

      // Free-choice promotion targets.
      if (cap.promotionTypes !== null) {
        for (const promoteTo of cap.promotionTypes) {
          if (capturedPiece === null) {
            moves.beginMoveAdd(MoveType.MoveWithPromotion, from, to);
            moves.addPickup(from);
            moves.addDrop(movingPiece, to, promoteTo);
            moves.endMoveAdd(5000 + promoteTo.midgameValue);
          } else {
            moves.beginMoveAdd(MoveType.CaptureWithPromotion, from, to);
            moves.addPickup(from);
            moves.addPickup(to);
            moves.addDrop(movingPiece, to, promoteTo);
            moves.endMoveAdd(
              5000 + promoteTo.midgameValue + capturedPiece.pieceType.midgameValue,
            );
          }
          typesUsed.add(promoteTo.typeNumber);
        }
      }

      // Replacement-promotion targets (each distinct captured-piece type).
      if (cap.replacementPromotionTypes !== null) {
        for (const capturedFriendly of game.getCapturedPieceList(movingPiece.player)) {
          if (capturedFriendly.typeNumber === movingPiece.typeNumber) continue;
          if (typesUsed.has(capturedFriendly.typeNumber)) continue;
          if (!cap.replacementPromotionTypes.includes(capturedFriendly.pieceType)) continue;
          if (capturedPiece === null) {
            moves.beginMoveAdd(MoveType.MoveReplace, from, to, capturedFriendly.typeNumber);
            moves.addPickup(from);
            moves.addDrop(capturedFriendly, to, null);
            moves.endMoveAdd(5000 + capturedFriendly.pieceType.midgameValue);
          } else {
            moves.beginMoveAdd(MoveType.CaptureReplace, from, to, capturedFriendly.typeNumber);
            moves.addPickup(from);
            moves.addPickup(to);
            moves.addDrop(capturedFriendly, to, null);
            moves.endMoveAdd(
              5000 +
                capturedFriendly.pieceType.midgameValue +
                capturedPiece.pieceType.midgameValue,
            );
          }
          typesUsed.add(capturedFriendly.typeNumber);
        }
      }
      return MoveEventResponse.Handled;
    }
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (this.capabilities.some((cap) => cap.promotingType === type)) notes.push('can promote');
  }
}
