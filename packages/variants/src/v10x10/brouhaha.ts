/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/Brouhaha.cs
 ***************************************************************************/

import { Direction, MirrorSymmetry, MoveCapability, type PieceType } from '@chessv/engine';
import { Cleric, Scout } from '@chessv/pieces';
import { BrouhahaBorderRule } from '@chessv/rules';
import { Generic10x10 } from '../abstract/generic10x10.js';

/**
 * Brouhaha — Greg Strong, 2006. A 10×10 setup framing a standard 8×8
 * game with extra Cleric and Scout pieces stationed on the otherwise-
 * inaccessible border. As soon as a border piece moves off, the
 * BrouhahaBorderRule prevents anything else from moving onto its square
 * — so the game collapses to ordinary chess once the border is cleared.
 */
export class Brouhaha extends Generic10x10 {
  cleric!: PieceType;
  scout!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Brouhaha';
    this.array = 'c3ss3c/1rnbqkbnr1/1pppppppp1/10/10/10/10/1PPPPPPPP1/1RNBQKBNR1/C3SS3C';
    this.promotionTypes = 'QRCBNS';
    this.promotionRule.value = 'Standard';
    // Pawns start on rank 2 (0-indexed) and may push two squares from there.
    this.pawnMultipleMove.value = 'Grand';
    this.enPassant = true;
    // 2R Close-Rook matches Brouhaha's f2 king + b2/i2 rook setup.
    this.castling.value = '2R Close-Rook';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.scout = new Scout('Scout', 'S', 300, 300)));
    this.addPieceType((this.cleric = new Cleric('Cleric', 'C', 475, 500)));
    this.addClericFirstMoves(this.cleric);
    this.addScoutFirstMoves(this.scout);
  }

  /** Cleric's extra opening leaps from a or j on rank 0. */
  private addClericFirstMoves(cleric: PieceType): void {
    const directions = [
      new Direction(1, 3),
      new Direction(1, -3),
      new Direction(3, 1),
      new Direction(3, -1),
    ];
    for (const direction of directions) {
      const move = new MoveCapability();
      move.maxSteps = 1;
      move.direction = direction;
      move.condition = (loc) => loc.rank === 0 && (loc.file === 0 || loc.file === 9);
      cleric.addMoveCapability(move);
    }
  }

  /** Scout's extra opening leaps from e or f on rank 0. */
  private addScoutFirstMoves(scout: PieceType): void {
    const directions = [
      new Direction(1, 2),
      new Direction(1, -2),
      new Direction(2, 1),
      new Direction(2, -1),
    ];
    for (const direction of directions) {
      const move = new MoveCapability();
      move.maxSteps = 1;
      move.direction = direction;
      move.condition = (loc) => loc.rank === 0 && (loc.file === 4 || loc.file === 5);
      scout.addMoveCapability(move);
    }
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new BrouhahaBorderRule());
  }
}
