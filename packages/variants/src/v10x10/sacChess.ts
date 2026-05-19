/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2020 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/SacChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Amazon, Archbishop, Centaur, Chancellor, DragonHorse, DragonKing } from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

/** Sac Chess — Kevin Pacey's piece-dense 10×10 variant. */
export class SacChess extends Generic10x10 {
  amazon!: PieceType;
  chancellor!: PieceType;
  archbishop!: PieceType;
  sailor!: PieceType;
  missionary!: PieceType;
  judge!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Sac Chess';
    this.array = 'caszmmzsac/jrnbqkbnrj/pppppppppp/10/10/10/10/PPPPPPPPPP/JRNBQKBNRJ/CASZMMZSAC';
    this.pawnMultipleMove.value = 'Grand';
    this.enPassant = true;
    this.castling.value = '2R Close-Rook';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'ZQCASMJRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.amazon = new Amazon('Amazon', 'Z', 1400, 1500)));
    this.addPieceType((this.chancellor = new Chancellor('Chancellor', 'C', 925, 1000)));
    this.addPieceType((this.archbishop = new Archbishop('Archbishop', 'A', 750, 800)));
    this.addPieceType((this.sailor = new DragonKing('Sailor', 'S', 700, 700)));
    this.addPieceType((this.missionary = new DragonHorse('Missionary', 'M', 500, 500)));
    this.addPieceType((this.judge = new Centaur('Judge', 'J', 600, 600)));
  }
}
