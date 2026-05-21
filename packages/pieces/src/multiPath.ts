/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/MultiPath.cs (Falcon, BentHero,
 *  BentShaman, SlidingGeneral).
 *
 *  A multi-path piece reaches its destination via at least one of several
 *  ordered step paths. A move is legal if any one of the paths has all
 *  intermediate squares empty — the engine's `MovePathInfo` machinery (see
 *  packages/engine/src/movePathInfo.ts and game.ts:1391) handles the
 *  per-path emptiness check at search time.
 ***************************************************************************/

import { Direction, MoveCapability, PieceType } from '@chessv/engine';
import { Dabbabah, Elephant, Ferz, Wazir } from './movementAtoms.js';

/**
 * Helper: a leap from origin by `direction` whose legality requires that at
 * least one of `paths` (each a list of unit step-directions) be unobstructed.
 */
function pathMove(direction: Direction, paths: Direction[][]): MoveCapability {
  const move = MoveCapability.step(direction);
  for (const path of paths) move.addPath(path);
  return move;
}

/**
 * Falcon — the namesake piece of Falcon Chess (George Duke, 1992). Leaps
 * three squares in any of the eight (3,1)/(3,2)/(2,3)/(1,3) directions
 * through three orthogonal/diagonal unit steps; at least one of three
 * possible paths must be clear.
 */
export class Falcon extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Falcon', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'Bird';
    Falcon.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    // Each (df,dr) outer-knight leap has three "near-corner" paths through
    // unit steps. The pattern is symmetric across the 8 leap directions —
    // for each (a,b) we generate paths permuting one (1,1) (diagonal) step
    // and two orthogonal steps.
    const leaps: [Direction, Direction[][]][] = [
      // (rank=3, file=±1/±2)  →  two orthogonal vertical + one diagonal
      [new Direction(3, 1),  [[new Direction(1, 1), new Direction(1, 0), new Direction(1, 0)],
                              [new Direction(1, 0), new Direction(1, 1), new Direction(1, 0)],
                              [new Direction(1, 0), new Direction(1, 0), new Direction(1, 1)]]],
      [new Direction(3, 2),  [[new Direction(1, 1), new Direction(1, 1), new Direction(1, 0)],
                              [new Direction(1, 1), new Direction(1, 0), new Direction(1, 1)],
                              [new Direction(1, 0), new Direction(1, 1), new Direction(1, 1)]]],
      [new Direction(2, 3),  [[new Direction(0, 1), new Direction(1, 1), new Direction(1, 1)],
                              [new Direction(1, 1), new Direction(0, 1), new Direction(1, 1)],
                              [new Direction(1, 1), new Direction(1, 1), new Direction(0, 1)]]],
      [new Direction(1, 3),  [[new Direction(1, 1), new Direction(0, 1), new Direction(0, 1)],
                              [new Direction(0, 1), new Direction(1, 1), new Direction(0, 1)],
                              [new Direction(0, 1), new Direction(0, 1), new Direction(1, 1)]]],
      [new Direction(3, -1), [[new Direction(1, -1), new Direction(1, 0), new Direction(1, 0)],
                              [new Direction(1, 0), new Direction(1, -1), new Direction(1, 0)],
                              [new Direction(1, 0), new Direction(1, 0), new Direction(1, -1)]]],
      [new Direction(3, -2), [[new Direction(1, -1), new Direction(1, -1), new Direction(1, 0)],
                              [new Direction(1, -1), new Direction(1, 0), new Direction(1, -1)],
                              [new Direction(1, 0), new Direction(1, -1), new Direction(1, -1)]]],
      [new Direction(2, -3), [[new Direction(0, -1), new Direction(1, -1), new Direction(1, -1)],
                              [new Direction(1, -1), new Direction(0, -1), new Direction(1, -1)],
                              [new Direction(1, -1), new Direction(1, -1), new Direction(0, -1)]]],
      [new Direction(1, -3), [[new Direction(1, -1), new Direction(0, -1), new Direction(0, -1)],
                              [new Direction(0, -1), new Direction(1, -1), new Direction(0, -1)],
                              [new Direction(0, -1), new Direction(0, -1), new Direction(1, -1)]]],
      // Backward equivalents.
      [new Direction(-3, 1),  [[new Direction(-1, 1), new Direction(-1, 0), new Direction(-1, 0)],
                               [new Direction(-1, 0), new Direction(-1, 1), new Direction(-1, 0)],
                               [new Direction(-1, 0), new Direction(-1, 0), new Direction(-1, 1)]]],
      [new Direction(-3, 2),  [[new Direction(-1, 1), new Direction(-1, 1), new Direction(-1, 0)],
                               [new Direction(-1, 1), new Direction(-1, 0), new Direction(-1, 1)],
                               [new Direction(-1, 0), new Direction(-1, 1), new Direction(-1, 1)]]],
      [new Direction(-2, 3),  [[new Direction(0, 1), new Direction(-1, 1), new Direction(-1, 1)],
                               [new Direction(-1, 1), new Direction(0, 1), new Direction(-1, 1)],
                               [new Direction(-1, 1), new Direction(-1, 1), new Direction(0, 1)]]],
      [new Direction(-1, 3),  [[new Direction(-1, 1), new Direction(0, 1), new Direction(0, 1)],
                               [new Direction(0, 1), new Direction(-1, 1), new Direction(0, 1)],
                               [new Direction(0, 1), new Direction(0, 1), new Direction(-1, 1)]]],
      [new Direction(-3, -1), [[new Direction(-1, -1), new Direction(-1, 0), new Direction(-1, 0)],
                               [new Direction(-1, 0), new Direction(-1, -1), new Direction(-1, 0)],
                               [new Direction(-1, 0), new Direction(-1, 0), new Direction(-1, -1)]]],
      [new Direction(-3, -2), [[new Direction(-1, -1), new Direction(-1, -1), new Direction(-1, 0)],
                               [new Direction(-1, -1), new Direction(-1, 0), new Direction(-1, -1)],
                               [new Direction(-1, 0), new Direction(-1, -1), new Direction(-1, -1)]]],
      [new Direction(-2, -3), [[new Direction(0, -1), new Direction(-1, -1), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(0, -1), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(-1, -1), new Direction(0, -1)]]],
      [new Direction(-1, -3), [[new Direction(-1, -1), new Direction(0, -1), new Direction(0, -1)],
                               [new Direction(0, -1), new Direction(-1, -1), new Direction(0, -1)],
                               [new Direction(0, -1), new Direction(0, -1), new Direction(-1, -1)]]],
    ];
    for (const [dir, paths] of leaps) type.addMoveCapability(pathMove(dir, paths));
  }
}

/**
 * Bent Hero (Lemurian Shatranj) — Wazir + Dabbabah base moves, plus
 * 12 multi-path 3-square hops that go orthogonally with one possible
 * deflection along the way.
 */
export class BentHero extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Bent Hero', name, notation, midgameValue, endgameValue, preferredImageName);
    BentHero.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Wazir.addMoves(type);
    Dabbabah.addMoves(type);

    const leaps: [Direction, Direction[][]][] = [
      [new Direction(3, 0),  [[new Direction(2, 0), new Direction(1, 0)],
                              [new Direction(1, 0), new Direction(2, 0)]]],
      [new Direction(-3, 0), [[new Direction(-2, 0), new Direction(-1, 0)],
                              [new Direction(-1, 0), new Direction(-2, 0)]]],
      [new Direction(0, 3),  [[new Direction(0, 2), new Direction(0, 1)],
                              [new Direction(0, 1), new Direction(0, 2)]]],
      [new Direction(0, -3), [[new Direction(0, -2), new Direction(0, -1)],
                              [new Direction(0, -1), new Direction(0, -2)]]],
      [new Direction(2, 1),  [[new Direction(2, 0), new Direction(0, 1)],
                              [new Direction(0, 1), new Direction(2, 0)]]],
      [new Direction(-2, 1), [[new Direction(-2, 0), new Direction(0, 1)],
                              [new Direction(0, 1), new Direction(-2, 0)]]],
      [new Direction(1, 2),  [[new Direction(1, 0), new Direction(0, 2)],
                              [new Direction(0, 2), new Direction(1, 0)]]],
      [new Direction(-1, 2), [[new Direction(-1, 0), new Direction(0, 2)],
                              [new Direction(0, 2), new Direction(-1, 0)]]],
      [new Direction(-2, -1), [[new Direction(-2, 0), new Direction(0, -1)],
                               [new Direction(0, -1), new Direction(-2, 0)]]],
      [new Direction(2, -1),  [[new Direction(2, 0), new Direction(0, -1)],
                               [new Direction(0, -1), new Direction(2, 0)]]],
      [new Direction(-1, -2), [[new Direction(-1, 0), new Direction(0, -2)],
                               [new Direction(0, -2), new Direction(-1, 0)]]],
      [new Direction(1, -2),  [[new Direction(1, 0), new Direction(0, -2)],
                               [new Direction(0, -2), new Direction(1, 0)]]],
    ];
    for (const [dir, paths] of leaps) type.addMoveCapability(pathMove(dir, paths));
  }
}

/**
 * Bent Shaman (Lemurian Shatranj) — Ferz + Elephant base moves, plus
 * 12 multi-path 3-step diagonal-ish hops.
 */
export class BentShaman extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Bent Shaman', name, notation, midgameValue, endgameValue, preferredImageName);
    BentShaman.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Elephant.addMoves(type);

    const leaps: [Direction, Direction[][]][] = [
      [new Direction(3, 3),   [[new Direction(2, 2), new Direction(1, 1)],
                               [new Direction(1, 1), new Direction(2, 2)]]],
      [new Direction(-3, 3),  [[new Direction(-2, 2), new Direction(-1, 1)],
                               [new Direction(-1, 1), new Direction(-2, 2)]]],
      [new Direction(3, -3),  [[new Direction(2, -2), new Direction(1, -1)],
                               [new Direction(1, -1), new Direction(2, -2)]]],
      [new Direction(-3, -3), [[new Direction(-2, -2), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(-2, -2)]]],
      [new Direction(3, 1),   [[new Direction(2, 2), new Direction(1, -1)],
                               [new Direction(1, -1), new Direction(2, 2)]]],
      [new Direction(-3, 1),  [[new Direction(-2, 2), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(-2, 2)]]],
      [new Direction(1, 3),   [[new Direction(2, 2), new Direction(-1, 1)],
                               [new Direction(-1, 1), new Direction(2, 2)]]],
      [new Direction(-1, 3),  [[new Direction(-2, 2), new Direction(1, 1)],
                               [new Direction(1, 1), new Direction(-2, 2)]]],
      [new Direction(-3, -1), [[new Direction(-2, -2), new Direction(-1, 1)],
                               [new Direction(-1, 1), new Direction(-2, -2)]]],
      [new Direction(3, -1),  [[new Direction(2, -2), new Direction(1, 1)],
                               [new Direction(1, 1), new Direction(2, -2)]]],
      [new Direction(-1, -3), [[new Direction(-2, -2), new Direction(1, -1)],
                               [new Direction(1, -1), new Direction(-2, -2)]]],
      [new Direction(1, -3),  [[new Direction(2, -2), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(2, -2)]]],
    ];
    for (const [dir, paths] of leaps) type.addMoveCapability(pathMove(dir, paths));
  }
}

/**
 * Sliding General (Lemurian Shatranj) — Ferz + Wazir base, plus 16
 * multi-path 2-step moves covering every (±2, 0..±2) destination via the
 * appropriate intermediate unit-step path(s).
 */
export class SlidingGeneral extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Sliding General', name, notation, midgameValue, endgameValue, preferredImageName);
    SlidingGeneral.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Wazir.addMoves(type);

    const leaps: [Direction, Direction[][]][] = [
      [new Direction(2, 0),   [[new Direction(1, 0), new Direction(1, 0)],
                               [new Direction(1, -1), new Direction(1, 1)],
                               [new Direction(1, 1), new Direction(1, -1)]]],
      [new Direction(2, 1),   [[new Direction(1, 1), new Direction(1, 0)],
                               [new Direction(1, 0), new Direction(1, 1)]]],
      [new Direction(2, 2),   [[new Direction(1, 1), new Direction(1, 1)]]],
      [new Direction(1, 2),   [[new Direction(1, 1), new Direction(0, 1)],
                               [new Direction(0, 1), new Direction(1, 1)]]],
      [new Direction(0, 2),   [[new Direction(0, 1), new Direction(0, 1)],
                               [new Direction(1, 1), new Direction(-1, 1)],
                               [new Direction(-1, 1), new Direction(1, 1)]]],
      [new Direction(-1, 2),  [[new Direction(-1, 1), new Direction(0, 1)],
                               [new Direction(0, 1), new Direction(-1, 1)]]],
      [new Direction(-2, 2),  [[new Direction(-1, 1), new Direction(-1, 1)]]],
      [new Direction(-2, 1),  [[new Direction(-1, 1), new Direction(-1, 0)],
                               [new Direction(-1, 0), new Direction(-1, 1)]]],
      [new Direction(-2, 0),  [[new Direction(-1, 0), new Direction(-1, 0)],
                               [new Direction(-1, 1), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(-1, 1)]]],
      [new Direction(-2, -1), [[new Direction(-1, 0), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(-1, 0)]]],
      [new Direction(-2, -2), [[new Direction(-1, -1), new Direction(-1, -1)]]],
      [new Direction(-1, -2), [[new Direction(-1, -1), new Direction(0, -1)],
                               [new Direction(0, -1), new Direction(-1, -1)]]],
      [new Direction(0, -2),  [[new Direction(0, -1), new Direction(0, -1)],
                               [new Direction(1, -1), new Direction(-1, -1)],
                               [new Direction(-1, -1), new Direction(1, -1)]]],
      [new Direction(1, -2),  [[new Direction(1, -1), new Direction(0, -1)],
                               [new Direction(0, -1), new Direction(1, -1)]]],
      [new Direction(2, -2),  [[new Direction(1, -1), new Direction(1, -1)]]],
      [new Direction(2, -1),  [[new Direction(1, -1), new Direction(1, 0)],
                               [new Direction(1, 0), new Direction(1, -1)]]],
    ];
    for (const [dir, paths] of leaps) type.addMoveCapability(pathMove(dir, paths));
  }
}
