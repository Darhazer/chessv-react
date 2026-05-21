/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x12/OmegaChess.cs
 *
 *  The C# original uses a custom file/rank labelling (the inner 10×10 is
 *  named a..j / 0..9, the outer border ring is unnamed). Our port keeps
 *  the standard a..l / 1..12 labelling so castling square names are
 *  shifted by one — the king starts on g2 here (vs. "f0" in C#).
 ***************************************************************************/

import { Bishop, Champion, Knight, Queen, Rook, Wizard } from '@chessv/pieces';
import {
  BasicPromotionRule,
  CastlingRule,
  OmegaChessBorderRule,
} from '@chessv/rules';
import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Generic12x12 } from '../abstract/generic12x12.js';

/**
 * Omega Chess — Daniel MacDonald, 1992. A 10×10 playable area with four
 * "wizard" corner squares jutting out — the 12×12 board with the rest of
 * the border ring inaccessible. Adds a Wizard (Ferz + Camel) on each
 * corner and a Champion (Wazir + Elephant + Dabbabah, our `Champion`
 * class) flanking the rooks. Pawns promote on the 11th rank (rank 10 in
 * 0-indexed coordinates).
 */
export class OmegaChess extends Generic12x12 {
  wizard!: PieceType;
  champion!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Omega Chess';
    this.array =
      'w10w/1crnbqkbnrc1/1pppppppppp1/12/12/12/12/12/12/1PPPPPPPPPP1/1CRNBQKBNRC1/W10W';
    this.promotionRule.addChoice('Omega', 'Pawns promote on the 11th rank (one short of the border)');
    this.promotionRule.value = 'Omega';
    this.promotionTypes = 'QRBNCW';
    this.castling.addChoice('Omega', 'Omega Chess custom castling');
    this.castling.value = 'Omega';
    this.pawnMultipleMove.value = '@3(2,3)';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    // Use 10×10-scale values rather than the Generic12x12 defaults — the
    // playable area is effectively 10×10.
    this.addPieceType((this.queen = new Queen('Queen', 'Q', 1000, 1100)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 600)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 350, 400)));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 275, 275)));
    this.addPieceType((this.wizard = new Wizard('Wizard', 'W', 360, 360)));
    this.addPieceType((this.champion = new Champion('Champion', 'C', 375, 375)));
  }

  protected override addRules(): void {
    super.addRules();
    // Stop the parent's castling wiring — the Castling choice was set to
    // "Omega" which the parent doesn't recognise, so it bails before
    // registering any moves. We add the bespoke castling moves below.
    this.removeRule(CastlingRule);

    this.addRule(new OmegaChessBorderRule());

    if (this.promotionRule.value === 'Omega') {
      this.addRule(
        new BasicPromotionRule(
          this.pawn,
          this.parseTypeListFromString(this.promotionTypes),
          (loc) => loc.rank === 10,
        ),
      );
    }

    if (this.castling.value === 'Omega') {
      this.addCastlingRule();
      // Standard notation: white king at g2 (= "f0" in C#'s shifted
      // notation), with castling targets two squares each way.
      this.castlingMove(0, 'g2', 'i2', 'j2', 'h2', 'K');
      this.castlingMove(0, 'g2', 'e2', 'c2', 'f2', 'Q');
      this.castlingMove(1, 'g11', 'i11', 'j11', 'h11', 'k');
      this.castlingMove(1, 'g11', 'e11', 'c11', 'f11', 'q');
    }
  }
}
