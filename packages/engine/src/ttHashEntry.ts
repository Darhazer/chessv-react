/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/TTHashEntry.cs (the storage is now typed arrays
 *  on {@link Hashtable}; only the bound-type enum survives here).
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
