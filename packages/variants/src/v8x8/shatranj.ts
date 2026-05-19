/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/Shatranj.cs and ModernShatranj.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Elephant, Ferz, Knight, Rook, Wazir } from '@chessv/pieces';
import { Generic8x8 } from '../abstract/generic8x8.js';

/** Shatranj — the medieval Persian ancestor of chess. */
export class Shatranj extends Generic8x8 {
  elephant!: PieceType;
  general!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Shatranj';
    this.numberOfSquareColors = 1;
    this.array = 'rnekgenr/pppppppp/8/8/8/8/PPPPPPPP/RNEKGENR';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'G';
    this.bareKing = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.rook = new Rook('Rook', 'R', 600, 600)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 425, 425)));
    this.addPieceType((this.elephant = new Elephant('Elephant', 'E', 125, 125)));
    this.addPieceType((this.general = new Ferz('General', 'G', 175, 175)));
  }
}

/** Modern Shatranj — a 2005 modernization giving the Elephant and General extra moves. */
export class ModernShatranj extends Shatranj {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Modern Shatranj';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    // The Elephant also moves as a Ferz; the General also moves as a Wazir.
    Ferz.addMoves(this.elephant);
    this.elephant.midgameValue = 400;
    this.elephant.endgameValue = 400;
    Wazir.addMoves(this.general);
    this.general.midgameValue = 400;
    this.general.endgameValue = 400;
  }
}
