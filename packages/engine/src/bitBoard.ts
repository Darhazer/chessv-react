/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/BitBoard.cs
 ***************************************************************************/

/**
 * A fixed-width set of bits, one per board square.
 *
 * The C# original packs the bits into three hand-tuned 64-bit words with SWAR
 * popcount. Boards never exceed a few hundred squares, so the web port backs
 * the set with a single `bigint` — exact, simple, and large enough for any
 * board. Bit-level performance can be revisited during hardening if profiling
 * shows it matters inside the search.
 */
export class BitBoard {
  private bits = 0n;
  /** Number of meaningful bits (board squares). */
  readonly numBits: number;

  constructor(numBits: number) {
    this.numBits = numBits;
  }

  /** Mask covering exactly `numBits` low bits. */
  private get mask(): bigint {
    return (1n << BigInt(this.numBits)) - 1n;
  }

  /** Remove every bit from the set. */
  clear(): void {
    this.bits = 0n;
  }

  /** Set every bit in `[0, numBits)`. */
  setAll(): void {
    this.bits = this.mask;
  }

  setBit(bitNumber: number): void {
    this.bits |= 1n << BigInt(bitNumber);
  }

  clearBit(bitNumber: number): void {
    this.bits &= ~(1n << BigInt(bitNumber));
  }

  isBitSet(bitNumber: number): boolean {
    return (this.bits >> BigInt(bitNumber)) & 1n ? true : false;
  }

  getBit(bitNumber: number): number {
    return Number((this.bits >> BigInt(bitNumber)) & 1n);
  }

  get isEmpty(): boolean {
    return this.bits === 0n;
  }

  /** Number of bits currently set. */
  get bitCount(): number {
    let x = this.bits;
    let count = 0;
    while (x !== 0n) {
      x &= x - 1n;
      count++;
    }
    return count;
  }

  /** Index of the least-significant set bit, or -1 if empty. */
  get lsb(): number {
    if (this.bits === 0n) return -1;
    let x = this.bits;
    let index = 0;
    while ((x & 1n) === 0n) {
      x >>= 1n;
      index++;
    }
    return index;
  }

  /** Returns and clears the least-significant set bit (-1 if empty). */
  extractLSB(): number {
    const index = this.lsb;
    if (index >= 0) {
      this.bits &= this.bits - 1n;
    }
    return index;
  }

  /** A deep, independent copy of this bitboard. */
  clone(): BitBoard {
    const copy = new BitBoard(this.numBits);
    copy.bits = this.bits;
    return copy;
  }

  /** Iterate the indices of every set bit, from least significant upward. */
  *[Symbol.iterator](): IterableIterator<number> {
    let x = this.bits;
    let index = 0;
    while (x !== 0n) {
      if (x & 1n) yield index;
      x >>= 1n;
      index++;
    }
  }
}
