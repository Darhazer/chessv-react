/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x8/GreatShatranj.cs
 *
 *  Phase note: the C# `AddEvaluations` (outpost) is evaluation only and is
 *  deferred.
 ***************************************************************************/

import { MirrorSymmetry, type PieceType } from '@chessv/engine';
import { Elephant, Ferz, HighPriestess, King, Knight, Minister, Rook, Tower } from '@chessv/pieces';
import { Generic10x8 } from '../abstract/generic10x8.js';

type GreatShatranjVariant = 'Great Shatranj D' | 'Great Shatranj R';

/**
 * Great Shatranj — Joe Joyce's 2006 10×8 variant of strong leaping pieces.
 * Two setups exist: the "D" form (with the Dabbabah-mover) and the "R" form
 * (with Rooks).
 */
export class GreatShatranj extends Generic10x8 {
  general!: PieceType;
  minister!: PieceType;
  highPriestess!: PieceType;
  elephant!: PieceType;
  tower!: PieceType;

  protected variant: GreatShatranjVariant;

  constructor(variant: GreatShatranjVariant = 'Great Shatranj D') {
    super(new MirrorSymmetry());
    this.variant = variant;
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.name = this.variant;
    if (this.variant === 'Great Shatranj D') {
      this.array = 'dnegkmhend/pppppppppp/10/10/10/10/PPPPPPPPPP/DNEGKMHEND';
    } else {
      this.array = 'rnegkmhenr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNEGKMHENR';
    }
    this.promotionTypes = 'G';
    this.bareKing = true;
  }

  protected override addPieceTypes(): void {
    super.addPieceTypes();
    this.addPieceType((this.general = new King('General', 'G', 300, 300, 'Guard')));
    this.addPieceType((this.knight = new Knight('Knight', 'N', 285, 285)));
    this.addPieceType(
      (this.minister = new Minister('Minister', 'M', 600, 600, 'KnightWazirDabbabah')),
    );
    this.addPieceType(
      (this.highPriestess = new HighPriestess('High Priestess', 'H', 625, 625, 'ElephantKnight')),
    );
    this.addPieceType((this.elephant = new Elephant('Elephant', 'E', 250, 250)));
    Ferz.addMoves(this.elephant);
    if (this.variant === 'Great Shatranj D') {
      this.addPieceType((this.tower = new Tower('Dabbabah', 'D', 270, 270)));
    } else {
      this.addPieceType((this.rook = new Rook('Rook', 'R', 600, 600)));
    }
  }
}

/** Great Shatranj R — the Great Shatranj setup with Rooks in the corners. */
export class GreatShatranjR extends GreatShatranj {
  constructor() {
    super('Great Shatranj R');
  }
}
