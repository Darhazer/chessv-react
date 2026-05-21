/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/12x12/Odyssey.cs
 ***************************************************************************/

import { Direction, MirrorSymmetry, type PieceType } from '@chessv/engine';
import {
  Camel,
  CamelGeneral,
  Centaur,
  DragonHorse,
  DragonKing,
  General,
  GoldGeneral,
  SideMoverGeneral,
  SilverGeneral,
  SquirrelGeneral,
  VerticalMoverGeneral,
} from '@chessv/pieces';
import { AssassinTradeRestrictionRule, BasicPromotionRule } from '@chessv/rules';
import { Generic12x12 } from '../abstract/generic12x12.js';

/**
 * Odyssey — Greg Strong, 2016. A 12×12 super-variant packed with fairy
 * generals and dragons, plus an Assassin that can rifle-capture from
 * range. The Assassin can't voluntarily trade itself with another Assassin
 * unless the victim is unprotected — see AssassinTradeRestrictionRule.
 */
export class Odyssey extends Generic12x12 {
  dragonKing!: PieceType;
  dragonHorse!: PieceType;
  camel!: PieceType;
  goldGeneral!: PieceType;
  silverGeneral!: PieceType;
  knightGeneral!: PieceType;
  camelGeneral!: PieceType;
  fullGeneral!: PieceType;
  verticalMover!: PieceType;
  sideMover!: PieceType;
  assassin!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Odyssey';
    this.array =
      'dk10dk/rcdhb1kq1bdhcr/smvmnsggga_ngggsgnvmsm/pppppppppppp/12/12/12/12/PPPPPPPPPPPP/SMVMNSGGG_NGAGGSGNVMSM/RCDHB1QK1BDHCR/DK10DK';
    this.pawnMultipleMove.value = '@4(2)';
    this.enPassant = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addChessPieceTypes();
    this.addPieceType((this.dragonKing = new DragonKing('Dragon King', 'DK', 850, 950)));
    this.addPieceType((this.dragonHorse = new DragonHorse('Dragon Horse', 'DH', 750, 800)));
    this.addPieceType((this.camel = new Camel('Camel', 'C', 250, 250)));
    this.addPieceType((this.goldGeneral = new GoldGeneral('Gold General', 'GG', 250, 250)));
    this.addPieceType((this.silverGeneral = new SilverGeneral('Silver General', 'SG', 225, 225)));
    this.addPieceType((this.knightGeneral = new Centaur('Knight General', '_NG', 800, 800)));
    this.addPieceType((this.camelGeneral = new CamelGeneral('Camel General', '_CG', 775, 775)));
    this.addPieceType((this.fullGeneral = new General('Full General', 'FG', 350, 350)));
    this.addPieceType(
      (this.verticalMover = new VerticalMoverGeneral('Vertical Mover', 'VM', 600, 650)),
    );
    this.addPieceType((this.sideMover = new SideMoverGeneral('Side Mover', 'SM', 600, 600)));
    this.addPieceType(
      (this.assassin = new SquirrelGeneral('Assassin', 'A', 1400, 1400, 'Assassin')),
    );
    // The Assassin's rifle-capture upgrades: any one-step direction.
    for (const [df, dr] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      this.assassin.rifleCapture(new Direction(df, dr), 1);
    }
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new AssassinTradeRestrictionRule(this.assassin));
    // Promotions on or past rank 8 (in the player's frame): pawn / silver /
    // gold to Full General; knight to Knight General; camel to Camel
    // General; rook to Dragon King; bishop to Dragon Horse.
    this.addRule(new BasicPromotionRule(this.pawn, [this.fullGeneral], (loc) => loc.rank >= 8));
    this.addRule(
      new BasicPromotionRule(this.silverGeneral, [this.fullGeneral], (loc) => loc.rank >= 8),
    );
    this.addRule(
      new BasicPromotionRule(this.goldGeneral, [this.fullGeneral], (loc) => loc.rank >= 8),
    );
    this.addRule(
      new BasicPromotionRule(this.knight, [this.knightGeneral], (loc) => loc.rank >= 8),
    );
    this.addRule(new BasicPromotionRule(this.camel, [this.camelGeneral], (loc) => loc.rank >= 8));
    this.addRule(new BasicPromotionRule(this.rook, [this.dragonKing], (loc) => loc.rank >= 8));
    this.addRule(new BasicPromotionRule(this.bishop, [this.dragonHorse], (loc) => loc.rank >= 8));
  }
}
