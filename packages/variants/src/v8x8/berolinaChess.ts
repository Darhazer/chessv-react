/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/BerolinaChess.cs
 ***************************************************************************/

import { Direction, MirrorSymmetry, MoveCapability, type PieceType } from '@chessv/engine';
import { BerolinaPawn } from '@chessv/pieces';
import { BerolinaEnPassantRule } from '@chessv/rules';
import { Generic8x8 } from '../abstract/generic8x8.js';

/**
 * Berolina Chess — standard chess, but the pawn moves are switched: the pawn
 * moves (without capturing) diagonally forward and captures straight forward.
 */
export class BerolinaChess extends Generic8x8 {
  berolinaPawn!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Berolina Chess';
    this.array = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    this.castling.value = 'Standard';
    this.promotionRule.value = 'Standard';
    this.promotionTypes = 'QRNB';
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.replacePieceType(
      this.pawn,
      (this.berolinaPawn = new BerolinaPawn('Pawn', 'P', 100, 125)),
    );
    // The base classes add standard pawn rules for `this.pawn`; disabling the
    // now-replaced standard pawn keeps them from doing so (this variant adds
    // its own diagonal double-move and Berolina en-passant rule below).
    this.pawn.enabled = false;
    this.promotingType = this.berolinaPawn;
  }

  protected override addRules(): void {
    super.addRules();

    // *** PAWN DOUBLE MOVE *** //
    // The Berolina pawn moves diagonally, so the double move is also diagonal.
    if (this.pawnDoubleMove && this.berolinaPawn.enabled) {
      for (const fileOffset of [1, -1]) {
        const doubleMove = new MoveCapability();
        doubleMove.minSteps = 2;
        doubleMove.maxSteps = 2;
        doubleMove.mustCapture = false;
        doubleMove.canCapture = false;
        doubleMove.direction = new Direction(1, fileOffset);
        doubleMove.condition = (location) => location.rank === 1;
        this.berolinaPawn.addMoveCapability(doubleMove);
      }
    }

    // *** EN PASSANT *** //
    if (this.enPassant && this.berolinaPawn.enabled) {
      this.addRule(new BerolinaEnPassantRule(this.berolinaPawn));
    }
  }
}
