/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/9x8/SymmetricChess.cs
 ***************************************************************************/

import { MirrorSymmetry } from '@chessv/engine';
import { BishopConversionRule } from '@chessv/rules';
import { Generic9x8 } from '../abstract/generic9x8.js';

/**
 * Symmetric Chess — Carlos Cetina, 2014. A 9×8 variant where the king
 * is flanked by two queens. Because the two bishops naturally land on
 * the same colour, the BishopConversionRule lets each bishop take one
 * orthogonal step on its first move so the pair end up on opposite
 * colours.
 */
export class SymmetricChess extends Generic9x8 {
  useBishopConversionRule = true;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Symmetric Chess';
    this.fenFormat =
      '{array} {current player} {castling} {en-passant} {bishop-conversion} {half-move clock} {turn number}';
    this.fenStart = '#{Array} w #default #default #default 0 1';
    this.array = 'rnbqkqbnr/ppppppppp/9/9/9/9/PPPPPPPPP/RNBQKQBNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Long';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
  }

  protected override addRules(): void {
    super.addRules();
    if (this.useBishopConversionRule) {
      this.addRule(new BishopConversionRule(['c1', 'g1', 'c8', 'g8']));
    }
  }
}
