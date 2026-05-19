/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/TTHashEntry.cs
 ***************************************************************************/

/** The kind of bound a transposition-table score represents. */
export enum HashType {
  NoHash = 0,
  UpperBound = 1,
  LowerBound = 2,
  Exact = UpperBound | LowerBound,
  Quiescent = 4,
  MoveOnly = 8,
}

const GENERATION_MASK = 0x1ffn;
const HASH_MASK = ((1n << 64n) - 1n) ^ GENERATION_MASK;

/**
 * One transposition-table slot: a position hash (with the search generation
 * packed into its low 9 bits), the best move found, and a packed `data` word
 * holding score, depth and bound type.
 */
export class TTHashEntry {
  private hash = 0n;
  private moveHashValue = 0;
  private data = 0;

  /** True if this slot stores the given position (ignoring the generation bits). */
  checkHash(hashToCheck: bigint): boolean {
    return (this.hash & HASH_MASK) === (hashToCheck & HASH_MASK);
  }

  get generation(): number {
    return Number(this.hash & GENERATION_MASK);
  }

  get moveHash(): number {
    return this.moveHashValue;
  }

  get type(): HashType {
    return (this.data & 0x000000ff) as HashType;
  }

  get depth(): number {
    return (this.data >> 8) & 0x000000ff;
  }

  get score(): number {
    return this.data >> 16;
  }

  /** Overwrite this slot. */
  setData(
    hash: bigint,
    moveHash: number,
    hashType: HashType,
    depth: number,
    score: number,
    generation: number,
  ): void {
    this.moveHashValue = moveHash;
    this.hash = (hash & HASH_MASK) | BigInt(generation & 0x1ff);
    this.data = ((score << 16) | ((depth & 0xff) << 8) | (hashType & 0xff)) | 0;
  }

  /** Reset the slot to empty. */
  reset(): void {
    this.hash = 0n;
    this.moveHashValue = 0;
    this.data = 0;
  }
}
