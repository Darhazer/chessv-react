/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/GrandShatranj.cs
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import {
  HighPriestess,
  JumpingGeneral,
  Knight,
  LightningWarmachine,
  Minister,
  Oliphant,
  Rook,
} from '@chessv/pieces';
import { Generic10x10 } from '../abstract/generic10x10.js';

type GrandShatranjVariant = 'Grand Shatranj D' | 'Grand Shatranj R' | 'Gilded Grand Shatranj';

/**
 * Grand Shatranj — Joe Joyce's 2006 10×10 variant featuring strong leaping
 * pieces. Three setups exist: the "D" form (with the Lightning Warmachine),
 * the "R" form (with Rooks) and the "Gilded" form (which has both).
 */
export class GrandShatranj extends Generic10x10 {
  oliphant!: PieceType;
  lightningWarmachine!: PieceType;
  jumpingGeneral!: PieceType;
  minister!: PieceType;
  highPriestess!: PieceType;

  protected variant: GrandShatranjVariant;

  constructor(variant: GrandShatranjVariant = 'Grand Shatranj D') {
    super(new MirrorSymmetry());
    this.variant = variant;
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = this.variant;
    this.array = '#{BlackArray}/10/10/10/10/#{WhiteArray}';
  }

  protected override setOtherVariables(): void {
    super.setOtherVariables();
    if (this.variant === 'Grand Shatranj D') {
      this.setCustomProperty('BlackArray', 'l8l/1nojkmhon1/pppppppppp');
      this.setCustomProperty('WhiteArray', 'PPPPPPPPPP/1NOJKMHON1/L8L');
    } else if (this.variant === 'Grand Shatranj R') {
      this.setCustomProperty('BlackArray', 'r8r/1nojkmhon1/pppppppppp');
      this.setCustomProperty('WhiteArray', 'PPPPPPPPPP/1NOJKMHON1/R8R');
    } else {
      this.setCustomProperty('BlackArray', 'l2o2o2l/1rnhjkmnr1/pppppppppp');
      this.setCustomProperty('WhiteArray', 'PPPPPPPPPP/1RNHJKMNR1/L2O2O2L');
    }
  }

  protected override addPieceTypes(): void {
    this.addPieceType((this.knight = new Knight('Knight', 'N', 300, 300)));
    this.addPieceType((this.oliphant = new Oliphant('Oliphant', 'O', 500, 500)));
    this.addPieceType((this.jumpingGeneral = new JumpingGeneral('Jumping General', 'J', 600, 600)));
    this.addPieceType(
      (this.minister = new Minister('Minister', 'M', 575, 575, 'KnightWazirDabbabah')),
    );
    this.addPieceType(
      (this.highPriestess = new HighPriestess('High Priestess', 'H', 575, 575, 'ElephantKnight')),
    );
    if (this.variant === 'Grand Shatranj D' || this.variant === 'Gilded Grand Shatranj') {
      this.addPieceType(
        (this.lightningWarmachine = new LightningWarmachine('Lightning Warmachine', 'L', 600, 600)),
      );
    }
    if (this.variant === 'Grand Shatranj R' || this.variant === 'Gilded Grand Shatranj') {
      this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 650)));
    }
    super.addPieceTypes();
  }
}

/** Gilded Grand Shatranj — the Grand Shatranj setup featuring all the pieces. */
export class GildedGrandShatranj extends GrandShatranj {
  constructor() {
    super('Gilded Grand Shatranj');
  }
}
