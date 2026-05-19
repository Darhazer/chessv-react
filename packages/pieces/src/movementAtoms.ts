/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/MovementAtoms.cs
 ***************************************************************************/

import { Direction, PieceType } from '@chessv/engine';

/** The orthogonal one-step mover — the building block of rook-like pieces. */
export class Wazir extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Wazir', name, notation, midgameValue, endgameValue, preferredImageName);
    Wazir.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(0, 1));
    type.step(new Direction(0, -1));
    type.step(new Direction(1, 0));
    type.step(new Direction(-1, 0));
  }
}

/** The diagonal one-step mover — the building block of bishop-like pieces. */
export class Ferz extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Ferz', name, notation, midgameValue, endgameValue, preferredImageName);
    Ferz.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(1, 1));
    type.step(new Direction(1, -1));
    type.step(new Direction(-1, 1));
    type.step(new Direction(-1, -1));
  }
}

/** The (2,2) diagonal leaper. */
export class Elephant extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Elephant', name, notation, midgameValue, endgameValue, preferredImageName);
    Elephant.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(2, 2));
    type.step(new Direction(2, -2));
    type.step(new Direction(-2, 2));
    type.step(new Direction(-2, -2));
  }
}

/** The (0,2) orthogonal leaper. */
export class Dabbabah extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Dabbabah', name, notation, midgameValue, endgameValue, preferredImageName);
    Dabbabah.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(0, 2));
    type.step(new Direction(0, -2));
    type.step(new Direction(2, 0));
    type.step(new Direction(-2, 0));
  }
}

/** The (0,3) orthogonal leaper. */
export class Tribbabah extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Tribbabah', name, notation, midgameValue, endgameValue, preferredImageName);
    Tribbabah.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(0, 3));
    type.step(new Direction(0, -3));
    type.step(new Direction(3, 0));
    type.step(new Direction(-3, 0));
  }
}

/** The (1,3) leaper. */
export class Camel extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Camel', name, notation, midgameValue, endgameValue, preferredImageName);
    Camel.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(1, 3));
    type.step(new Direction(3, 1));
    type.step(new Direction(3, -1));
    type.step(new Direction(1, -3));
    type.step(new Direction(-1, -3));
    type.step(new Direction(-3, -1));
    type.step(new Direction(-3, 1));
    type.step(new Direction(-1, 3));
  }
}

/** The (2,3) leaper. */
export class Zebra extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Zebra', name, notation, midgameValue, endgameValue, preferredImageName);
    Zebra.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(2, 3));
    type.step(new Direction(3, 2));
    type.step(new Direction(3, -2));
    type.step(new Direction(2, -3));
    type.step(new Direction(-2, -3));
    type.step(new Direction(-3, -2));
    type.step(new Direction(-3, 2));
    type.step(new Direction(-2, 3));
  }
}

/** The knight that slides — repeated (1,2) leaps. */
export class Nightrider extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Nightrider', name, notation, midgameValue, endgameValue, preferredImageName);
    Nightrider.addMoves(this);
    this.pstMidgameInSmallCenter = 12;
    this.pstMidgameInLargeCenter = 9;
  }

  static addMoves(type: PieceType): void {
    type.slide(new Direction(1, 2));
    type.slide(new Direction(2, 1));
    type.slide(new Direction(2, -1));
    type.slide(new Direction(1, -2));
    type.slide(new Direction(-1, -2));
    type.slide(new Direction(-2, -1));
    type.slide(new Direction(-2, 1));
    type.slide(new Direction(-1, 2));
  }
}
