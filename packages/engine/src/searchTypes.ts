/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from the PV and SearchStack types in ChessV.Base/Basics.cs.
 ***************************************************************************/

import { MAX_PLY } from './constants.js';

/** A principal variation — a line of move hashes, one per ply. */
export class PV {
  readonly moveHashes: Uint32Array = new Uint32Array(MAX_PLY);

  get(moveNumber: number): number {
    return this.moveHashes[moveNumber] ?? 0;
  }

  set(moveNumber: number, value: number): void {
    this.moveHashes[moveNumber] = value;
  }

  /** Copy this PV's contents into another. */
  copyTo(target: PV): void {
    target.moveHashes.set(this.moveHashes);
  }
}

/** One ply's worth of search state. */
export class SearchStack {
  isInCheck = false;
  eval = 0;
  readonly pv: PV = new PV();
}

/** Create a fresh, initialized search stack of `MAX_PLY` entries. */
export function createSearchStack(): SearchStack[] {
  return Array.from({ length: MAX_PLY }, () => new SearchStack());
}
