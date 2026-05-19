/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/MoveInfo.cs
 ***************************************************************************/

import { MoveType } from './basics.js';
import { Movement } from './movement.js';
import type { Piece } from './piece.js';

/**
 * The full, executable description of a move: enough information to make and
 * unmake it. The C# original is a value-type struct; the web port models it
 * as a class and provides {@link clone} for the places that copied it.
 *
 * `tag` and `promotionType` share one backing field, exactly as in C#.
 */
export class MoveInfo {
  moveType: MoveType = MoveType.Invalid;
  player = 0;
  fromSquare = 0;
  toSquare = 0;
  /** Backing field shared by `tag` and `promotionType`. */
  private tagOrPromotionType = 0;
  originalType = 0;
  /** Index into the move list's pickup array, one past this move's pickups. */
  pickupCursor = 0;
  /** Index into the move list's drop array, one past this move's drops. */
  dropCursor = 0;
  /** Move-ordering score. */
  evaluation = 0;
  pieceMoved: Piece | null = null;
  pieceCaptured: Piece | null = null;

  get tag(): number {
    return this.tagOrPromotionType;
  }
  set tag(value: number) {
    this.tagOrPromotionType = value;
  }

  get promotionType(): number {
    return this.tagOrPromotionType;
  }
  set promotionType(value: number) {
    this.tagOrPromotionType = value;
  }

  /** Packed 32-bit identity of this move (matches {@link Movement.hash}). */
  get hash(): number {
    return (
      ((this.fromSquare & 0xff) |
        ((this.toSquare & 0xff) << 8) |
        ((this.tagOrPromotionType & 0xff) << 16) |
        ((this.moveType & 0x7f) << 24) |
        ((this.player & 1) << 31)) >>>
      0
    );
  }

  /** True if this move has the same identity as another. */
  equals(other: MoveInfo): boolean {
    return (
      this.moveType === other.moveType &&
      this.fromSquare === other.fromSquare &&
      this.toSquare === other.toSquare &&
      this.tagOrPromotionType === other.tagOrPromotionType
    );
  }

  /** Convert to a compact {@link Movement}. */
  toMovement(): Movement {
    return new Movement(
      this.fromSquare,
      this.toSquare,
      this.player,
      this.moveType,
      this.tagOrPromotionType,
    );
  }

  /** An independent copy (the C# struct was copied by value). */
  clone(): MoveInfo {
    const copy = new MoveInfo();
    copy.moveType = this.moveType;
    copy.player = this.player;
    copy.fromSquare = this.fromSquare;
    copy.toSquare = this.toSquare;
    copy.tagOrPromotionType = this.tagOrPromotionType;
    copy.originalType = this.originalType;
    copy.pickupCursor = this.pickupCursor;
    copy.dropCursor = this.dropCursor;
    copy.evaluation = this.evaluation;
    copy.pieceMoved = this.pieceMoved;
    copy.pieceCaptured = this.pieceCaptured;
    return copy;
  }
}
