/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x8/ArchCourierChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Centaur, DragonHorse, DragonKing, General, Squirrel } from '@chessv/pieces';
import { Generic12x8 } from '../abstract/generic12x8.js';

/**
 * ArchCourier Chess — Eric V. Greenwood, 2006. A 12×8 variant whose back
 * rank is packed with fairy pieces (Crowned Rook, ArchCourier, Squirrel,
 * Duke, Guard) plus the standard set. Uses Replacement promotion.
 */
export class ArchCourierChess extends Generic12x8 {
  guard!: PieceType;
  centaur!: PieceType; // "Duke"
  squirrel!: PieceType;
  dragonKing!: PieceType; // "Crowned Rook"
  dragonHorse!: PieceType; // "ArchCourier"

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'ArchCourier Chess';
    this.array = 'rhabdqksbchr/ppppppgppppp/6p5/12/12/6P5/PPPPPPGPPPPP/RHABDQKSBCHR';
    this.promotionRule.value = 'Replacement';
    this.pawnDoubleMove = true;
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.knight.name = 'Horse';
    this.knight.setNotation('H');
    this.addPieceType((this.guard = new General('Guard', 'G', 325, 325)));
    this.addPieceType((this.centaur = new Centaur('Duke', 'D', 625, 625)));
    this.addPieceType((this.squirrel = new Squirrel('Squirrel', 'S', 575, 575)));
    this.addPieceType((this.dragonKing = new DragonKing('Crowned Rook', 'C', 700, 700)));
    this.addPieceType((this.dragonHorse = new DragonHorse('ArchCourier', 'A', 500, 550)));
  }
}
