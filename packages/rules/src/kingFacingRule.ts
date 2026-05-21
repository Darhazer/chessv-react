/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Xiangqi/KingFacingRule.cs
 ***************************************************************************/

import {
  type Game,
  MoveEventResponse,
  type MoveInfo,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Xiangqi's "flying general" prohibition, also used in Eurasian Chess:
 * the two kings may not face each other across an *open* rank, file or
 * diagonal — at least one intervening piece is required. Checked after
 * the move is made: if the resulting position has the two kings staring
 * at each other unobstructed, the move is illegal.
 */
export class KingFacingRule extends Rule {
  private kingTypeNumber = -1;
  private readonly kingType: PieceType;

  constructor(kingType: PieceType) {
    super();
    this.kingType = kingType;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.kingTypeNumber = game.getPieceTypeNumber(this.kingType);
  }

  override moveBeingMade(_move: MoveInfo, _ply: number): MoveEventResponse {
    const board = this.board!;
    const k0 = board.getPieceTypeBitboard(0, this.kingTypeNumber).lsb;
    const k1 = board.getPieceTypeBitboard(1, this.kingTypeNumber).lsb;
    if (k0 === -1 || k1 === -1) {
      throw new Error('KingFacingRule: a king is missing — rule implementation bug');
    }
    const loc0 = board.squareToLocation(k0);
    const loc1 = board.squareToLocation(k1);

    // Same file: scan the column between them for any blocker.
    if (loc0.file === loc1.file) {
      const rMin = Math.min(loc0.rank, loc1.rank) + 1;
      const rMax = Math.max(loc0.rank, loc1.rank);
      for (let rank = rMin; rank < rMax; rank++) {
        if (board.pieceAt(board.rankFileToSquare(rank, loc0.file)) != null) {
          return MoveEventResponse.NotHandled;
        }
      }
      return MoveEventResponse.IllegalMove;
    }
    // Same rank.
    if (loc0.rank === loc1.rank) {
      const fMin = Math.min(loc0.file, loc1.file) + 1;
      const fMax = Math.max(loc0.file, loc1.file);
      for (let file = fMin; file < fMax; file++) {
        if (board.pieceAt(board.rankFileToSquare(loc0.rank, file)) != null) {
          return MoveEventResponse.NotHandled;
        }
      }
      return MoveEventResponse.IllegalMove;
    }
    // Same diagonal.
    if (Math.abs(loc0.rank - loc1.rank) === Math.abs(loc0.file - loc1.file)) {
      const startRank = Math.min(loc0.rank, loc1.rank);
      const startFile = loc0.rank < loc1.rank ? loc0.file : loc1.file;
      const endRank = Math.max(loc0.rank, loc1.rank);
      const fileStep = loc0.file < loc1.file ? 1 : -1;
      let r = startRank + 1;
      let f = startFile + fileStep;
      while (r < endRank) {
        if (board.pieceAt(board.rankFileToSquare(r, f)) != null) {
          return MoveEventResponse.NotHandled;
        }
        r++;
        f += fileStep;
      }
      return MoveEventResponse.IllegalMove;
    }
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (this.game !== null && this.game.getPieceTypeNumber(type) === this.kingTypeNumber) {
      notes.push('cannot face unblocked opposition');
    }
  }
}
