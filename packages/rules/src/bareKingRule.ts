/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/BareKingRule.cs
 ***************************************************************************/

import { MoveEventResponse, type MoveInfo, type PieceType, Rule } from '@chessv/engine';

/**
 * The Shatranj "bare king" rule: a player reduced to a lone king loses, unless
 * the very next move bares the opponent's king too (then it is a draw).
 */
export class BareKingRule extends Rule {
  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    if (this.board!.getPlayerMaterial(move.player) === 0) {
      // The mover has only a king: the game is decided unless this move
      // captures the opponent's last piece (a draw).
      if (
        move.pieceCaptured === null ||
        this.board!.getPlayerMaterial(move.pieceCaptured.player) > 0
      ) {
        return MoveEventResponse.IllegalMove;
      }
    }
    return MoveEventResponse.NotHandled;
  }

  override noMovesResult(currentPlayer: number, _ply: number): MoveEventResponse {
    if (this.board!.getPlayerMaterial(0) === 0 && this.board!.getPlayerMaterial(1) === 0) {
      return MoveEventResponse.GameDrawn;
    }
    if (this.board!.getPlayerMaterial(currentPlayer) === 0) {
      return MoveEventResponse.GameLost;
    }
    return MoveEventResponse.NotHandled;
  }

  override testForWinLossDraw(_currentPlayer: number, _ply: number): MoveEventResponse {
    // Two bare kings is a draw — without this the bare king to move would be
    // wrongly judged stalemated, since `moveBeingMade` rules out all its moves.
    if (this.board!.getPlayerMaterial(0) === 0 && this.board!.getPlayerMaterial(1) === 0) {
      return MoveEventResponse.GameDrawn;
    }
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type.midgameValue === 0) notes.push('bare king loses');
  }
}
