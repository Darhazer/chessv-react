/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or (at your
 *  option) any later version.
 *
 *  Ported from ChessV.Base/HashKeys.cs
 ***************************************************************************/

/**
 * Zobrist hash keys.
 *
 * The original ChessV ships a fixed table of ~8700 precomputed 64-bit random
 * numbers. The web port instead derives the table deterministically with a
 * splitmix64 generator: exact key values are irrelevant to correctness (only
 * internal consistency matters for the transposition table and repetition
 * detection), and perft counts do not depend on hashing at all.
 *
 * The first 256 entries are zero — they are used as the "pawn hash" key for
 * non-pawn pieces so that those pieces do not affect the pawn hash.
 */

const MASK64 = (1n << 64n) - 1n;
const ZERO_KEY_COUNT = 256;
const KEY_POOL_SIZE = 16384;

function generateKeys(): bigint[] {
  const keys = new Array<bigint>(KEY_POOL_SIZE);
  for (let i = 0; i < ZERO_KEY_COUNT; i++) {
    keys[i] = 0n;
  }
  // splitmix64 with the canonical golden-ratio increment.
  let state = 0x9e3779b97f4a7c15n;
  for (let i = ZERO_KEY_COUNT; i < KEY_POOL_SIZE; i++) {
    state = (state + 0x9e3779b97f4a7c15n) & MASK64;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    z = (z ^ (z >> 31n)) & MASK64;
    keys[i] = z;
  }
  return keys;
}

/**
 * Allocates ranges of Zobrist keys to the various hashed game elements.
 *
 * `Keys` is the shared, deterministic key pool. `takeKeys` / `takeMaterialKeys`
 * hand out non-overlapping index ranges into it, exactly as the C# original
 * does — separate cursors keep the position hash and material hash independent.
 */
export class HashKeys {
  /** The shared pool of Zobrist keys. Indexed by the values `takeKeys` returns. */
  static readonly Keys: readonly bigint[] = generateKeys();

  private nextKey = ZERO_KEY_COUNT;
  private nextMaterialKey = ZERO_KEY_COUNT;

  /** Reserve `count` consecutive position-hash keys; returns the first index. */
  takeKeys(count: number): number {
    if (this.nextKey + count > HashKeys.Keys.length) {
      throw new Error('Not enough Zobrist keys!');
    }
    const given = this.nextKey;
    this.nextKey += count;
    return given;
  }

  /** Reserve `count` consecutive material-hash keys; returns the first index. */
  takeMaterialKeys(count: number): number {
    if (this.nextMaterialKey + count > HashKeys.Keys.length) {
      throw new Error('Not enough Zobrist keys!');
    }
    const given = this.nextMaterialKey;
    this.nextMaterialKey += count;
    return given;
  }
}
