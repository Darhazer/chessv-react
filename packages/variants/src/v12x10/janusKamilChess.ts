/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x10/JanusKamilChess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Archbishop, Camel } from '@chessv/pieces';
import { Generic12x10 } from '../abstract/generic12x10.js';

/**
 * Janus Kamil Chess — Jörg Knappen's 2004 12×10 variant adding the Janus
 * (Archbishop) and the Camel, with triple-step pawns and Close-Rook 3-4
 * castling.
 */
export class JanusKamilChess extends Generic12x10 {
  janus!: PieceType;
  camel!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Janus Kamil Chess';
    this.array = 'crjnbqkbnjrc/pppppppppppp/12/12/12/12/12/12/PPPPPPPPPPPP/CRJNBQKBNJRC';
    this.castling.value = 'Close-Rook 3-4';
    this.pawnMultipleMove.value = 'Triple';
    this.enPassant = true;
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'CRJNBQ';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.janus = new Archbishop('Janus', 'J', 900, 900)));
    this.addPieceType((this.camel = new Camel('Camel', 'C', 250, 250)));
  }
}
