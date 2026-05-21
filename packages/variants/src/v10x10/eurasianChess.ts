/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2020 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/EurasianChess.cs
 ***************************************************************************/

import { type Location, type PieceType } from '@chessv/engine';
import { Cannon, Vao } from '@chessv/pieces';
import { KingFacingRule, PieceLocationRestrictionRule } from '@chessv/rules';
import { GrandChess } from './grandChess.js';

/**
 * Eurasian Chess — Fergus Duniho, 2003. A 10×10 hybrid blending European
 * and Asian forms: the Grand Chess board and promotion zone, plus the
 * Cannon and Vao from Chinese Chess. The kings get xiangqi-style
 * restrictions — they can't cross the river (rank ≥ 5 in their own
 * frame is forbidden) and can't face each other on an open file or
 * diagonal.
 */
export class EurasianChess extends GrandChess {
  cannon!: PieceType;
  vao!: PieceType;

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Eurasian Chess';
    this.array = 'r1c4c1r/1nbvqkvbn1/pppppppppp/10/10/10/10/PPPPPPPPPP/1NBVQKVBN1/R1C4C1R';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.marshall.enabled = false;
    this.cardinal.enabled = false;
    this.addPieceType((this.cannon = new Cannon('Cannon', 'C', 400, 275)));
    this.addPieceType((this.vao = new Vao('Vao', 'V', 300, 175)));
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new KingFacingRule(this.king));
    // The king's destination, in his own frame of reference, must satisfy
    // rank < 5 (his back half). Crossing into the opponent's territory is
    // illegal — the "river" rule.
    this.addRule(
      new PieceLocationRestrictionRule(this.king, (loc: Location) => loc.rank >= 5),
    );
  }
}
