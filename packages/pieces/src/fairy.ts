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

import { Direction, MoveCapability, MovePathInfo, PieceType } from '@chessv/engine';
import { Bishop, King, Knight, Queen, Rook } from './chess.js';
import { Camel, Dabbabah, Elephant, Ferz, Nightrider, Tribbabah, Wazir } from './movementAtoms.js';

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

/** Queen + Knight — the strongest single piece. */
export class Amazon extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Amazon', name, notation, midgameValue, endgameValue, preferredImageName);
    Amazon.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Queen.addMoves(type);
    Knight.addMoves(type);
  }
}

/** Knight + Elephant + Dabbabah. */
export class Squirrel extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Squirrel', name, notation, midgameValue, endgameValue, preferredImageName);
    Squirrel.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Knight.addMoves(type);
    Elephant.addMoves(type);
    Dabbabah.addMoves(type);
  }
}

/** A non-royal King — the one-step mover in all eight directions. */
export class General extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('General', name, notation, midgameValue, endgameValue, preferredImageName);
    General.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    King.addMoves(type);
  }
}

/** Ferz + Camel. */
export class Wizard extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Wizard', name, notation, midgameValue, endgameValue, preferredImageName);
    Wizard.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Camel.addMoves(type);
  }
}

/** Wazir + Dabbabah + Elephant. */
export class Champion extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Champion', name, notation, midgameValue, endgameValue, preferredImageName);
    Champion.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Wazir.addMoves(type);
    Dabbabah.addMoves(type);
    Elephant.addMoves(type);
  }
}

/** Bishop + Nightrider. */
export class Unicorn extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Unicorn', name, notation, midgameValue, endgameValue, preferredImageName);
    Unicorn.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Bishop.addMoves(type);
    Nightrider.addMoves(type);
  }
}

/** King + Knight. */
export class Centaur extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Centaur', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'Knight General';
    Centaur.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    King.addMoves(type);
    Knight.addMoves(type);
  }
}

/** Rook + Ferz — the promoted Shogi Rook. */
export class DragonKing extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Dragon King', name, notation, midgameValue, endgameValue, preferredImageName);
    DragonKing.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Rook.addMoves(type);
    Ferz.addMoves(type);
  }
}

/** Bishop + Wazir — the promoted Shogi Bishop. */
export class DragonHorse extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Dragon Horse', name, notation, midgameValue, endgameValue, preferredImageName);
    DragonHorse.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Bishop.addMoves(type);
    Wazir.addMoves(type);
  }
}

/** Wazir + Tribbabah. */
export class Scout extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Scout', name, notation, midgameValue, endgameValue, preferredImageName);
    Scout.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Wazir.addMoves(type);
    Tribbabah.addMoves(type);
  }
}

/** King + Elephant + Dabbabah — the "Jumping General". */
export class JumpingGeneral extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Jumping General', name, notation, midgameValue, endgameValue, preferredImageName);
    JumpingGeneral.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    King.addMoves(type);
    Elephant.addMoves(type);
    Dabbabah.addMoves(type);
  }
}

/** Knight + Wazir + Dabbabah. */
export class Minister extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Minister', name, notation, midgameValue, endgameValue, preferredImageName);
    Minister.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Knight.addMoves(type);
    Wazir.addMoves(type);
    Dabbabah.addMoves(type);
  }
}

/** Knight + Elephant + Ferz — the "High Priestess". */
export class HighPriestess extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('High Priestess', name, notation, midgameValue, endgameValue, preferredImageName);
    HighPriestess.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Knight.addMoves(type);
    Elephant.addMoves(type);
    Ferz.addMoves(type);
  }
}

/** Helper: add a single multi-path step move with the given candidate paths. */
function addPathMove(type: PieceType, target: Direction, paths: Direction[][]): void {
  const move = MoveCapability.step(target);
  const info = new MovePathInfo();
  for (const path of paths) info.addPath(path);
  move.pathInfo = info;
  type.addMoveCapability(move);
}

/**
 * Ferz + Elephant + the multi-path (3,3) and (4,4) diagonal "Elephantrider"
 * extensions — the "Oliphant" of Grand Shatranj.
 */
export class Oliphant extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super(
      'Oliphant',
      name,
      notation,
      midgameValue,
      endgameValue,
      preferredImageName ?? 'Ferz Elephantrider',
    );
    Oliphant.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Elephant.addMoves(type);
    for (const [dr, df] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      addPathMove(type, new Direction(3 * dr, 3 * df), [
        [new Direction(2 * dr, 2 * df), new Direction(dr, df)],
        [new Direction(dr, df), new Direction(2 * dr, 2 * df)],
      ]);
      addPathMove(type, new Direction(4 * dr, 4 * df), [
        [new Direction(2 * dr, 2 * df), new Direction(2 * dr, 2 * df)],
      ]);
    }
  }
}

/**
 * The "Free Padwar": slides up to two squares diagonally and may also leap
 * (2,0)/(0,2) along a clear diagonal multi-path.
 */
export class FreePadwar extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Free Padwar', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'ElephantFerz';
    FreePadwar.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.slide(new Direction(1, 1), 2);
    type.slide(new Direction(1, -1), 2);
    type.slide(new Direction(-1, 1), 2);
    type.slide(new Direction(-1, -1), 2);
    addPathMove(type, new Direction(2, 0), [
      [new Direction(1, 1), new Direction(1, -1)],
      [new Direction(1, -1), new Direction(1, 1)],
    ]);
    addPathMove(type, new Direction(-2, 0), [
      [new Direction(-1, 1), new Direction(-1, -1)],
      [new Direction(-1, -1), new Direction(-1, 1)],
    ]);
    addPathMove(type, new Direction(0, 2), [
      [new Direction(1, 1), new Direction(-1, 1)],
      [new Direction(-1, 1), new Direction(1, 1)],
    ]);
    addPathMove(type, new Direction(0, -2), [
      [new Direction(1, -1), new Direction(-1, -1)],
      [new Direction(-1, -1), new Direction(1, -1)],
    ]);
  }
}

/**
 * The "Chained Padwar": a (2,2) diagonal leaper (which may capture only at the
 * end square) plus the orthogonal (2,0)/(0,2) multi-path leaps.
 */
export class ChainedPadwar extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Chained Padwar', name, notation, midgameValue, endgameValue, preferredImageName);
    this.fallbackImage = 'ElephantFerz';
    ChainedPadwar.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    for (const [dr, df] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const move = new MoveCapability();
      move.minSteps = 2;
      move.maxSteps = 2;
      move.canCapture = true;
      move.direction = new Direction(dr, df);
      type.addMoveCapability(move);
    }
    addPathMove(type, new Direction(2, 0), [
      [new Direction(1, 1), new Direction(1, -1)],
      [new Direction(1, -1), new Direction(1, 1)],
    ]);
    addPathMove(type, new Direction(-2, 0), [
      [new Direction(-1, 1), new Direction(-1, -1)],
      [new Direction(-1, -1), new Direction(-1, 1)],
    ]);
    addPathMove(type, new Direction(0, 2), [
      [new Direction(1, 1), new Direction(-1, 1)],
      [new Direction(-1, 1), new Direction(1, 1)],
    ]);
    addPathMove(type, new Direction(0, -2), [
      [new Direction(1, -1), new Direction(-1, -1)],
      [new Direction(-1, -1), new Direction(1, -1)],
    ]);
  }
}

/**
 * Wazir + Dabbabah + the multi-path (3,0) and (4,0) orthogonal "Dabbabahrider"
 * extensions — the "Lightning Warmachine" of Grand Shatranj.
 */
export class LightningWarmachine extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super(
      'Lightning Warmachine',
      name,
      notation,
      midgameValue,
      endgameValue,
      preferredImageName ?? 'Wazir Dabbabahrider',
    );
    LightningWarmachine.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Wazir.addMoves(type);
    Dabbabah.addMoves(type);
    for (const [dr, df] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      addPathMove(type, new Direction(3 * dr, 3 * df), [
        [new Direction(2 * dr, 2 * df), new Direction(dr, df)],
        [new Direction(dr, df), new Direction(2 * dr, 2 * df)],
      ]);
      addPathMove(type, new Direction(4 * dr, 4 * df), [
        [new Direction(2 * dr, 2 * df), new Direction(2 * dr, 2 * df)],
      ]);
    }
  }
}
