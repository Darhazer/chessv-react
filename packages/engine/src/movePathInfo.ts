/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/MovePathInfo.cs
 ***************************************************************************/

import type { Direction } from './basics.js';

/**
 * Describes the intermediate squares a move must travel through.
 *
 * Used only for "lame leapers" (e.g. the Xiangqi Horse) and multi-path pieces
 * (e.g. the Falcon in Falcon Chess). Each path is an ordered list of step
 * directions; a move is legal if at least one path is unobstructed.
 */
export class MovePathInfo {
  /** Candidate paths expressed as direction vectors. */
  readonly pathDirections: Direction[][] = [];
  /** The same paths resolved to per-game direction numbers (filled at init). */
  readonly pathNDirections: number[][] = [];
  /** Whether a path may capture more than one piece. */
  allowMultiCapture = false;

  addPath(path: Direction[]): void {
    this.pathDirections.push(path);
  }
}
