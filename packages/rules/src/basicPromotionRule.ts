/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/BasicPromotionRule.cs
 ***************************************************************************/

import {
  type ConditionalLocationDelegate,
  type Game,
  Location,
  MoveEventResponse,
  type MoveList,
  MoveType,
  type PieceType,
  PromotionRule,
} from '@chessv/engine';

/**
 * Standard promotion: when the promoting piece type reaches a destination
 * satisfying the condition, it is replaced by a choice of new type.
 */
export class BasicPromotionRule extends PromotionRule {
  private readonly promotingType: PieceType;
  private readonly promotionTypes: PieceType[];
  private readonly origLocationCondition: ConditionalLocationDelegate | null;
  private destLocationCondition: ConditionalLocationDelegate;
  private promotingTypeNumber = 0;

  constructor(
    promotingType: PieceType,
    availablePromotionTypes: PieceType[],
    destLocationConditionDelegate: ConditionalLocationDelegate,
    origLocationConditionDelegate: ConditionalLocationDelegate | null = null,
  ) {
    super();
    this.promotingType = promotingType;
    this.promotionTypes = availablePromotionTypes;
    this.destLocationCondition = destLocationConditionDelegate;
    this.origLocationCondition = origLocationConditionDelegate;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.promotingTypeNumber = game.getPieceTypeNumber(this.promotingType);
  }

  /** Promote on a fixed rank. */
  setPromotionRank(rank: number): void {
    this.destLocationCondition = (loc: Location): boolean => loc.rank === rank;
  }

  override moveBeingGenerated(
    moves: MoveList,
    from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const board = this.board!;
    const movingPiece = board.pieceAt(from);
    if (movingPiece == null) throw new Error('BasicPromotionRule: no piece on the from-square');

    if (movingPiece.typeNumber === this.promotingTypeNumber) {
      if (this.origLocationCondition != null) {
        const fromLocation = board.squareToLocation(board.playerSquare(movingPiece.player, from));
        if (!this.origLocationCondition(fromLocation)) return MoveEventResponse.NotHandled;
      }

      const toLocation = board.squareToLocation(board.playerSquare(movingPiece.player, to));
      if (this.destLocationCondition(toLocation)) {
        const capturedPiece = board.pieceAt(to);
        if (capturedPiece == null) {
          for (const promoteTo of this.promotionTypes) {
            moves.beginMoveAdd(MoveType.MoveWithPromotion, from, to);
            moves.addPickup(from);
            moves.addDrop(movingPiece, to, promoteTo);
            moves.endMoveAdd(5000 + promoteTo.midgameValue);
          }
        } else {
          for (const promoteTo of this.promotionTypes) {
            moves.beginMoveAdd(MoveType.CaptureWithPromotion, from, to);
            moves.addPickup(from);
            moves.addPickup(to);
            moves.addDrop(movingPiece, to, promoteTo);
            moves.endMoveAdd(
              5000 + promoteTo.midgameValue + capturedPiece.pieceType.midgameValue,
            );
          }
        }
        return MoveEventResponse.Handled;
      }
    }
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.promotingType) notes.push('can promote');
  }
}
