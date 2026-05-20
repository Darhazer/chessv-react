/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/CapablancaShatranj.cs
 ***************************************************************************/

import type { PieceType } from '@chessv/engine';
import { HighPriestess, Minister } from '@chessv/pieces';
import { CapablancaChess } from './capablancaChess.js';

/**
 * Capablanca Shatranj — Christine Bagley-Jones's 2006 10×8 variant. Replaces
 * the Archbishop and Chancellor with the leaping Minister and High Priestess.
 */
export class CapablancaShatranj extends CapablancaChess {
  minister!: PieceType;
  highPriestess!: PieceType;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Capablanca Shatranj';
    this.array = 'rnbmqkhbnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNBMQKHBNR';
    this.promotionTypes = 'MH';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.archbishop.enabled = false;
    this.chancellor.enabled = false;
    this.addPieceType(
      (this.minister = new Minister('Minister', 'M', 600, 600, 'Knight Wazir Dabbabah')),
    );
    this.addPieceType(
      (this.highPriestess = new HighPriestess('High Priestess', 'H', 625, 625, 'ElephantKnight')),
    );
  }
}
