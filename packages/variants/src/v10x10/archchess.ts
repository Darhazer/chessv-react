/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/Archchess.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Ferz, Squirrel } from '@chessv/pieces';
import { KingsLeapRule } from '@chessv/rules';
import { Generic10x10 } from '../abstract/generic10x10.js';

/**
 * Archchess — Francesco Piacenza, 1683. Standard 10×10 chess plus a
 * Decurion (Ferz) and Centurion (Squirrel), with the historic "king's
 * leap" privilege — once per game, each king may jump two squares
 * orthogonally from its starting square.
 */
export class Archchess extends Generic10x10 {
  decurion!: PieceType;
  centurion!: PieceType;
  kingsLeap = true;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Archchess';
    this.fenFormat =
      '{array} {current player} {castling} {kings-leap} {en-passant} {half-move clock} {turn number}';
    this.fenStart = '#{Array} w #default #default - 0 1';
    this.array = 'rnbckqdbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCKQDBNR';
    this.enPassant = true;
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'Q';
    this.pawnMultipleMove.value = 'Double';
    this.castling.value = 'Standard';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.decurion = new Ferz('Decurion', 'D', 140, 140)));
    this.addPieceType((this.centurion = new Squirrel('Centurion', 'C', 550, 550, 'Guard')));
  }

  protected override addRules(): void {
    super.addRules();
    if (this.kingsLeap) {
      // Array places the kings on e1 (file 4, rank 0) and e10 (file 4, rank 9)
      // → square = file * numRanks + rank = 40 and 49 in 10x10.
      this.addRule(new KingsLeapRule(40, 49));
    }
  }
}
