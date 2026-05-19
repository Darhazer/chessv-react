/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/ShatranjKamil64.cs
 ***************************************************************************/

import { Direction, type PieceType } from '@chessv/engine';
import { SilverGeneral } from '@chessv/pieces';
import { Shatranj } from './shatranj.js';

/**
 * Shatranj Kamil (64) — a 2005 expansion of Shatranj that strengthens the
 * Elephant with a non-capturing Dabbabah move and adds a Silver General.
 */
export class ShatranjKamil64 extends Shatranj {
  silverGeneral!: PieceType;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Shatranj Kamil (64)';
    this.numberOfSquareColors = 2;
    this.array = 'rnseksnr/pp1ge1pp/2pppp2/8/8/2PPPP2/PP1GE1PP/RNSEKSNR';
    this.promotionTypes = 'S';
    this.stalemateResult.value = 'Loss';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    // Upgrade the Elephant with a non-capturing Dabbabah move.
    this.elephant.stepMoveOnly(new Direction(2, 0));
    this.elephant.stepMoveOnly(new Direction(-2, 0));
    this.elephant.stepMoveOnly(new Direction(0, 2));
    this.elephant.stepMoveOnly(new Direction(0, -2));
    this.elephant.midgameValue = 165;
    this.elephant.endgameValue = 165;
    // Add the Silver General.
    this.addPieceType((this.silverGeneral = new SilverGeneral('Silver General', 'S', 285, 285)));
    // Change the value of the Rook.
    this.rook.midgameValue = 500;
    this.rook.endgameValue = 550;
  }
}
