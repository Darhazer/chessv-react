/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/CapablancaChess.cs
 *
 *  Phase note: the C# `AddEvaluations` (king-safety / rook-type) is evaluation
 *  only and is deferred.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Archbishop, Chancellor } from '@chessv/pieces';
import { Generic10x8 } from '../abstract/generic10x8.js';

/**
 * Capablanca Chess — José Raúl Capablanca's 1940 10×8 variant adding the
 * Archbishop (Bishop + Knight) and Chancellor (Rook + Knight). Used as the base
 * for a family of variants that differ mostly in piece arrangement.
 */
export class CapablancaChess extends Generic10x8 {
  archbishop!: PieceType;
  chancellor!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Capablanca Chess';
    this.array = 'rnabqkbcnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNABQKBCNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Standard';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QCARBN';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.archbishop = new Archbishop('Archbishop', 'A', 825, 850)));
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 875, 875)));
  }
}

/** Bird's Chess — Henry Bird's 1874 Capablanca-family setup. */
export class BirdsChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = "Bird's Chess";
    this.array = 'rnbcqkabnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNBCQKABNR';
  }
}

/** Embassy Chess — Kevin Hill's 2005 Capablanca-family setup. */
export class EmbassyChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Embassy Chess';
    this.array = 'rnbqkcabnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNBQKCABNR';
  }
}

/** Gothic Chess — Ed Trice's 2002 Capablanca-family setup. */
export class GothicChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Gothic Chess';
    this.castling.value = 'Standard';
    this.array = 'rnbqckabnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNBQCKABNR';
  }
}

/** Victorian Chess — David Paulowich & John Kipling Lewis's 2005 setup. */
export class VictorianChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Victorian Chess';
    this.castling.value = 'Close-Rook';
    this.array = 'crnbkabnrq/pppppppppp/10/10/10/10/PPPPPPPPPP/CRNBKABNRQ';
    this.promotionTypes = 'QCA';
  }
}

/** Opti Chess — Derek Nalls's 2006 Capablanca-family setup. */
export class OptiChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Opti Chess';
    this.castling.value = 'Close-Rook';
    this.array = 'nrcbqkbarn/pppppppppp/10/10/10/10/PPPPPPPPPP/NRCBQKBARN';
  }
}

/** Modern Carrera's Chess — Fergus Duniho & Sam Trenholme's 1999 setup. */
export class ModernCarrerasChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = "Modern Carrera's Chess";
    this.castling.value = 'Standard';
    this.array = 'ranbqkbncr/pppppppppp/10/10/10/10/PPPPPPPPPP/RANBQKBNCR';
  }
}

/**
 * Carrera's Chess — Pietro Carrera's 1617 setup. The earliest of the
 * Capablanca-family variants; uses no castling at all.
 */
export class CarrerasChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = "Carrera's Chess";
    this.castling.value = 'None';
    this.array = 'rcnbkqbnar/pppppppppp/10/10/10/10/PPPPPPPPPP/RCNBKQBNAR';
  }
}

/**
 * Schoolbook Chess — Sam Trenholme's 2006 setup; uses flexible castling
 * (king slides two or more files toward the corner piece).
 */
export class SchoolbookChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Schoolbook Chess';
    this.castling.value = 'Flexible';
    this.array = 'rqnbakbncr/pppppppppp/10/10/10/10/PPPPPPPPPP/RQNBAKBNCR';
  }
}

/** Grotesque Chess — Fergus Duniho's 2004 setup; flexible castling. */
export class GrotesqueChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Grotesque Chess';
    this.castling.value = 'Flexible';
    this.array = 'rbqnkcnabr/pppppppppp/10/10/10/10/PPPPPPPPPP/RBQNKCNABR';
  }
}

/** Ladorean Chess — Bernhard U. Hermes's 2005 setup; flexible castling. */
export class LadoreanChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Ladorean Chess';
    this.castling.value = 'Flexible';
    this.array = 'rbqnkancbr/pppppppppp/10/10/10/10/PPPPPPPPPP/RBQNKANCBR';
  }
}

/** Univers Chess — Fergus Duniho & Bruno Violet's 2006 setup; flexible castling. */
export class UniversChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Univers Chess';
    this.castling.value = 'Flexible';
    this.array = 'rbncqkanbr/pppppppppp/10/10/10/10/PPPPPPPPPP/RBNCQKANBR';
  }
}
