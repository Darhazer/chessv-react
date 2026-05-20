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
 *  only and is deferred. The Capablanca variants using "Flexible" castling
 *  (Schoolbook, Grotesque, Ladorean, Univers, Carrera's) are deferred until
 *  the FlexibleCastlingRule is ported.
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
