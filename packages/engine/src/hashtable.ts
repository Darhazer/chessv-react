/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/Hashtable.cs
 ***************************************************************************/

import { HashType } from './ttHashEntry.js';
import { Movement } from './movement.js';
import { MoveType } from './basics.js';

/** Approximate bytes per entry, used only to size the table from a MB budget. */
const ENTRY_SIZE_BYTES = 16;

const GENERATION_MASK = 0x1ffn;
const HASH_MASK = ((1n << 64n) - 1n) ^ GENERATION_MASK;

/**
 * A read-only view over one transposition-table slot. The same object is
 * returned from every successful {@link Hashtable.lookup}; the engine reads
 * its fields immediately and never holds it across a second lookup, which
 * lets the table avoid allocating per-call view objects.
 */
export interface TTHashEntryView {
  readonly moveHash: number;
  readonly type: HashType;
  readonly depth: number;
  readonly score: number;
}

/**
 * The transposition table. Stores search results keyed by Zobrist hash so
 * transposed positions can be recognised without re-searching.
 *
 * Storage is three parallel typed arrays (hashes / packed data / move hashes)
 * rather than an array of class instances — at a 128 MB budget that is
 * millions of slots and the per-object header overhead would dominate.
 * Slots are grouped into 4-slot clusters; the cluster start is derived from
 * the low bits of the position hash.
 */
export class Hashtable {
  private hashes: BigUint64Array = new BigUint64Array(0);
  /** Packed: `(score << 16) | (depth << 8) | type`. */
  private data: Int32Array = new Int32Array(0);
  private moves: Int32Array = new Int32Array(0);
  private size = 0;
  private generation = 0;

  /** Re-used view returned by {@link lookup}; mutated in place per call. */
  private readonly view: { moveHash: number; type: HashType; depth: number; score: number } = {
    moveHash: 0,
    type: HashType.NoHash,
    depth: 0,
    score: 0,
  };

  /** Size the table for roughly `sizeInMB` megabytes (clamped to 16–4096). */
  setSize(sizeInMB: number): void {
    const clamped = Math.min(Math.max(sizeInMB, 16), 4096);
    const sizeInBytes = clamped * (1 << 20);
    let clusters = 16;
    while (clusters * 4 * ENTRY_SIZE_BYTES <= sizeInBytes) clusters *= 2;
    clusters /= 2;
    this.allocate(clusters * 4);
  }

  private allocate(arraySize: number): void {
    this.hashes = new BigUint64Array(arraySize);
    this.data = new Int32Array(arraySize);
    this.moves = new Int32Array(arraySize);
    this.size = arraySize;
  }

  /** Empty every slot. */
  clear(): void {
    this.hashes.fill(0n);
    this.data.fill(0);
    this.moves.fill(0);
  }

  /** The cluster's starting index for a hash code. */
  private groupStart(hashcode: bigint): number {
    return Number(hashcode & BigInt(this.size - 1)) & 0xfffffffc;
  }

  /** True if `slot` stores the position with the given hash. */
  private slotMatches(slot: number, hashcode: bigint): boolean {
    return (this.hashes[slot]! & HASH_MASK) === (hashcode & HASH_MASK);
  }

  /** Find the entry for a position, or null if absent. */
  lookup(hashcode: bigint): TTHashEntryView | null {
    const start = this.groupStart(hashcode);
    for (let slot = 0; slot < 4; slot++) {
      const idx = start + slot;
      if (this.slotMatches(idx, hashcode)) {
        const packed = this.data[idx]!;
        if ((packed & 0xff) === HashType.NoHash) return null;
        this.view.moveHash = this.moves[idx]!;
        this.view.type = (packed & 0xff) as HashType;
        this.view.depth = (packed >> 8) & 0xff;
        this.view.score = packed >> 16;
        return this.view;
      }
    }
    return null;
  }

  /** Store a search result, choosing a slot with Stockfish's replacement scheme. */
  store(
    hashcode: bigint,
    score: number,
    depth: number,
    moveHash: number,
    hashType: HashType,
  ): void {
    const start = this.groupStart(hashcode);
    let replace = start;

    for (let slot = 0; slot < 4; slot++) {
      const idx = start + slot;
      if (this.slotMatches(idx, hashcode)) {
        // Preserve the stored move if the new one is invalid.
        const move =
          Movement.moveTypeFromHash(moveHash) === MoveType.Invalid ? this.moves[idx]! : moveHash;
        this.writeSlot(idx, hashcode, move, hashType, depth, score);
        return;
      }
      const type = (this.data[idx]! & 0xff) as HashType;
      if (type === HashType.NoHash) {
        this.writeSlot(idx, hashcode, moveHash, hashType, depth, score);
        return;
      }
      const replaceGeneration = Number(this.hashes[replace]! & GENERATION_MASK);
      const slotGeneration = Number(this.hashes[idx]! & GENERATION_MASK);
      const replaceDepth = (this.data[replace]! >> 8) & 0xff;
      const slotDepth = (this.data[idx]! >> 8) & 0xff;
      const c1 = replaceGeneration === this.generation ? 2 : 0;
      const c2 = slotGeneration === this.generation ? -2 : 0;
      const c3 = slotDepth < replaceDepth ? 1 : 0;
      if (c1 + c2 + c3 > 0) replace = idx;
    }
    this.writeSlot(replace, hashcode, moveHash, hashType, depth, score);
  }

  private writeSlot(
    idx: number,
    hashcode: bigint,
    moveHash: number,
    hashType: HashType,
    depth: number,
    score: number,
  ): void {
    this.hashes[idx] = (hashcode & HASH_MASK) | BigInt(this.generation & 0x1ff);
    this.moves[idx] = moveHash;
    this.data[idx] = ((score << 16) | ((depth & 0xff) << 8) | (hashType & 0xff)) | 0;
  }

  /** Advance to the next search generation (ages existing entries). */
  nextGeneration(): void {
    this.generation++;
  }
}
