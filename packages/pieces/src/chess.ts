/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/Chess.cs
 ***************************************************************************/

import { Direction, type Game, PieceType } from '@chessv/engine';
import { Ferz, Wazir } from './movementAtoms.js';

/** The orthogonal slider. */
export class Rook extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Rook', name, notation, midgameValue, endgameValue, preferredImageName);
    Rook.addMoves(this);

    this.pstMidgameInSmallCenter = 0;
    this.pstMidgameInLargeCenter = 0;
    this.pstMidgameSmallCenterAttacks = 2;
    this.pstMidgameLargeCenterAttacks = 2;
    this.pstMidgameForwardness = 0;
    this.pstMidgameGlobalOffset = 0;
    this.pstEndgameInSmallCenter = 0;
    this.pstEndgameInLargeCenter = 0;
    this.pstEndgameSmallCenterAttacks = 0;
    this.pstEndgameLargeCenterAttacks = 0;
    this.pstEndgameForwardness = 0;
    this.pstEndgameGlobalOffset = 0;
  }

  static addMoves(type: PieceType): void {
    type.slide(new Direction(0, 1));
    type.slide(new Direction(0, -1));
    type.slide(new Direction(1, 0));
    type.slide(new Direction(-1, 0));
  }
}

/** The diagonal slider. */
export class Bishop extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Bishop', name, notation, midgameValue, endgameValue, preferredImageName);
    Bishop.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    type.slide(new Direction(1, 1));
    type.slide(new Direction(1, -1));
    type.slide(new Direction(-1, 1));
    type.slide(new Direction(-1, -1));
  }
}

/** Rook + Bishop: the orthogonal and diagonal slider. */
export class Queen extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Queen', name, notation, midgameValue, endgameValue, preferredImageName);
    Queen.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Rook.addMoves(type);
    Bishop.addMoves(type);
  }
}

/** The (1,2) leaper. */
export class Knight extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Knight', name, notation, midgameValue, endgameValue, preferredImageName);
    Knight.addMoves(this);

    this.pstMidgameInSmallCenter = 8;
    this.pstMidgameInLargeCenter = 5;
    this.pstMidgameForwardness = 2;
    this.pstMidgameLargeCenterAttacks = 4;
  }

  static addMoves(type: PieceType): void {
    type.step(new Direction(1, 2));
    type.step(new Direction(2, 1));
    type.step(new Direction(2, -1));
    type.step(new Direction(1, -2));
    type.step(new Direction(-1, -2));
    type.step(new Direction(-2, -1));
    type.step(new Direction(-2, 1));
    type.step(new Direction(-1, 2));
  }
}

/** Ferz + Wazir: the one-step mover in all eight directions. */
export class King extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('King', name, notation, midgameValue, endgameValue, preferredImageName);
    King.addMoves(this);

    this.pstMidgameInSmallCenter = 0;
    this.pstMidgameInLargeCenter = 0;
    this.pstMidgameSmallCenterAttacks = 0;
    this.pstMidgameLargeCenterAttacks = 0;
    this.pstMidgameForwardness = -15;
    this.pstEndgameForwardness = 4;
    this.pstEndgameInLargeCenter = 12;
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    Wazir.addMoves(type);
  }
}

/** The chess pawn: steps forward, captures diagonally forward. */
export class Pawn extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Pawn', name, notation, midgameValue, endgameValue, preferredImageName);
    this.isPawn = true;
    this.isSliced = false;
    Pawn.addMoves(this);

    this.pstMidgameForwardness = 7;
    this.pstEndgameForwardness = 10;
    this.pstMidgameInSmallCenter = 6;
  }

  static addMoves(type: PieceType): void {
    type.stepMoveOnly(new Direction(1, 0));
    type.stepCaptureOnly(new Direction(1, 1));
    type.stepCaptureOnly(new Direction(1, -1));
  }

  /**
   * The pawn is the only type with non-zero pawn-hash keys, so that the pawn
   * structure hash table tracks pawns and nothing else.
   */
  override initialize(game: Game): void {
    super.initialize(game);
    for (let player = 0; player < game.numPlayers; player++) {
      this.pawnHashKeyIndex[player] = 256 * (player + 1);
    }
  }
}
