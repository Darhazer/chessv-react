/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x12/ChessOnA12x12Board.cs
 ***************************************************************************/

import { type Location, MirrorSymmetry } from '@chessv/engine';
import { Generic12x12 } from '../abstract/generic12x12.js';

/**
 * Chess on a 12 by 12 Board — Doug Vogel's 2000 variant: standard chess
 * pieces on a 12×12 board with the back rank on rank 3, custom castling on
 * the c/j files, and pawns promoting on the 10th rank.
 */
export class ChessOnA12x12Board extends Generic12x12 {
  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chess on a 12 by 12 Board';
    this.array = '12/12/2rnbqkbnr2/2pppppppp2/12/12/12/12/2PPPPPPPP2/2RNBQKBNR2/12/12';
    this.castling.addChoice(
      'ChessOnA12x12Board',
      'Kings on g3 and g10 slide two squares in either direction to castle with the pieces on the c and j files',
    );
    this.castling.value = 'ChessOnA12x12Board';
    this.promotionRule.addChoice(
      'ChessOnA12x12Board',
      'Standard promotion except that promote on the 10th rank',
    );
    this.promotionRule.value = 'Custom';
    this.promotionTypes = 'QRBN';
    this.pawnMultipleMove.value = '@4(2)';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
  }

  protected override addRules(): void {
    super.addRules();

    // Custom pawn-promotion rule — pawns promote on the 10th rank (index 9).
    if (this.promotionRule.value === 'ChessOnA12x12Board' || this.promotionRule.value === 'Custom') {
      const promotionTypes = this.parseTypeListFromString(this.promotionTypes);
      this.addBasicPromotionRule(this.pawn, promotionTypes, (loc: Location) => loc.rank === 9);
    }

    // Custom castling rule — Kings on g3/g10 castle with pieces on c/j files.
    if (this.castling.value === 'ChessOnA12x12Board') {
      this.addCastlingRule();
      this.castlingMove(0, 'g3', 'i3', 'j3', 'h3', 'K');
      this.castlingMove(0, 'g3', 'e3', 'c3', 'f3', 'Q');
      this.castlingMove(1, 'g10', 'i10', 'j10', 'h10', 'k');
      this.castlingMove(1, 'g10', 'e10', 'c10', 'f10', 'q');
    }
  }
}
