/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/GrandChess.cs (and its descendants
 *  OpulentChess, TenCubedChess, UnicornGrandChess, EmperorsGame).
 *
 *  Phase note: the C# `AddEvaluations` blocks tune the AI evaluator and are
 *  evaluation-only — they are intentionally skipped here.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import {
  Amazon,
  Archbishop,
  Champion,
  Chancellor,
  Lion,
  Unicorn,
  Wazir,
  Wizard,
} from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/**
 * Grand Chess — Christian Freeling's 1984 10×10 variant. Adds the missing
 * compound pieces (Cardinal = Bishop + Knight, Marshall = Rook + Knight) and
 * promotes pawns by replacement: optional on the 8th/9th ranks, mandatory on
 * the 10th, and only into a piece the player has already lost.
 */
export class GrandChess extends Generic10x10 {
  cardinal!: PieceType;
  marshall!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Grand Chess';
    this.array = 'r8r/1nbqkmcbn1/pppppppppp/10/10/10/10/PPPPPPPPPP/1NBQKMCBN1/R8R';
    this.pawnMultipleMove.value = 'Grand';
    this.promotionRule.value = 'Grand';
    this.enPassant = true;
    this.castling.value = 'None';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.knight.midgameValue = 300;
    this.knight.endgameValue = 300;
    this.addPieceType((this.cardinal = new Archbishop('Cardinal', 'C', 750, 800)));
    this.addPieceType((this.marshall = new Chancellor('Marshall', 'M', 925, 975)));
  }
}

/**
 * Opulent Chess — Greg Strong's 2005 expansion of Grand Chess; adds Wizards
 * and Lions and turns the Knight into a Knight + Wazir.
 */
export class OpulentChess extends GrandChess {
  wizard!: PieceType;
  lion!: PieceType;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Opulent Chess';
    this.array = 'rw6wr/clnbqkbnla/pppppppppp/10/10/10/10/PPPPPPPPPP/CLNBQKBNLA/RW6WR';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.wizard = new Wizard('Wizard', 'W', 460, 460)));
    this.addPieceType((this.lion = new Lion('Lion', 'L', 475, 475)));
    Wazir.addMoves(this.knight);
    this.knight.midgameValue = 475;
    this.knight.endgameValue = 475;
    this.knight.preferredImage = 'Knight Wazir';
    // Grand Chess names match Capablanca conventions in Opulent.
    this.marshall.name = 'Chancellor';
    this.marshall.setNotation('C');
    this.cardinal.name = 'Archbishop';
    this.cardinal.setNotation('A');
  }
}

/**
 * TenCubed Chess — David Paolowich's 2005 10×10 variant. Drops back to
 * Standard promotion (Q / Marshall / Archbishop) and adds Wizard + Champion.
 */
export class TenCubedChess extends GrandChess {
  wizard!: PieceType;
  champion!: PieceType;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'TenCubed Chess';
    this.array = '2cwamwc2/1rnbqkbnr1/pppppppppp/10/10/10/10/PPPPPPPPPP/1RNBQKBNR1/2CWAMWC2';
    this.pawnMultipleMove.value = 'Grand';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QMA';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.wizard = new Wizard('Wizard', 'W', 460, 460)));
    this.addPieceType((this.champion = new Champion('Champion', 'C', 475, 475)));
    this.cardinal.name = 'Archbishop';
    this.cardinal.setNotation('A');
  }
}

/**
 * Unicorn Grand Chess — Paulowich & Strong's 2006 variant; swaps the
 * Cardinal for a Unicorn and adds a Lion.
 */
export class UnicornGrandChess extends GrandChess {
  unicorn!: PieceType;
  lion!: PieceType;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Unicorn Grand Chess';
    this.array = 'r8r/cnlbukblnq/pppppppppp/10/10/10/10/PPPPPPPPPP/CNLBUKBLNQ/R8R';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.cardinal.enabled = false;
    this.marshall.name = 'Chancellor';
    this.marshall.setNotation('C');
    this.addPieceType((this.unicorn = new Unicorn('Unicorn', 'U', 1050, 1125)));
    this.addPieceType((this.lion = new Lion('Lion', 'L', 450, 450)));
  }
}

/**
 * Emperor's Game — L. Tressan's 1840 large-board variant; adds a General
 * (Amazon) and Adjutant (Archbishop), allows the pawn to leap three squares
 * from its starting rank, and uses Long castling.
 */
export class EmperorsGame extends Generic10x10 {
  general!: PieceType;
  adjutant!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = "Emperor's Game";
    this.array = 'rnbgqkabnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBGQKABNR';
    this.enPassant = true;
    this.pawnMultipleMove.value = 'Triple';
    this.promotionRule.value = 'Replacement';
    this.castling.value = 'Long';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.general = new Amazon('General', 'G', 1350, 1500)));
    this.addPieceType((this.adjutant = new Archbishop('Adjutant', 'A', 725, 800)));
  }
}
