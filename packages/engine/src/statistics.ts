/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/EngineStatistics.cs
 ***************************************************************************/

/** Search statistics accumulated while the engine is thinking. */
export class Statistics {
  /** Time (epoch ms) the search started. */
  searchStartTime = 0;
  /** Total nodes visited. */
  nodes = 0;
  /** Quiescence-search nodes visited. */
  qNodes = 0;
  pawnHashLookups = 0;
  pawnHashHits = 0;
  materialHashLookups = 0;
  materialHashHits = 0;

  /** Zero every counter. */
  reset(): void {
    this.nodes = 0;
    this.qNodes = 0;
    this.pawnHashLookups = 0;
    this.pawnHashHits = 0;
    this.materialHashLookups = 0;
    this.materialHashHits = 0;
  }
}
