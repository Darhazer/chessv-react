/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x8/KingsCourt.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Amazon, FreePadwar } from '@chessv/pieces';
import { KingsFlightRule } from '@chessv/rules';
import { Generic12x8 } from '../abstract/generic12x8.js';

/**
 * King's Court — Sidney LeVasseur, 1997. 12×8 with two Jesters
 * (FreePadwar) and two Chancellors (range-limited Amazon) per side, plus
 * the King's-flight rule that lets the king flee two squares when it
 * faces a Chancellor lined up with it.
 */
export class KingsCourt extends Generic12x8 {
  jester!: PieceType;
  chancellor!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = "King's Court";
    this.array = 'rjcnbqkbncjr/pppppppppppp/12/12/12/12/PPPPPPPPPPPP/RJCNBQKBNCJR';
    this.castling.value = 'Flexible';
    this.pawnDoubleMove = true;
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.jester = new FreePadwar('Jester', 'J', 400, 400, 'ElephantFerz2')));
    this.addPieceType((this.chancellor = new Amazon('Chancellor', 'C', 700, 700, 'Duke')));
    // The Chancellor in King's Court is a *range-limited* Amazon — any
    // sliding move is capped at two squares.
    const { moves, count } = this.chancellor.getMoveCapabilities();
    for (let i = 0; i < count; i++) {
      if (moves[i]!.maxSteps > 1) moves[i]!.maxSteps = 2;
    }
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new KingsFlightRule(this.king, this.chancellor));
  }
}
