/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x12/ChessAndAHalf.cs
 ***************************************************************************/

import {
  Direction,
  MirrorSymmetry,
  MoveCapability,
  type PieceType,
} from '@chessv/engine';
import {
  Centaur,
  General,
  JumpingGeneral,
  Nightrider,
} from '@chessv/pieces';
import {
  BasicPromotionRule,
  Move50Rule,
  OptionalCaptureByOvertakeRule,
} from '@chessv/rules';
import { Generic12x12 } from '../abstract/generic12x12.js';

/**
 * Chess and a Half — Nicolino Will, 2017. A 12×12 super-variant with
 * Guards (General), Cats (JumpingGeneral), Star Cats (augmented
 * JumpingGeneral), Speedy Knights (Nightrider), Eques Rex (Centaur), and
 * pawns that can step sideways once they cross half-way. Cats can capture
 * by overtake — any subset of enemy pieces sitting between them and their
 * destination on a straight line is also taken.
 */
export class ChessAndAHalf extends Generic12x12 {
  guard!: PieceType;
  cat!: PieceType;
  starCat!: PieceType;
  speedyKnight!: PieceType;
  equesRex!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chess and a Half';
    this.array =
      'rnbsccqkcscbnr/pppgppppgppp/12/12/12/12/12/12/12/12/PPPGPPPPGPPP/RNBSCCQKCSCBNR';
    this.pawnMultipleMove.value = '@2(2,3,4)';
    this.castling.value = 'Flexible';
    this.promotionTypes = 'QRBNCG';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.guard = new General('Guard', 'G', 300, 325)));
    this.addPieceType((this.cat = new JumpingGeneral('Cat', 'C', 600, 600, 'Cat')));
    this.addPieceType(
      (this.speedyKnight = new Nightrider('Speedy Knight', 'SN', 550, 550, 'Knightrider')),
    );
    this.addPieceType((this.equesRex = new Centaur('Eques Rex', 'E', 650, 750)));
    // Star Cat — a JumpingGeneral with extra 3-square step moves added.
    this.addPieceType((this.starCat = new JumpingGeneral('Star Cat', 'SC', 1100, 1100, 'Star Cat')));
    for (const [df, dr] of [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [3, -3], [-3, 3], [-3, -3]]) {
      this.starCat.step(new Direction(df!, dr!));
    }
  }

  protected override addRules(): void {
    super.addRules();

    // *** PROMOTION RULES *** //
    // Guard, Cat, Knight have promotion targets (not the usual Q/R/B/N
    // chess style — each piece promotes into a single specific upgrade).
    this.addRule(
      new BasicPromotionRule(
        this.guard,
        [this.equesRex],
        (loc) => loc.rank === 11,
        (loc) => loc.rank !== 11,
      ),
    );
    this.addRule(
      new BasicPromotionRule(
        this.cat,
        [this.starCat],
        (loc) => loc.rank === 11,
        (loc) => loc.rank !== 11,
      ),
    );
    this.addRule(
      new BasicPromotionRule(this.knight, [this.speedyKnight], (loc) => loc.rank === 11),
    );

    // Cat / Star Cat overtake captures.
    this.addRule(new OptionalCaptureByOvertakeRule([this.cat, this.starCat]));

    // *** PAWN ENHANCEMENT *** //
    // Pawns past rank 6 may step one square sideways (non-capturing).
    for (const fileOffset of [-1, 1]) {
      const move = new MoveCapability();
      move.minSteps = 1;
      move.maxSteps = 1;
      move.mustCapture = false;
      move.canCapture = false;
      move.direction = new Direction(0, fileOffset);
      move.condition = (loc) => loc.rank >= 6;
      this.pawn.addMoveCapability(move);
    }

    // *** RECONFIGURED 50-MOVE RULE *** //
    const rule = this.findRule(Move50Rule);
    if (rule !== null) {
      rule.halfMoveCounterThreshold = 160;
      rule.setRequiredDirection(new Direction(1, 0));
    }
  }
}
