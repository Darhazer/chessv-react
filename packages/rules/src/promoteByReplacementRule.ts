/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/PromoteByReplacementRule.cs
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

/** Whether a square allows / requires promotion. */
export enum PromotionOption {
  CannotPromote,
  CanPromote,
  MustPromote,
}

/** Per-square decision for an `OptionalPromotion` zone. */
export type OptionalPromotionLocationDelegate = (loc: Location) => PromotionOption;

/**
 * Promotion by replacement: when the promoting piece (typically a pawn) enters
 * the promotion zone, the player may swap it for any one of their own
 * previously-captured pieces. The pawn does not become a fresh queen — it
 * becomes the actual piece that came off the board earlier. Used by Grand
 * Chess and its descendants.
 */
export class PromoteByReplacementRule extends PromotionRule {
  private readonly promotingType: PieceType;
  private readonly condition: OptionalPromotionLocationDelegate;
  private promotingTypeNumber = 0;

  constructor(promotingType: PieceType, condition: OptionalPromotionLocationDelegate) {
    super();
    this.promotingType = promotingType;
    this.condition = condition;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.promotingTypeNumber = game.getPieceTypeNumber(this.promotingType);
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
    if (movingPiece == null) return MoveEventResponse.NotHandled;
    if (movingPiece.typeNumber !== this.promotingTypeNumber) return MoveEventResponse.NotHandled;

    const toLocation = board.squareToLocation(board.playerSquare(movingPiece.player, to));
    const option = this.condition(toLocation);
    if (option === PromotionOption.CannotPromote) return MoveEventResponse.NotHandled;

    const capturedEnemyPiece = board.pieceAt(to);

    // If the zone is optional, the pawn may also pass through without
    // promoting — emit the plain move/capture too.
    if (option === PromotionOption.CanPromote) {
      if (capturedEnemyPiece == null) {
        moves.addMove(from, to, true);
      } else {
        moves.addCapture(from, to, true);
      }
    }

    // For each *distinct* friendly piece type that has been captured (other
    // than the promoting type itself), offer to swap the pawn for it.
    const typesSeen = new Set<number>();
    for (const capturedFriendly of game.getCapturedPieceList(movingPiece.player)) {
      if (
        capturedFriendly.typeNumber === movingPiece.typeNumber ||
        typesSeen.has(capturedFriendly.typeNumber)
      ) {
        continue;
      }
      typesSeen.add(capturedFriendly.typeNumber);

      if (capturedEnemyPiece == null) {
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
            capturedEnemyPiece.pieceType.midgameValue,
        );
      }
    }
    return MoveEventResponse.Handled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.promotingType) notes.push('can promote by replacement');
  }
}
