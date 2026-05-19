/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/Makruk.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Ferz, Knight, Rook, SilverGeneral } from '@chessv/pieces';
import { Generic8x8 } from '../abstract/generic8x8.js';

/** Makruk — the traditional chess of Thailand. */
export class Makruk extends Generic8x8 {
  met!: PieceType;
  khon!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Makruk';
    this.array = 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR';
    this.promotionRule.value = 'Custom';
    this.promotionTypes = 'M';
    this.castling.value = 'None';
    this.pawnDoubleMove = false;
    this.enPassant = false;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.rook = new Rook('Rook', 'R', 500, 550)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 325, 325)));
    this.addPieceType((this.met = new Ferz('Met', 'M', 150, 150)));
    this.addPieceType((this.khon = new SilverGeneral('Khon', 'S', 260, 260)));
  }

  protected override addRules(): void {
    super.addRules();
    if (this.promotionRule.value === 'Custom') {
      const availablePromotionTypes = this.parseTypeListFromString(this.promotionTypes);
      this.addBasicPromotionRule(this.pawn, availablePromotionTypes, (loc) => loc.rank === 5);
    }
  }
}
