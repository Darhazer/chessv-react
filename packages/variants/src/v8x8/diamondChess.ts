/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/DiamondChess.cs
 ***************************************************************************/

import { type PieceType, RotationalSymmetry } from '@chessv/engine';
import { Bishop, DiamondPawn, Knight, Queen, Rook } from '@chessv/pieces';
import { GenericChess } from '../abstract/genericChess.js';

/**
 * Diamond Chess — chess with the board rotated 45° and a different opening
 * position; only the pawns move differently (toward the far corner).
 */
export class DiamondChess extends GenericChess {
  diamondPawn!: PieceType;

  constructor() {
    super(8, 8, new RotationalSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Diamond Chess';
    this.array = 'krbp4/rqnp4/nbpp4/pppp4/4PPPP/4PPBN/4PNQR/4PBRK';
    this.promotionTypes = 'QRBN';
    // Promotion is handled below with a custom condition (rank 7 or file a),
    // so the base "Standard" promotion rule is disabled to avoid duplication.
    this.promotionRule.value = 'None';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.rook = new Rook('Rook', 'R', 500, 550)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 325, 350)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 325, 325)));
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 900, 1000)));
    this.replacePieceType(
      this.pawn,
      (this.diamondPawn = new DiamondPawn('Pawn', 'P', 100, 125)),
    );
    this.pawn.enabled = false;
    this.promotingType = this.diamondPawn;
  }

  protected override addRules(): void {
    super.addRules();
    // *** PROMOTION *** //
    const availablePromotionTypes = this.parseTypeListFromString(this.promotionTypes);
    this.addBasicPromotionRule(
      this.diamondPawn,
      availablePromotionTypes,
      (loc) => loc.rank === 7 || loc.file === 0,
    );
  }
}
