/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/MoveCapability.cs
 ***************************************************************************/

import { Direction, SpecialAttacks } from './basics.js';
import type { Location } from './basics.js';
import { BitBoard } from './bitBoard.js';
import { ExObject } from './exObject.js';
import { MovePathInfo } from './movePathInfo.js';
import type { Game } from './game.js';

/** A lambda deciding whether a move is permitted from a given location. */
export type ConditionalLocationDelegate = (location: Location) => boolean;

/**
 * One movement capability of a piece type: a direction the piece may travel,
 * how far, and under what conditions it may move or capture.
 *
 * A piece type owns a list of these; together they define how it moves.
 */
export class MoveCapability extends ExObject {
  /** The direction of travel, as a (rank, file) offset. */
  direction: Direction = new Direction(0, 0);
  /** Minimum number of steps that may be taken. */
  minSteps = 1;
  /** Maximum number of steps that may be taken. */
  maxSteps = 9999;
  /** Whether an enemy piece may be captured with this move. */
  canCapture = true;
  /** Whether the move may ONLY be made when capturing. */
  mustCapture = false;
  /** Per-game direction number, assigned when the game's directions are built. */
  nDirection = 0;
  /** Special attack mode (cannon, rifle), if any. */
  specialAttacks: SpecialAttacks = SpecialAttacks.None;
  /** Path constraints for lame-leaper / multi-path pieces; null if unconstrained. */
  pathInfo: MovePathInfo | null = null;

  /**
   * If set, the move is only legal when the moving piece stands on a square
   * whose bit is set in `conditionalBySquare[player]`. Built from `condition`.
   */
  conditionalBySquare: BitBoard[] | null = null;
  /** Lambda determining where the move is allowed (translated per player). */
  condition: ConditionalLocationDelegate | null = null;

  constructor(
    direction?: Direction,
    maxSteps = 9999,
    minSteps = 1,
    canCapture = true,
    mustCapture = false,
  ) {
    super();
    if (direction) this.direction = direction;
    this.maxSteps = maxSteps;
    this.minSteps = minSteps;
    this.canCapture = canCapture;
    this.mustCapture = mustCapture;
  }

  /**
   * Resolve a square-based condition into a per-player bitboard, translating
   * each square through the game's symmetry so the condition holds for every
   * player from their own perspective.
   */
  initialize(game: Game): void {
    if (this.condition !== null && this.conditionalBySquare === null) {
      const condition = this.condition;
      this.conditionalBySquare = [];
      for (let player = 0; player < game.numPlayers; player++) {
        const bitboard = new BitBoard(game.board.numSquares);
        bitboard.setAll();
        for (let sq = 0; sq < game.board.numSquares; sq++) {
          const location = game.symmetry.translate(player, game.board.squareToLocation(sq));
          if (!condition(location)) {
            bitboard.clearBit(sq);
          }
        }
        this.conditionalBySquare[player] = bitboard;
      }
    }
  }

  /** Append a path constraint, creating the `MovePathInfo` if needed. */
  addPath(path: Direction[]): this {
    this.pathInfo ??= new MovePathInfo();
    this.pathInfo.addPath(path);
    return this;
  }

  // *** FACTORY HELPERS *** //

  /** A single-step move/capture in the given direction. */
  static step(direction: Direction): MoveCapability {
    return new MoveCapability(direction, 1);
  }

  /** An unlimited slide (move or capture) in the given direction. */
  static slide(direction: Direction, maxSteps = 9999): MoveCapability {
    return new MoveCapability(direction, maxSteps);
  }

  /** A single step that may move but not capture. */
  static stepMoveOnly(direction: Direction): MoveCapability {
    return new MoveCapability(direction, 1, 1, false);
  }

  /** An unlimited slide that may move but not capture. */
  static slideMoveOnly(direction: Direction): MoveCapability {
    return new MoveCapability(direction, 9999, 1, false);
  }

  /** A single step that may only be made as a capture. */
  static stepCaptureOnly(direction: Direction): MoveCapability {
    return new MoveCapability(direction, 1, 1, true, true);
  }

  /** An unlimited slide that may only be made as a capture. */
  static slideCaptureOnly(direction: Direction): MoveCapability {
    return new MoveCapability(direction, 9999, 1, true, true);
  }

  /** A cannon-style move (slides freely, captures by jumping a screen). */
  static cannonMove(direction: Direction, maxSteps = 9999): MoveCapability {
    const move = new MoveCapability(direction, maxSteps, 1, false, false);
    move.specialAttacks = SpecialAttacks.CannonCapture;
    return move;
  }

  /** A rifle-capture move (captures without vacating the origin square). */
  static rifleCapture(direction: Direction, maxSpaces: number): MoveCapability {
    const move = new MoveCapability(direction, maxSpaces, 1, true, true);
    move.specialAttacks = SpecialAttacks.CannonCapture;
    return move;
  }
}
