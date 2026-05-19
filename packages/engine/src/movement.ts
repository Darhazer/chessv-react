/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  This file is part of the ChessV web port, distributed under the terms of
 *  the GNU General Public License, version 3 or (at your option) any later
 *  version.
 *
 *  Ported from ChessV.Base/Movement.cs
 ***************************************************************************/

import { MoveType } from './basics.js';

/**
 * Uniquely identifies a move in any supported game. It does NOT carry enough
 * information to actually make the move (that requires a `MoveInfo`); it is
 * used for fast equivalence comparison and compact storage in the hashtable
 * and killer-move lists.
 *
 * The from-square, to-square, side moving, move type and a per-type `tag`
 * (e.g. the piece type to promote to) are packed into a single 32-bit
 * integer — the `hash`.
 */
export class Movement {
  readonly fromSquare: number;
  readonly toSquare: number;
  readonly tag: number;
  /** Packed: bit 7 = player, bits 0-6 = move type. */
  private readonly playerAndType: number;

  /** Construct an invalid (placeholder) movement. */
  static invalid(): Movement {
    return new Movement(0, 0, 0, MoveType.Invalid, 0);
  }

  constructor(from: number, to: number, player: number, type: MoveType, tag = 0) {
    this.fromSquare = from;
    this.toSquare = to;
    this.playerAndType = ((player << 7) | type) >>> 0;
    this.tag = tag;
  }

  /** Reconstruct a movement from its packed 32-bit hash. */
  static fromHash(moveHash: number): Movement {
    return new Movement(
      Movement.fromSquareFromHash(moveHash),
      Movement.toSquareFromHash(moveHash),
      Movement.playerFromHash(moveHash),
      Movement.moveTypeFromHash(moveHash),
      Movement.tagFromHash(moveHash),
    );
  }

  get moveType(): MoveType {
    return (this.playerAndType & 127) as MoveType;
  }

  get player(): number {
    return (this.playerAndType & 128) >>> 7;
  }

  /** The packed 32-bit representation of this move. */
  get hash(): number {
    return (
      ((this.fromSquare & 0xff) |
        ((this.toSquare & 0xff) << 8) |
        ((this.tag & 0xff) << 16) |
        (this.playerAndType << 24)) >>>
      0
    );
  }

  static fromSquareFromHash(moveHash: number): number {
    return moveHash & 0x000000ff;
  }

  static toSquareFromHash(moveHash: number): number {
    return (moveHash & 0x0000ff00) >>> 8;
  }

  static playerFromHash(moveHash: number): number {
    return (moveHash >>> 31) & 1;
  }

  static tagFromHash(moveHash: number): number {
    return (moveHash & 0x00ff0000) >>> 16;
  }

  static moveTypeFromHash(moveHash: number): MoveType {
    return ((moveHash & 0x7f000000) >>> 24) as MoveType;
  }

  equals(other: Movement | null): boolean {
    if (other === null) return false;
    return (
      this.fromSquare === other.fromSquare &&
      this.toSquare === other.toSquare &&
      this.playerAndType === other.playerAndType &&
      this.tag === other.tag
    );
  }

  /** True if this move's packed hash equals the given hash. */
  equalsHash(hash: number): boolean {
    return this.hash === hash;
  }
}
