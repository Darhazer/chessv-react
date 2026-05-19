/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/8x8/ChessWithDifferentArmies.cs
 ***************************************************************************/

import { ChoiceVariable, MirrorSymmetry, type PieceType } from '@chessv/engine';
import {
  Archbishop,
  Bishop,
  Chancellor,
  ChargingKnight,
  ChargingRook,
  Cleric,
  Colonel,
  Knight,
  Lion,
  NarrowKnight,
  Phoenix,
  Queen,
  Rook,
  ShortRook,
  Tower,
  WarElephant,
} from '@chessv/pieces';
import { Generic8x8 } from '../abstract/generic8x8.js';

type Army = 'Fabulous FIDEs' | 'Colorbound Clobberers' | 'Remarkable Rookies' | 'Nutty Knights';

const ARMIES: Army[] = [
  'Fabulous FIDEs',
  'Colorbound Clobberers',
  'Remarkable Rookies',
  'Nutty Knights',
];

/**
 * Chess with Different Armies — each side may field one of four armies of
 * equal strength: the Fabulous FIDEs (standard pieces), Colorbound Clobberers,
 * Remarkable Rookies or Nutty Knights.
 */
export class ChessWithDifferentArmies extends Generic8x8 {
  whiteArmy!: ChoiceVariable;
  blackArmy!: ChoiceVariable;

  // Colorbound Clobberers
  archbishop!: PieceType;
  warElephant!: PieceType;
  phoenix!: PieceType;
  cleric!: PieceType;
  // Remarkable Rookies
  shortRook!: PieceType;
  tower!: PieceType;
  lion!: PieceType;
  chancellor!: PieceType;
  // Nutty Knights
  chargingRook!: PieceType;
  narrowKnight!: PieceType;
  chargingKnight!: PieceType;
  colonel!: PieceType;

  constructor() {
    super(new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = 'Chess with Different Armies';
    this.array = '#{BlackArray}/8/8/8/8/#{WhiteArray}';
    this.whiteArmy = new ChoiceVariable([...ARMIES]);
    this.whiteArmy.value = 'Fabulous FIDEs';
    this.blackArmy = new ChoiceVariable([...ARMIES]);
    this.blackArmy.value = 'Fabulous FIDEs';
    this.pawnDoubleMove = true;
    this.enPassant = true;
    // Promotion is added explicitly below (the type list depends on the
    // armies chosen), so the base "Standard" promotion rule is disabled.
    this.promotionRule.value = 'None';
    this.castling.removeChoice('Flexible');
    this.castling.addChoice(
      'CwDA',
      'Standard castling with the extra exception to prevent color-bound ' +
        'pieces from changing square colors',
    );
    this.castling.value = 'CwDA';
  }

  protected override setOtherVariables(): void {
    super.setOtherVariables();
    const white = this.whiteArmy.value as Army;
    const black = this.blackArmy.value as Army;

    this.setCustomProperty('BlackArray', `${this.backRank(black)}/pppppppp`);
    this.setCustomProperty('WhiteArray', `PPPPPPPP/${this.backRank(white).toUpperCase()}`);

    // Pawn promotion types: every type appearing in either army.
    let promotionTypes = '';
    if (white === 'Fabulous FIDEs') promotionTypes += 'QRBN';
    if (white === 'Colorbound Clobberers') promotionTypes += 'ACEX';
    if (white === 'Remarkable Rookies') promotionTypes += 'CSLT';
    if (white === 'Nutty Knights') promotionTypes += 'CRNL';
    if (black === 'Fabulous FIDEs' && white !== 'Fabulous FIDEs') promotionTypes += 'qrbn';
    if (black === 'Colorbound Clobberers' && white !== 'Colorbound Clobberers') {
      promotionTypes += 'acex';
    }
    if (black === 'Remarkable Rookies' && white !== 'Remarkable Rookies') promotionTypes += 'cslt';
    if (black === 'Nutty Knights' && white !== 'Nutty Knights') promotionTypes += 'crnl';
    this.promotionTypes = promotionTypes;
  }

  /** The lowercase back-rank notation for the given army. */
  private backRank(army: Army): string {
    switch (army) {
      case 'Fabulous FIDEs':
        return 'rnbqkbnr';
      case 'Colorbound Clobberers':
        return 'cxeakexc';
      case 'Remarkable Rookies':
        return 'stlcklts';
      case 'Nutty Knights':
        return 'rlncknlr';
    }
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    const white = this.whiteArmy.value as Army;
    const black = this.blackArmy.value as Army;
    // When the same army faces itself, a single-letter notation suffices;
    // otherwise the two sides need distinct notations (white plain, black `'`).
    const note = (army: Army, plain: string): string =>
      white === army && black === army ? plain : `${plain}/${plain.toLowerCase()}'`;
    const noteBlack = (plain: string): string => `${plain}'/${plain.toLowerCase()}`;

    // *** WHITE ARMY *** //
    if (white === 'Fabulous FIDEs') {
      this.addPieceType((this.queen = new Queen('Queen', note('Fabulous FIDEs', 'Q'), 950, 1000)));
      this.addPieceType((this.rook = new Rook('Rook', note('Fabulous FIDEs', 'R'), 500, 550)));
      this.addPieceType((this.bishop = new Bishop('Bishop', note('Fabulous FIDEs', 'B'), 325, 350)));
      this.addPieceType((this.knight = new Knight('Knight', note('Fabulous FIDEs', 'N'), 325, 325)));
    }
    if (white === 'Colorbound Clobberers') {
      this.addPieceType(
        (this.archbishop = new Archbishop('Archbishop', note('Colorbound Clobberers', 'A'), 875, 875)),
      );
      this.addPieceType(
        (this.warElephant = new WarElephant(
          'War Elephant',
          note('Colorbound Clobberers', 'E'),
          475,
          475,
        )),
      );
      this.addPieceType(
        (this.phoenix = new Phoenix('Phoenix', note('Colorbound Clobberers', 'X'), 315, 315)),
      );
      this.addPieceType(
        (this.cleric = new Cleric('Cleric', note('Colorbound Clobberers', 'C'), 450, 500)),
      );
    }
    if (white === 'Remarkable Rookies') {
      this.addPieceType(
        (this.chancellor = new Chancellor('Chancellor', note('Remarkable Rookies', 'C'), 950, 950)),
      );
      this.addPieceType(
        (this.shortRook = new ShortRook('Short Rook', note('Remarkable Rookies', 'S'), 400, 425)),
      );
      this.addPieceType((this.tower = new Tower('Tower', note('Remarkable Rookies', 'T'), 325, 325)));
      this.addPieceType((this.lion = new Lion('Lion', note('Remarkable Rookies', 'L'), 500, 500)));
    }
    if (white === 'Nutty Knights') {
      this.addPieceType(
        (this.chargingRook = new ChargingRook('Charging Rook', note('Nutty Knights', 'R'), 495, 530)),
      );
      this.addPieceType(
        (this.narrowKnight = new NarrowKnight('Lancer', note('Nutty Knights', 'L'), 325, 325)),
      );
      this.addPieceType(
        (this.chargingKnight = new ChargingKnight(
          'Charging Knight',
          note('Nutty Knights', 'N'),
          365,
          365,
        )),
      );
      this.addPieceType((this.colonel = new Colonel('Colonel', note('Nutty Knights', 'C'), 950, 950)));
    }

    // *** BLACK ARMY (only when it differs from White's) *** //
    if (black === 'Fabulous FIDEs' && white !== 'Fabulous FIDEs') {
      this.addPieceType((this.queen = new Queen('Queen', noteBlack('Q'), 950, 1050)));
      this.addPieceType((this.rook = new Rook('Rook', noteBlack('R'), 500, 550)));
      this.addPieceType((this.bishop = new Bishop('Bishop', noteBlack('B'), 325, 350)));
      this.addPieceType((this.knight = new Knight('Knight', noteBlack('N'), 325, 325)));
    }
    if (black === 'Colorbound Clobberers' && white !== 'Colorbound Clobberers') {
      this.addPieceType((this.archbishop = new Archbishop('Archbishop', noteBlack('A'), 875, 875)));
      this.addPieceType((this.warElephant = new WarElephant('War Elephant', noteBlack('E'), 475, 475)));
      this.addPieceType((this.phoenix = new Phoenix('Phoenix', noteBlack('X'), 315, 315)));
      this.addPieceType((this.cleric = new Cleric('Cleric', noteBlack('C'), 450, 500)));
    }
    if (black === 'Remarkable Rookies' && white !== 'Remarkable Rookies') {
      this.addPieceType((this.chancellor = new Chancellor('Chancellor', noteBlack('C'), 950, 1000)));
      this.addPieceType((this.shortRook = new ShortRook('Short Rook', noteBlack('S'), 400, 425)));
      this.addPieceType((this.tower = new Tower('Tower', noteBlack('T'), 325, 325)));
      this.addPieceType((this.lion = new Lion('Lion', noteBlack('L'), 500, 500)));
    }
    if (black === 'Nutty Knights' && white !== 'Nutty Knights') {
      this.addPieceType((this.chargingRook = new ChargingRook('Charging Rook', noteBlack('R'), 495, 530)));
      this.addPieceType((this.narrowKnight = new NarrowKnight('Lancer', noteBlack('L'), 325, 325)));
      this.addPieceType(
        (this.chargingKnight = new ChargingKnight('Charging Knight', noteBlack('N'), 365, 365)),
      );
      this.addPieceType((this.colonel = new Colonel('Colonel', noteBlack('C'), 950, 950)));
    }

    // The Rookies have no diagonal slider, so the Bishop is worth a little more.
    if (
      (white === 'Fabulous FIDEs' && black === 'Remarkable Rookies') ||
      (black === 'Fabulous FIDEs' && white === 'Remarkable Rookies')
    ) {
      this.bishop.midgameValue += 35;
      this.bishop.endgameValue += 35;
    }
  }

  protected override addRules(): void {
    super.addRules();

    // *** PAWN PROMOTION *** //
    const availablePromotionTypes: PieceType[] = [];
    const white = this.whiteArmy.value as Army;
    const black = this.blackArmy.value as Army;
    if (white === 'Fabulous FIDEs' || black === 'Fabulous FIDEs') {
      availablePromotionTypes.push(this.queen, this.rook, this.bishop, this.knight);
    }
    if (white === 'Colorbound Clobberers' || black === 'Colorbound Clobberers') {
      availablePromotionTypes.push(this.archbishop, this.warElephant, this.phoenix, this.cleric);
    }
    if (white === 'Remarkable Rookies' || black === 'Remarkable Rookies') {
      availablePromotionTypes.push(this.shortRook, this.tower, this.lion, this.chancellor);
    }
    if (white === 'Nutty Knights' || black === 'Nutty Knights') {
      availablePromotionTypes.push(
        this.chargingRook,
        this.narrowKnight,
        this.chargingKnight,
        this.colonel,
      );
    }
    this.addBasicPromotionRule(this.pawn, availablePromotionTypes, (loc) => loc.rank === 7);

    // *** CASTLING *** //
    if (this.castling.value === 'CwDA') {
      this.addCastlingRule();
      this.castlingMove(0, 'e1', 'g1', 'h1', 'f1', 'K');
      this.castlingMove(1, 'e8', 'g8', 'h8', 'f8', 'k');
      if (white === 'Colorbound Clobberers') {
        this.castlingMove(0, 'e1', 'b1', 'a1', 'c1', 'Q');
      } else {
        this.castlingMove(0, 'e1', 'c1', 'a1', 'd1', 'Q');
      }
      if (black === 'Colorbound Clobberers') {
        this.castlingMove(1, 'e8', 'b8', 'a8', 'c8', 'q');
      } else {
        this.castlingMove(1, 'e8', 'c8', 'a8', 'd8', 'q');
      }
    }
  }
}
