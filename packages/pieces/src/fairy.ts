/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/Berolina/BerolinaPawn.cs,
 *  ChessV.Games/Pieces/Diamond/DiamondPawn.cs,
 *  ChessV.Games/Pieces/ChessMissingCompounds.cs and
 *  ChessV.Games/Pieces/CwDA.cs
 ***************************************************************************/

import { Direction, PieceType } from '@chessv/engine';
import { Bishop, Knight, Rook } from './chess.js';
import { Dabbabah, Elephant, Ferz, Tribbabah, Wazir } from './movementAtoms.js';

/** The Berolina pawn: moves diagonally forward, captures straight forward. */
export class BerolinaPawn extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Berolina Pawn', name, notation, midgameValue, endgameValue, preferredImageName);
    this.isPawn = true;
    this.isSliced = false;
    BerolinaPawn.addMoves(this);

    this.pstMidgameForwardness = 7;
    this.pstEndgameForwardness = 10;
    this.pstMidgameInSmallCenter = 8;
  }

  static addMoves(type: PieceType): void {
    type.stepMoveOnly(new Direction(1, 1));
    type.stepMoveOnly(new Direction(1, -1));
    type.stepCaptureOnly(new Direction(1, 0));
  }
}

/** The Diamond Chess pawn: the board is rotated 45°, so it moves toward a corner. */
export class DiamondPawn extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Diamond Pawn', name, notation, midgameValue, endgameValue, preferredImageName);
    this.isPawn = true;
    this.isSliced = false;
    DiamondPawn.addMoves(this);

    this.pstMidgameForwardness = 25;
    this.pstEndgameForwardness = 35;
  }

  static addMoves(type: PieceType): void {
    type.stepMoveOnly(new Direction(1, -1));
    type.stepCaptureOnly(new Direction(1, 0));
    type.stepCaptureOnly(new Direction(0, -1));
  }
}

/** Bishop + Knight. */
export class Archbishop extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Archbishop', name, notation, midgameValue, endgameValue, preferredImageName);
    Archbishop.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Bishop.addMoves(type);
    Knight.addMoves(type);
  }
}

/** Rook + Knight. */
export class Chancellor extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Chancellor', name, notation, midgameValue, endgameValue, preferredImageName);
    Chancellor.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Rook.addMoves(type);
    Knight.addMoves(type);
  }
}

/** Ferz + Dabbabah + Tribbabah — the Remarkable Rookies' "Lion". */
export class Lion extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Lion', name, notation, midgameValue, endgameValue, preferredImageName);
    Lion.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Dabbabah.addMoves(type);
    Tribbabah.addMoves(type);
  }
}

/** Ferz + Elephant + Dabbabah — the Colorbound Clobberers' "War Elephant". */
export class WarElephant extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('War Elephant', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'Elephant Ferz Dabbabah';
    WarElephant.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Elephant.addMoves(type);
    Dabbabah.addMoves(type);
  }
}

/** Wazir + Elephant — the Colorbound Clobberers' "Phoenix". */
export class Phoenix extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Phoenix', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'Elephant Wazir';
    Phoenix.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Wazir.addMoves(type);
    Elephant.addMoves(type);
  }
}

/** Bishop + Dabbabah — the Colorbound Clobberers' "Cleric". */
export class Cleric extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Cleric', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'Bishop Debbabah';
    Cleric.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Bishop.addMoves(type);
    Dabbabah.addMoves(type);
  }
}

/** A Rook that slides at most four squares — the Remarkable Rookies' "Short Rook". */
export class ShortRook extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Short Rook', name, notation, midgameValue, endgameValue, preferredImageName);
    ShortRook.addMoves(this);

    this.pstMidgameSmallCenterAttacks = 2;
    this.pstMidgameLargeCenterAttacks = 2;
    this.pstMidgameForwardness = -1;
  }

  static addMoves(type: PieceType): void {
    type.slide(new Direction(0, 1), 4);
    type.slide(new Direction(0, -1), 4);
    type.slide(new Direction(1, 0), 4);
    type.slide(new Direction(-1, 0), 4);
  }
}

/** Wazir + Dabbabah — the Remarkable Rookies' "Tower". */
export class Tower extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Tower', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'Wazir Dabbabah';
    Tower.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Wazir.addMoves(type);
    Dabbabah.addMoves(type);
  }
}

/** The Nutty Knights' "Lancer" — a Ferz plus the two narrow Knight leaps. */
export class NarrowKnight extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Narrow Knight', name, notation, midgameValue, endgameValue, preferredImageName);
    NarrowKnight.addMoves(this);

    this.pstMidgameInSmallCenter = 12;
    this.pstMidgameInLargeCenter = 8;
    this.pstMidgameForwardness = 2;
    this.pstMidgameLargeCenterAttacks = 4;
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    type.step(new Direction(2, 1));
    type.step(new Direction(2, -1));
    type.step(new Direction(-2, -1));
    type.step(new Direction(-2, 1));
  }
}

/** The Nutty Knights' "Charging Rook" — slides forward/sideways, steps back. */
export class ChargingRook extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Charging Rook', name, notation, midgameValue, endgameValue, preferredImageName);
    ChargingRook.addMoves(this);

    this.pstMidgameForwardness = -8;
    this.pstEndgameForwardness = -8;
  }

  static addMoves(type: PieceType): void {
    type.slide(new Direction(0, 1));
    type.slide(new Direction(0, -1));
    type.slide(new Direction(1, 0));
    type.step(new Direction(-1, 0));
    type.step(new Direction(-1, 1));
    type.step(new Direction(-1, -1));
  }
}

/** The Nutty Knights' "Charging Knight". */
export class ChargingKnight extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Charging Knight', name, notation, midgameValue, endgameValue, preferredImageName);
    ChargingKnight.addMoves(this);

    this.pstMidgameInSmallCenter = 12;
    this.pstMidgameInLargeCenter = 8;
    this.pstMidgameForwardness = 1;
    this.pstMidgameLargeCenterAttacks = 4;
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(1, 2));
    type.step(new Direction(2, 1));
    type.step(new Direction(2, -1));
    type.step(new Direction(1, -2));
    type.step(new Direction(-1, 1));
    type.step(new Direction(-1, 0));
    type.step(new Direction(-1, -1));
    type.step(new Direction(0, 1));
    type.step(new Direction(0, -1));
  }
}

/** The Nutty Knights' "Colonel". */
export class Colonel extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Colonel', name, notation, midgameValue, endgameValue, preferredImageName);
    Colonel.addMoves(this);

    this.pstMidgameForwardness = -6;
    this.pstEndgameForwardness = -6;
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(1, 2));
    type.step(new Direction(2, 1));
    type.step(new Direction(2, -1));
    type.step(new Direction(1, -2));
    type.step(new Direction(1, 1));
    type.step(new Direction(-1, 1));
    type.step(new Direction(1, -1));
    type.step(new Direction(-1, 0));
    type.step(new Direction(-1, -1));
    type.slide(new Direction(1, 0));
    type.slide(new Direction(0, 1));
    type.slide(new Direction(0, -1));
  }
}
