/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/DuplexChess.cs
 ***************************************************************************/

import { MirrorSymmetry, Piece, type PieceType } from '@chessv/engine';
import {
  ElephantFerz,
  GoldGeneral,
  JumpingGeneral,
  Knight,
  SilverGeneral,
  Tower,
} from '@chessv/pieces';
import {
  CheckmateRule,
  ComplexPromotionRule,
  DuplexChessMoveCompletionRule,
  ExtinctionRule,
  LocationVictoryConditionRule,
  PromotionOption,
} from '@chessv/rules';
import { Generic8x8 } from '../abstract/generic8x8.js';

/**
 * Duplex Chess — Greg Strong, 2018. A modest 8×8 double-move variant with
 * only short-range pieces (Tower, Knight, Elephant, Generals). Three
 * victory conditions: capture the king, capture the last pawn, or move a
 * king to the back rank. Each side has an opening Silver General and Gold
 * General drop before the cyclic double-move sequence begins.
 */
export class DuplexChess extends Generic8x8 {
  tower!: PieceType;
  elephant!: PieceType;
  goldGeneral!: PieceType;
  silverGeneral!: PieceType;
  jumpingGeneral!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Duplex Chess';
    this.fenStart = '#{Array} ws #default #default 0 1';
    this.array = 'tnejkent/pppppppp/8/8/8/8/PPPPPPPP/TNEJKENT';
    this.promotionRule.value = 'Custom';
    this.promotionTypes = 'S';
    this.pawnDoubleMove = false;
    this.enPassant = false;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.tower = new Tower('Tower', 'T', 325, 325)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 325, 325)));
    this.addPieceType((this.elephant = new ElephantFerz('Elephant', 'E', 275, 275)));
    this.addPieceType((this.goldGeneral = new GoldGeneral('Gold General', 'G', 225, 225)));
    this.addPieceType((this.silverGeneral = new SilverGeneral('Silver General', 'S', 200, 200)));
    this.addPieceType(
      (this.jumpingGeneral = new JumpingGeneral('Jumping General', 'J', 700, 700)),
    );
  }

  protected override addRules(): void {
    super.addRules();

    // *** VICTORY CONDITIONS *** //
    this.removeRule(CheckmateRule);
    // King OR last pawn capture loses — handled by ExtinctionRule.
    this.addRule(new ExtinctionRule('KP'));
    this.addRule(new LocationVictoryConditionRule(this.king, (loc) => loc.rank === 7));

    // Four prepared generals dropped in the setup phase.
    const generals: Piece[] = [
      new Piece(this, 0, this.silverGeneral, -1),
      new Piece(this, 1, this.silverGeneral, -1),
      new Piece(this, 1, this.goldGeneral, -1),
      new Piece(this, 0, this.goldGeneral, -1),
    ];
    for (const piece of generals) this.addPiece(piece);

    // The custom move-completion rule replaces the default one.
    this.addRule(new DuplexChessMoveCompletionRule(this.king, this.pawn, generals));

    // *** PROMOTION RULES *** //
    if (this.promotionRule.value === 'Custom') {
      const promotionTypes = this.parseTypeListFromString(this.promotionTypes);
      this.addBasicPromotionRule(this.pawn, promotionTypes, (loc) => loc.rank === 5);
    }
    // Silver General has an optional Gold-General promotion when at or
    // moving to the back rank.
    const silverPromote = new ComplexPromotionRule();
    silverPromote.addPromotionCapabilityFromTo(
      this.silverGeneral,
      [this.goldGeneral],
      null,
      (fromLoc, toLoc) =>
        fromLoc.rank === 7 || toLoc.rank === 7
          ? PromotionOption.CanPromote
          : PromotionOption.CannotPromote,
    );
    this.addRule(silverPromote);
  }
}
