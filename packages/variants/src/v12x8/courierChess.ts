/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x8/CourierChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Elephant, King, Wazir } from '@chessv/pieces';
import { Generic12x8 } from '../abstract/generic12x8.js';

/**
 * Courier Chess — the medieval 12×8 game dating back to at least 1202 and
 * played for six hundred years. Pieces: standard chess plus the Mann (a
 * non-royal King), Schleich (Wazir) and Bischof (Elephant); the Bishop is
 * renamed to "Courier".
 */
export class CourierChess extends Generic12x8 {
  elephant!: PieceType;
  mann!: PieceType;
  schleich!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Courier Chess';
    this.array = 'rnbcmk1scbnr/1ppppp1pppp1/6q5/p5p4p/P5P4P/6Q5/1PPPPP1PPPP1/RNBCMK1SCBNR';
    // Medieval Courier: no promotion, no castling, no double-step pawn.
    this.promotionRule.value = 'None';
    this.castling.value = 'None';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    // Rename the Bishop to "Courier" and change its notation to 'C'.
    this.bishop.name = 'Courier';
    this.bishop.setNotation('C');

    this.addPieceType((this.elephant = new Elephant('Bischof', 'B', 100, 100)));
    this.addPieceType((this.mann = new King('Mann', 'M', 325, 325, 'General')));
    this.addPieceType((this.schleich = new Wazir('Schleich', 'S', 145, 145)));
  }
}
