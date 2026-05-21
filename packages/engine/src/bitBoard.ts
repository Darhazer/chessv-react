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

/** SWAR-style population count for one 32-bit word. */
function popcount32(value: number): number {
  let x = value | 0;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return ((x * 0x01010101) >>> 24) & 0xff;
}

/**
 * A fixed-width set of bits, one per board square. Stored as an array of
 * 32-bit words rather than a bigint so set/clear/test are constant-time
 * integer ops instead of bigint allocations — the search touches several
 * bitboards per make/unmake, and bigint arithmetic dominates the profile.
 */
export class BitBoard {
  /** Number of meaningful bits (board squares). */
  readonly numBits: number;
  private readonly words: Uint32Array;

  constructor(numBits: number) {
    this.numBits = numBits;
    this.words = new Uint32Array(Math.max(1, (numBits + 31) >>> 5));
  }

  /** Remove every bit from the set. */
  clear(): void {
    this.words.fill(0);
  }

  /** Set every bit in `[0, numBits)`. */
  setAll(): void {
    const n = this.words.length;
    for (let i = 0; i < n - 1; i++) this.words[i] = 0xffffffff;
    const tail = this.numBits & 31;
    this.words[n - 1] = tail === 0 ? 0xffffffff : (1 << tail) - 1;
  }

  setBit(bitNumber: number): void {
    this.words[bitNumber >>> 5]! |= 1 << (bitNumber & 31);
  }

  clearBit(bitNumber: number): void {
    this.words[bitNumber >>> 5]! &= ~(1 << (bitNumber & 31));
  }

  isBitSet(bitNumber: number): boolean {
    return ((this.words[bitNumber >>> 5]! >>> (bitNumber & 31)) & 1) !== 0;
  }

  getBit(bitNumber: number): number {
    return (this.words[bitNumber >>> 5]! >>> (bitNumber & 31)) & 1;
  }

  get isEmpty(): boolean {
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i] !== 0) return false;
    }
    return true;
  }

  /** Number of bits currently set. */
  get bitCount(): number {
    let count = 0;
    for (let i = 0; i < this.words.length; i++) count += popcount32(this.words[i]!);
    return count;
  }

  /** Index of the least-significant set bit, or -1 if empty. */
  get lsb(): number {
    for (let i = 0; i < this.words.length; i++) {
      const w = this.words[i]!;
      if (w !== 0) return (i << 5) + ctz32(w);
    }
    return -1;
  }

  /** Returns and clears the least-significant set bit (-1 if empty). */
  extractLSB(): number {
    for (let i = 0; i < this.words.length; i++) {
      const w = this.words[i]!;
      if (w !== 0) {
        const bit = (i << 5) + ctz32(w);
        // Clear the lowest set bit: w & (w - 1).
        this.words[i] = (w & (w - 1)) >>> 0;
        return bit;
      }
    }
    return -1;
  }

  /** A deep, independent copy of this bitboard. */
  clone(): BitBoard {
    const copy = new BitBoard(this.numBits);
    copy.words.set(this.words);
    return copy;
  }

  /** Iterate the indices of every set bit, from least significant upward. */
  *[Symbol.iterator](): IterableIterator<number> {
    for (let i = 0; i < this.words.length; i++) {
      let w = this.words[i]!;
      const base = i << 5;
      while (w !== 0) {
        const bit = ctz32(w);
        yield base + bit;
        w = (w & (w - 1)) >>> 0;
      }
    }
  }
}

/** Count trailing zeros of a non-zero 32-bit word. */
function ctz32(value: number): number {
  // Math.log2 with isolate-LSB trick — exact for powers of two.
  const isolated = value & -value;
  // De Bruijn lookup avoids Math.log2's float round-trip.
  return DE_BRUIJN_TABLE[(Math.imul(isolated, 0x077cb531) >>> 27) & 31]!;
}

/** Index table for the de Bruijn 32-bit ctz. */
const DE_BRUIJN_TABLE: readonly number[] = [
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8, 31, 27, 13, 23, 21, 19, 16, 7, 26, 12,
  18, 6, 11, 5, 10, 9,
];
