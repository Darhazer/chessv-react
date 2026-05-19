/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/TimeControl.cs — reduced to the fields the search
 *  consumes. The C# class also parsed XBoard time-control strings; that
 *  protocol cruft is unnecessary for the web port's local play.
 ***************************************************************************/

/**
 * Describes how long the engine may think for one move. All times are in
 * milliseconds. A field left at its default (0 / false) is "not set".
 */
export class TimeControl {
  /** Search until explicitly stopped (analysis mode). */
  infinite = false;
  /** Fixed time to spend on this move. */
  timePerMove = 0;
  /** Hard search-depth cap, in plies. */
  plyLimit = 0;
  /** Hard node cap. */
  nodeLimit = 0;
  /** Moves remaining before the next time control (0 = sudden death). */
  movesLeft = 0;
  /** Time remaining on the side-to-move's clock. */
  activeTimeLeft = 0;
  /** Fischer increment added after each move. */
  timeIncrement = 0;

  /** A time control that searches to a fixed depth. */
  static fixedDepth(plies: number): TimeControl {
    const tc = new TimeControl();
    tc.plyLimit = plies;
    return tc;
  }

  /** A time control that spends a fixed time per move. */
  static fixedTimePerMove(milliseconds: number): TimeControl {
    const tc = new TimeControl();
    tc.timePerMove = milliseconds;
    return tc;
  }

  /** A time control that searches a fixed number of nodes. */
  static fixedNodes(nodes: number): TimeControl {
    const tc = new TimeControl();
    tc.nodeLimit = nodes;
    return tc;
  }

  /** An unbounded (analysis) time control. */
  static analysis(): TimeControl {
    const tc = new TimeControl();
    tc.infinite = true;
    return tc;
  }
}
