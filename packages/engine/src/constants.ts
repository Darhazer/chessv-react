/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Engine-wide limit constants, ported from the static members of
 *  ChessV.Base/Game.cs.
 ***************************************************************************/

/** Maximum number of distinct movement directions a game may use. */
export const MAX_DIRECTIONS = 48;
/** Maximum number of distinct piece types a game may define. */
export const MAX_PIECE_TYPES = 24;
/** Maximum number of pieces a single player may have. */
export const MAX_PIECES = 64;
/** Maximum search depth, in plies. */
export const MAX_PLY = 128;
/** Maximum recorded game length, in plies. */
export const MAX_GAME_LENGTH = 1000;
/** One ply of search depth, in the engine's internal fractional-ply units. */
export const ONEPLY = 2;
/** Score representing a forced win/loss; effectively infinite. */
export const INFINITY = 1000000;
