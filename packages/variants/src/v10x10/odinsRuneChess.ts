/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/10x10/OdinsRuneChess.cs
 ***************************************************************************/

import {
  Game,
  MirrorSymmetry,
  MoveEventResponse,
  type PieceType,
} from '@chessv/engine';
import {
  Bishop,
  ForestOx,
  OdinKing,
  OdinPawn,
  Rook,
  Valkyrie,
} from '@chessv/pieces';
import { ExtinctionRule, NoMoveResultRule } from '@chessv/rules';

/**
 * Odin's Rune Chess — Gary K. Gifford, 2005. A 10×10 variant where each
 * side has two kings. The king has no moves of its own — it adopts the
 * move-sets of friendly pieces sitting on adjacent squares. Pawns are
 * Ferzes with a multi-path two-step forward jump; the Valkyrie can
 * displace a friendly piece along her slide; the Forest Ox can take
 * any enemy adjacent to its landing square.
 *
 * Extinction-based victory (capture both kings); a side with no legal
 * moves loses outright.
 */
export class OdinsRuneChess extends Game {
  rook!: PieceType;
  bishop!: PieceType;
  valkyrie!: PieceType;
  king!: PieceType;
  pawn!: PieceType;
  forestOx!: PieceType;

  constructor() {
    super(2, 10, 10, new MirrorSymmetry());
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.fenFormat = '{array} {current player} {half-move clock} {turn number}';
    this.fenStart = '#{Array} w 0 1';
    this.array = 'rfbvkkvbfr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RFBVKKVBFR';
  }

  protected override addPieceTypes(): void {
    this.addPieceType((this.king = new OdinKing('King', 'K', 500, 500, 'King')));
    this.addPieceType((this.pawn = new OdinPawn('Pawn', 'P', 200, 200)));
    this.addPieceType((this.rook = new Rook('Rook', 'R', 550, 650)));
    this.addPieceType((this.bishop = new Bishop('Bishop', 'B', 375, 425)));
    this.addPieceType((this.valkyrie = new Valkyrie('Valkyrie', 'V', 900, 950, 'Queen')));
    this.addPieceType((this.forestOx = new ForestOx('Forest Ox', 'F', 950, 950, 'Knight')));
  }

  protected override addRules(): void {
    super.addRules();
    this.addRule(new ExtinctionRule('K'));
    this.addRule(new NoMoveResultRule(MoveEventResponse.GameLost));
  }
}
