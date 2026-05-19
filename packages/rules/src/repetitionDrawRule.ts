/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/RepetitionDrawRule.cs
 ***************************************************************************/

import {
  type Game,
  MAX_GAME_LENGTH,
  MAX_PLY,
  MoveEventResponse,
  type MoveInfo,
  Rule,
} from '@chessv/engine';

/** Declares the game drawn once a position has occurred three times. */
export class RepetitionDrawRule extends Rule {
  private gameHistoryHashes: bigint[] = [];
  private searchStackHashes: bigint[] = [];

  override initialize(game: Game): void {
    super.initialize(game);
    this.gameHistoryHashes = new Array<bigint>(MAX_GAME_LENGTH).fill(0n);
    this.searchStackHashes = new Array<bigint>(MAX_PLY).fill(0n);
    game.moveBeingPlayedHandlers.push((move) => this.onMoveBeingPlayed(move));
  }

  private onMoveBeingPlayed(_move: MoveInfo): void {
    this.gameHistoryHashes[this.game!.gameMoveNumber] = this.game!.getPositionHashCode(2);
  }

  override moveMade(_move: MoveInfo, ply: number): MoveEventResponse {
    this.searchStackHashes[ply] = this.game!.getPositionHashCode(ply);
    return MoveEventResponse.MoveOk;
  }

  override testForWinLossDraw(_currentPlayer: number, ply: number): MoveEventResponse {
    let count = 1;
    const hash = this.game!.getPositionHashCode(ply);
    for (let x = ply - 1; x > 0; x--) {
      if (this.searchStackHashes[x] === hash) count++;
    }
    for (let y = this.game!.gameMoveNumber - 1; count < 3 && y > 0; y--) {
      if (this.gameHistoryHashes[y] === hash) count++;
    }
    return count >= 3 ? MoveEventResponse.GameDrawn : MoveEventResponse.NotHandled;
  }
}
