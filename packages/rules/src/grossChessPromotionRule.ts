/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2017 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Gross/GrossChessPromotionRule.cs
 ***************************************************************************/

import {
  type Game,
  MoveEventResponse,
  type MoveInfo,
  MoveType,
  type PieceType,
  Piece,
} from '@chessv/engine';
import {
  type OptionalPromotionLocationDelegate,
  PromoteByReplacementRule,
} from './promoteByReplacementRule.js';

/**
 * Piece references the rule needs. `queen`/`rook`/`bishop`/`knight` are
 * the reserve types stocked into each player's captured-pieces pool;
 * the rest are the type checks the per-rank promotion restriction uses.
 */
interface GrossChessPromotionPieces {
  queen: PieceType;
  rook: PieceType;
  bishop: PieceType;
  knight: PieceType;
  wizard: PieceType;
  vao: PieceType;
  archbishop: PieceType;
  chancellor: PieceType;
}

/**
 * Gross Chess's promote-by-replacement rule. Seeds each side's captured-
 * piece reserves with 2 Queens, 4 Rooks, 4 Bishops and 4 Knights so the
 * Replacement promotion always has stronger pieces available. Then
 * restricts the promotion choice by zone:
 *
 * - Rank 9 (third-last) — only Bishop / Knight / Vao / Wizard.
 * - Rank 10 (second-last) — anything except Queen / Archbishop / Marshall.
 * - Rank 11 (back rank) — free choice.
 */
export class GrossChessPromotionRule extends PromoteByReplacementRule {
  private readonly piecesAccess: () => GrossChessPromotionPieces;

  constructor(
    promotingType: PieceType,
    condition: OptionalPromotionLocationDelegate,
    piecesAccess: () => GrossChessPromotionPieces,
  ) {
    super(promotingType, condition);
    this.piecesAccess = piecesAccess;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    const p = this.piecesAccess();
    // Each player starts the game with extra captured-piece reserves so
    // the replacement-promotion choice is always populated.
    for (let player = 0; player < 2; player++) {
      game.addPiece(new Piece(game, player, p.queen, -1));
      game.addPiece(new Piece(game, player, p.queen, -1));
      for (let i = 0; i < 4; i++) {
        game.addPiece(new Piece(game, player, p.rook, -1));
        game.addPiece(new Piece(game, player, p.bishop, -1));
        game.addPiece(new Piece(game, player, p.knight, -1));
      }
    }
  }

  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    if (move.moveType === MoveType.MoveReplace || move.moveType === MoveType.CaptureReplace) {
      const p = this.piecesAccess();
      const rank = this.board!.getRank(move.toSquare);
      const promotionType = move.promotionType;
      if (rank === 9 || rank === 2) {
        if (
          promotionType !== this.numberOf(p.bishop) &&
          promotionType !== this.numberOf(p.knight) &&
          promotionType !== this.numberOf(p.wizard) &&
          promotionType !== this.numberOf(p.vao)
        ) {
          return MoveEventResponse.IllegalMove;
        }
      } else if (rank === 10 || rank === 1) {
        if (
          promotionType === this.numberOf(p.queen) ||
          promotionType === this.numberOf(p.archbishop) ||
          promotionType === this.numberOf(p.chancellor)
        ) {
          return MoveEventResponse.IllegalMove;
        }
      }
    }
    return MoveEventResponse.MoveOk;
  }

  private numberOf(type: PieceType): number {
    return this.game!.getPieceTypeNumber(type);
  }
}
