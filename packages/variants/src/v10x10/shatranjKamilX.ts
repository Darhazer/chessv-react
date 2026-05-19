/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/ShatranjKamilX.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import {
  Cannon,
  ChainedPadwar,
  Ferz,
  FreePadwar,
  Knight,
  Rook,
  SilverGeneral,
} from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/** Shatranj Kamil X — a 2007 10×10 expansion of the Shatranj Kamil family. */
export class ShatranjKamilX extends Generic10x10 {
  ferz!: PieceType;
  silverGeneral!: PieceType;
  cannon!: PieceType;
  elephant!: PieceType;
  warElephant!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Shatranj Kamil X';
    this.array = 'c3ke3c/1rnsefsnr1/pppppppppp/10/10/10/10/PPPPPPPPPP/1RNSEFSNR1/C3KE3C';
    this.promotionRule.value = 'Custom';
    this.stalemateResult.value = 'Loss';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 650)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 250, 250)));
    this.addPieceType((this.ferz = new Ferz('Ferz', 'F', 150, 150)));
    this.addPieceType((this.silverGeneral = new SilverGeneral('Silver General', 'S', 175, 175)));
    this.addPieceType((this.cannon = new Cannon('Cannon', 'C', 400, 275)));
    this.addPieceType((this.elephant = new ChainedPadwar('Elephant', 'E', 150, 200, 'Elephant')));
    this.addPieceType(
      (this.warElephant = new FreePadwar('War Elephant', 'W', 300, 350, 'ElephantFerz2')),
    );
  }

  protected override addRules(): void {
    super.addRules();
    // *** PAWN AND FERZ PROMOTION *** //
    if (this.promotionRule.value === 'Custom') {
      this.addBasicPromotionRule(this.pawn, [this.warElephant], (loc) => loc.rank === 9);
      this.addBasicPromotionRule(this.ferz, [this.warElephant], (loc) => loc.rank === 9);
    }
  }
}
