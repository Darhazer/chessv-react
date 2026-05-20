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
} from '@chessv/engine';
import { CastlingRule } from './castlingRule.js';
import { EnPassantRule } from './enPassantRule.js';
import { FlexibleCastlingRule } from './flexibleCastlingRule.js';

/** Half-board square count for an Alice (two-board) layout. */
function halfBoardSize(numSquares: number): number {
  return numSquares / 2;
}

/**
 * Alice-flavoured standard castling: the king and partner piece must end on
 * the *mirror* squares on the other sub-board, and those mirror squares
 * must be empty (in addition to the usual castling preconditions).
 */
export class AliceCastlingRule extends CastlingRule {
  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const half = halfBoardSize(board.numSquares);
    const castlingPriv =
      ply === 1
        ? this.gameHistoryPrivs[game.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!;

    for (let x = 0; x < this.nCastlingMoves[game.currentSide]!; x++) {
      const cm = this.castlingMoves[game.currentSide]![x]!;
      if ((cm.requiredPriv & castlingPriv) === 0) continue;

      // The actual destinations are on the other sub-board. Compute the
      // sign of the cross-board shift once, then apply consistently.
      const fromFirstBoard = cm.kingFromSquare < half;
      const shift = fromFirstBoard ? half : -half;
      const kingTo = cm.kingToSquare + shift;
      const otherTo = cm.otherToSquare + shift;
      if (board.pieceAt(kingTo) !== null || board.pieceAt(otherTo) !== null) continue;

      // Same path / attack checks as the base rule, on the originating board.
      const minSquare = Math.min(
        cm.kingFromSquare,
        cm.kingToSquare,
        cm.otherFromSquare,
        cm.otherToSquare,
      );
      const maxSquare = Math.max(
        cm.kingFromSquare,
        cm.kingToSquare,
        cm.otherFromSquare,
        cm.otherToSquare,
      );
      let squaresEmpty = true;
      for (
        let file = board.getFile(minSquare);
        squaresEmpty && file <= board.getFile(maxSquare);
        file++
      ) {
        const sq = file * board.numRanks + board.getRank(minSquare);
        if (
          sq !== cm.kingFromSquare &&
          sq !== cm.otherFromSquare &&
          board.pieceAt(sq) != null
        ) {
          squaresEmpty = false;
        }
      }
      if (!squaresEmpty) continue;

      let squaresAttacked = false;
      if (this.hasCheckmateRule) {
        const step = cm.kingFromSquare < cm.kingToSquare ? 1 : -1;
        for (
          let file = board.getFile(cm.kingFromSquare);
          !squaresAttacked &&
          (step > 0
            ? file <= board.getFile(cm.kingToSquare)
            : file >= board.getFile(cm.kingToSquare));
          file += step
        ) {
          const sq = file * board.numRanks + board.getRank(cm.kingFromSquare);
          if (game.isSquareAttacked(sq, game.currentSide ^ 1)) squaresAttacked = true;
        }
      }
      if (squaresAttacked) continue;

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
  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const half = halfBoardSize(board.numSquares);
    const castlingPriv =
      ply === 1
        ? this.gameHistoryPrivs[game.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!;

    for (let x = 0; x < this.nCastlingMoves[game.currentSide]!; x++) {
      const cm = this.castlingMoves[game.currentSide]![x]!;
      if ((cm.requiredPriv & castlingPriv) === 0) continue;

      const fromFirstBoard = cm.kingFromSquare < half;
      const shift = fromFirstBoard ? half : -half;
      const slideRight = cm.kingFromSquare < cm.kingToSquare;
      const step = slideRight ? 1 : -1;
      const kingFromFile = board.getFile(cm.kingFromSquare);
      const kingToFile = board.getFile(cm.kingToSquare);
      const otherFromFile = board.getFile(cm.otherFromSquare);
      const rank = board.getRank(cm.kingFromSquare);

      // Path empty (on the originating board).
      let squaresEmpty = true;
      const inEmptinessRange = (file: number): boolean =>
        slideRight
          ? file <= kingToFile || file <= otherFromFile
          : file >= kingToFile || file >= otherFromFile;
      for (
        let file = kingFromFile + step;
        squaresEmpty && inEmptinessRange(file);
        file += step
      ) {
        const sq = file * board.numRanks + rank;
        if (sq !== cm.otherFromSquare && board.pieceAt(sq) != null) squaresEmpty = false;
      }
      if (!squaresEmpty) continue;

      // King path attacks.
      let slideDistance = 1;
      let squaresAttacked = false;
      if (this.hasCheckmateRule) {
        for (
          let file = kingFromFile;
          !squaresAttacked && (slideRight ? file <= kingToFile : file >= kingToFile);
          file += step
        ) {
          const sq = file * board.numRanks + rank;
          if (game.isSquareAttacked(sq, game.currentSide ^ 1)) squaresAttacked = true;
          slideDistance++;
        }
      } else {
        slideDistance += Math.abs(kingToFile - kingFromFile) + 1;
      }
      if (squaresAttacked) continue;

      // Emit the canonical destination first. The partner piece lands on the
      // king's other side, both translated to the mirror sub-board.
      const otherDropFile1 = kingToFile - step;
      const otherDrop1 = otherDropFile1 * board.numRanks + rank + shift;
      const kingTo1 = cm.kingToSquare + shift;
      if (board.pieceAt(kingTo1) === null && board.pieceAt(otherDrop1) === null) {
        list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, kingTo1);
        const king = list.addPickup(cm.kingFromSquare);
        const other = list.addPickup(cm.otherFromSquare);
        list.addDrop(king, kingTo1, null);
        list.addDrop(other, otherDrop1, null);
        list.endMoveAdd(1000);
      }

      // Extra-distance destinations.
      const allowOntoPartner = cm.otherToSquare;
      const farLimit = otherFromFile + step * allowOntoPartner;
      const inFarRange = (file: number): boolean =>
        slideRight ? file < farLimit : file > farLimit;
      for (
        let file = kingToFile + step;
        !squaresAttacked && inFarRange(file) && slideDistance <= this.maxSlideRange;
        file += step
      ) {
        const sq = file * board.numRanks + rank;
        if (this.hasCheckmateRule && game.isSquareAttacked(sq, game.currentSide ^ 1)) {
          squaresAttacked = true;
        }
        if (!squaresAttacked) {
          const kingDest = sq + shift;
          const otherDest = (file - step) * board.numRanks + rank + shift;
          if (board.pieceAt(kingDest) === null && board.pieceAt(otherDest) === null) {
            list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, kingDest);
            const king = list.addPickup(cm.kingFromSquare);
            const other = list.addPickup(cm.otherFromSquare);
            list.addDrop(king, kingDest, null);
            list.addDrop(other, otherDest, null);
            list.endMoveAdd(1000);
          }
        }
        slideDistance++;
      }
    }
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
    const board = this.board!;
    const epSquare =
      ply === 1
        ? game.gameMoveNumber === 0
          ? this.epSquares[0]!
          : this.gameHistory[game.gameMoveNumber - 1]!
        : this.epSquares[ply - 1]!;
    if (epSquare <= 0) return;

    const half = halfBoardSize(board.numSquares);
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
      const dest = epSquare >= half ? epSquare - half : epSquare + half;
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
    const board = this.board!;
    this.epSquares[ply] = 0;
    if (ply === 1) this.gameHistory[game.gameMoveNumber] = 0;
    if (game.currentSide === game.nextSide) return Response.NotHandled;
    if (move.pieceMoved == null || move.pieceMoved.pieceType !== this.pawnType) {
      return Response.NotHandled;
    }
    const half = halfBoardSize(board.numSquares);
    const virtualFrom = move.fromSquare >= half ? move.fromSquare - half : move.fromSquare + half;
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
