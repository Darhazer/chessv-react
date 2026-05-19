/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/Symmetry.cs
 ***************************************************************************/

import { Direction, Location } from './basics.js';
import type { Board } from './board.js';

/**
 * Describes how the board is shared between players: it translates a direction
 * or location from player 0's frame of reference into another player's.
 *
 * This lets a variant define pawn moves, the starting array, etc. once and
 * have them apply correctly for every player.
 */
export abstract class Symmetry {
  /** The board this symmetry operates on; assigned during game setup. */
  board: Board | null = null;

  /** Translate a movement direction into the given player's frame. */
  abstract translateDirection(player: number, direction: Direction): Direction;

  /** Translate a board location into the given player's frame. */
  abstract translate(player: number, location: Location): Location;
}

/** Identity symmetry: every player sees the board the same way. */
export class NoSymmetry extends Symmetry {
  override translateDirection(_player: number, direction: Direction): Direction {
    return direction;
  }

  override translate(_player: number, location: Location): Location {
    return location;
  }
}

/** Mirror symmetry: opponents are reflected across the horizontal axis (standard chess). */
export class MirrorSymmetry extends Symmetry {
  override translateDirection(player: number, direction: Direction): Direction {
    return new Direction(
      player === 0 ? direction.rankOffset : -direction.rankOffset,
      direction.fileOffset,
    );
  }

  override translate(player: number, location: Location): Location {
    const board = this.requireBoard();
    return new Location(
      player === 0 ? location.rank : board.numRanks - location.rank - 1,
      location.file,
    );
  }

  private requireBoard(): Board {
    if (this.board === null) throw new Error('Symmetry used before board was assigned');
    return this.board;
  }
}

/** Rotational symmetry: opponents are rotated 180° (used by some variants). */
export class RotationalSymmetry extends Symmetry {
  override translateDirection(player: number, direction: Direction): Direction {
    return new Direction(
      player === 0 ? direction.rankOffset : -direction.rankOffset,
      player === 0 ? direction.fileOffset : -direction.fileOffset,
    );
  }

  override translate(player: number, location: Location): Location {
    if (this.board === null) throw new Error('Symmetry used before board was assigned');
    return new Location(
      player === 0 ? location.rank : this.board.numRanks - location.rank - 1,
      player === 0 ? location.file : this.board.numFiles - location.file - 1,
    );
  }
}
