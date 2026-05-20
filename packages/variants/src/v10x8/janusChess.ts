/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/JanusChess.cs
 ***************************************************************************/

import { CapablancaChess } from './capablancaChess.js';

/**
 * Janus Chess — Werner Schöndorf's 1978 10×8 variant. The Archbishop (here
 * called the Janus) is doubled and the Chancellor is dropped.
 */
export class JanusChess extends CapablancaChess {
  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Janus Chess';
    this.array = 'rjnbkqbnjr/pppppppppp/10/10/10/10/PPPPPPPPPP/RJNBKQBNJR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.promotionTypes = 'QJRBN';
    this.castling.value = 'Long';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    // The Chancellor is not used in this game.
    this.chancellor.enabled = false;
    // The Archbishop is called the Janus.
    this.archbishop.name = 'Janus';
    this.archbishop.setNotation('J');
  }
}
