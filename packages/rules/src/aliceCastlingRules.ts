/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Alice/AliceCastlingRule.cs,
 *  AliceFlexibleCastlingRule.cs and AliceEnPassantRule.cs.
 ***************************************************************************/

import {
  type MoveEventResponse,
  type MoveInfo,
  type MoveList,
  MoveEventResponse as Response,
  MoveType,
  TwoBoards,
} from '@chessv/engine';
import { CastlingRule } from './castlingRule.js';
import { EnPassantRule } from './enPassantRule.js';
import { FlexibleCastlingRule } from './flexibleCastlingRule.js';

/**
 * Alice-flavoured standard castling: the king and partner piece must end on
 * the *mirror* squares on the other sub-board, and those mirror squares
 * must be empty (in addition to the usual castling preconditions).
 */
export class AliceCastlingRule extends CastlingRule {
  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board as TwoBoards;
    const castlingPriv =
      ply === 1
        ? this.gameHistoryPrivs[game.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!;

    for (let x = 0; x < this.nCastlingMoves[game.currentSide]!; x++) {
      const cm = this.castlingMoves[game.currentSide]![x]!;
      if ((cm.requiredPriv & castlingPriv) === 0) continue;

      const kingTo = board.mirrorSquare(cm.kingToSquare);
      const otherTo = board.mirrorSquare(cm.otherToSquare);
      if (board.pieceAt(kingTo) !== null || board.pieceAt(otherTo) !== null) continue;
      if (!this.isCastlingPathEmpty(cm)) continue;
      if (this.isKingPathAttacked(cm)) continue;

      list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, kingTo);
      const king = list.addPickup(cm.kingFromSquare);
      const other = list.addPickup(cm.otherFromSquare);
      list.addDrop(king, kingTo, null);
      list.addDrop(other, otherTo, null);
      list.endMoveAdd(1000);
    }
  }
}

/**
 * Alice-flavoured flexible castling: king + partner end on the mirror
 * sub-board, both mirror squares must be empty.
 */
export class AliceFlexibleCastlingRule extends FlexibleCastlingRule {
  protected override translateDestination(square: number): number {
    return (this.board as TwoBoards).mirrorSquare(square);
  }
}

/**
 * Alice-flavoured en passant: like the base rule, but the capturing pawn
 * lands on the mirror square (the AliceRule's teleport applies to e.p. too).
 */
export class AliceEnPassantRule extends EnPassantRule {
  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board as TwoBoards;
    const epSquare =
      ply === 1
        ? game.gameMoveNumber === 0
          ? this.epSquares[0]!
          : this.gameHistory[game.gameMoveNumber - 1]!
        : this.epSquares[ply - 1]!;
    if (epSquare <= 0) return;

    const nd = game.playerDirection(game.currentSide ^ 1, this.nDirection);
    for (let ndir = 0; ndir < this.nAttackDirections; ndir++) {
      const nextSquare = board.nextSquare(
        this.attackDirections[game.currentSide ^ 1]![ndir]!,
        epSquare,
      );
      if (nextSquare < 0) continue;
      const piece = board.pieceAt(nextSquare);
      if (piece == null || piece.pieceType !== this.pawnType || piece.player !== game.currentSide) {
        continue;
      }
      // The captured pawn may be several squares away.
      let captureSquare = board.nextSquare(nd, epSquare);
      while (captureSquare >= 0 && board.pieceAt(captureSquare) == null) {
        captureSquare = board.nextSquare(nd, captureSquare);
      }
      // The capturing pawn lands on the mirror of the e.p. square.
      const dest = board.mirrorSquare(epSquare);
      if (board.pieceAt(dest) !== null) continue;
      list.beginMoveAdd(MoveType.EnPassant, nextSquare, dest);
      list.addPickup(nextSquare);
      list.addPickup(captureSquare);
      list.addDrop(piece, dest, null);
      list.endMoveAdd(120);
    }
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    // The base rule keys the "did this pawn make a multi-step move?" check off
    // the from→to distance. For Alice, the actual `to` is on the mirror board,
    // so distance is NOT_CONNECTED. Compare against the virtual (un-teleported)
    // source on the destination's sub-board instead.
    const game = this.game!;
    const board = this.board as TwoBoards;
    this.epSquares[ply] = 0;
    if (ply === 1) this.gameHistory[game.gameMoveNumber] = 0;
    if (game.currentSide === game.nextSide) return Response.NotHandled;
    if (move.pieceMoved == null || move.pieceMoved.pieceType !== this.pawnType) {
      return Response.NotHandled;
    }
    const virtualFrom = board.mirrorSquare(move.fromSquare);
    if (board.getDistance(virtualFrom, move.toSquare) <= 1) return Response.NotHandled;

    let epsquare = board.nextSquare(
      game.playerDirection(move.player, this.nDirection),
      virtualFrom,
    );
    while (epsquare >= 0 && board.pieceAt(epsquare) == null) {
      for (let ndir = 0; ndir < this.nAttackDirections; ndir++) {
        const nextSquare = board.nextSquare(
          this.attackDirections[move.player]![ndir]!,
          epsquare,
        );
        if (nextSquare >= 0) {
          const piece = board.pieceAt(nextSquare);
          if (piece != null && piece.pieceType === this.pawnType && piece.player !== move.player) {
            this.epSquares[ply] = epsquare;
            if (ply === 1) this.gameHistory[game.gameMoveNumber] = epsquare;
            return Response.MoveOk;
          }
        }
      }
      epsquare = board.nextSquare(
        game.playerDirection(move.player, this.nDirection),
        epsquare,
      );
    }
    return Response.NotHandled;
  }
}
