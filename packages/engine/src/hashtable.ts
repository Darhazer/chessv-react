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

import { HashType, TTHashEntry } from './ttHashEntry.js';
import { Movement } from './movement.js';
import { MoveType } from './basics.js';

/** Approximate bytes per entry, used only to size the table from a MB budget. */
const ENTRY_SIZE_BYTES = 24;

/**
 * The transposition table: a fixed array of {@link TTHashEntry} slots grouped
 * into 4-slot clusters. Stores search results keyed by Zobrist hash so
 * transposed positions can be recognised without re-searching.
 */
export class Hashtable {
  private tableData: TTHashEntry[] = [];
  private size = 0;
  private generation = 0;

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
    this.tableData = Array.from({ length: arraySize }, () => new TTHashEntry());
    this.size = arraySize;
  }

  /** Empty every slot. */
  clear(): void {
    for (const entry of this.tableData) entry.reset();
  }

  /** The cluster's starting index for a hash code. */
  private groupStart(hashcode: bigint): number {
    return Number(hashcode & BigInt(this.size - 1)) & 0xfffffffc;
  }

  /** Find the entry for a position, or null if absent. */
  lookup(hashcode: bigint): TTHashEntry | null {
    const start = this.groupStart(hashcode);
    for (let slot = 0; slot < 4; slot++) {
      const entry = this.tableData[start + slot]!;
      if (entry.checkHash(hashcode)) return entry;
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
      const entry = this.tableData[start + slot]!;
      if (entry.checkHash(hashcode)) {
        // Preserve the stored move if the new one is invalid.
        const move =
          Movement.moveTypeFromHash(moveHash) === MoveType.Invalid ? entry.moveHash : moveHash;
        entry.setData(hashcode, move, hashType, depth, score, this.generation);
        return;
      }
      if (entry.type === HashType.NoHash) {
        entry.setData(hashcode, moveHash, hashType, depth, score, this.generation);
        return;
      }
      const replaceEntry = this.tableData[replace]!;
      const c1 = replaceEntry.generation === this.generation ? 2 : 0;
      const c2 = entry.generation === this.generation ? -2 : 0;
      const c3 = entry.depth < replaceEntry.depth ? 1 : 0;
      if (c1 + c2 + c3 > 0) replace = start + slot;
    }
    this.tableData[replace]!.setData(hashcode, moveHash, hashType, depth, score, this.generation);
  }

  /** Advance to the next search generation (ages existing entries). */
  nextGeneration(): void {
    this.generation++;
  }
}
