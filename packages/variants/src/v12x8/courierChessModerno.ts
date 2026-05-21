/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x8/CourierChessModerno.cs
 ***************************************************************************/

import {
  Direction,
  MoveCapability,
  RotationalSymmetry,
  type PieceType,
} from '@chessv/engine';
import { Dabbabah, Elephant, King, SilverGeneral, Wazir } from '@chessv/pieces';
import { ExtraMovesForUnmovedPieceRule } from '@chessv/rules';
import { Generic12x8 } from '../abstract/generic12x8.js';

/**
 * Courier Chess Moderno — Jose Carrillo, 2008. A modernised 12×8 version
 * of the historic Courier game. Adds the Mann (King moves but not royal),
 * Schleich (Wazir) and Elephant (SilverGeneral, with extra 2-square leaps
 * from its starting square). Uses bare-king victory and 3-3 castling.
 */
export class CourierChessModerno extends Generic12x8 {
  mann!: PieceType;
  schleich!: PieceType;
  elephant!: PieceType;

  constructor() {
    super(new RotationalSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Courier Chess Moderno';
    this.fenFormat =
      '{array} {current player} {castling} {elephants} {en-passant} {half-move clock} {turn number}';
    this.fenStart = '#{Array} w #default #default #default 0 1';
    this.array = 'rnebsqkmbenr/pppppppppppp/12/12/12/12/PPPPPPPPPPPP/RNEBMKQSBENR';
    this.promotionTypes = 'QRBNMSE';
    this.castling.value = '3-3';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.bareKing = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    // The Mann is a non-royal King — same move set, but CheckmateRule
    // tracks only `this.king`, so the Mann can be freely captured.
    this.addPieceType((this.mann = new King('Mann', 'M', 325, 325, 'General')));
    this.addPieceType((this.schleich = new Wazir('Schleich', 'S', 145, 145)));
    this.addPieceType((this.elephant = new SilverGeneral('Elephant', 'E', 200, 200)));
    // The ExtraMovesForUnmovedPieceRule below uses (2,0)/(2,±2) leaps that
    // aren't in the Elephant's normal move set. Register dummy Dabbabah /
    // Elephant types so their directions exist in the game's direction
    // table when the rule resolves direction numbers.
    this.addPieceType(new Dabbabah('', '', 0, 0));
    this.addPieceType(new Elephant('', '', 0, 0));
  }

  protected override addRules(): void {
    super.addRules();
    const rule = new ExtraMovesForUnmovedPieceRule(this.elephant, 'elephants');
    rule.addMove(MoveCapability.step(new Direction(2, 0)));
    rule.addMove(MoveCapability.step(new Direction(2, 2)));
    rule.addMove(MoveCapability.step(new Direction(2, -2)));
    this.addRule(rule);
  }
}
