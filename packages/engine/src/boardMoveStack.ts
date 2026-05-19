/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/BoardMoveStack.cs
 ***************************************************************************/

import type { Board } from './board.js';
import type { Drop, Pickup } from './basics.js';
import type { MoveInfo } from './moveInfo.js';
import type { MoveList } from './moveList.js';

/**
 * The history of moves actually played on the board (as opposed to moves
 * searched and unmade). Supports unlimited takeback by replaying the recorded
 * pickups and drops in reverse.
 */
export class BoardMoveStack {
  readonly board: Board;
  private readonly pickups: Pickup[] = [];
  private readonly drops: Drop[] = [];
  private readonly moves: MoveInfo[] = [];

  constructor(board: Board) {
    this.board = board;
  }

  /** Number of moves on the stack. */
  get moveCount(): number {
    return this.moves.length;
  }

  /** The move at the given index. */
  getMove(moveNumber: number): MoveInfo {
    return this.moves[moveNumber]!;
  }

  /** Record a move being made, copying its pickups and drops from `moveList`. */
  makingMove(moveList: MoveList, moveInfo: MoveInfo): void {
    const newMove = moveInfo.clone();
    moveList.copyMoveToGameHistory(this.pickups, this.drops, moveInfo);
    newMove.pickupCursor = this.pickups.length;
    newMove.dropCursor = this.drops.length;
    this.moves.push(newMove);
  }

  /** Take back the most recent move. */
  unmakeMove(): void {
    if (this.moves.length === 0) return;

    const game = this.board.game;
    if (game === null) throw new Error('BoardMoveStack used before its board had a game');
    game.moveBeingUnmade(this.moves[this.moves.length - 1]!);

    let pickupCursor = 0;
    let dropCursor = 0;
    if (this.moves.length > 1) {
      pickupCursor = this.moves[this.moves.length - 2]!.pickupCursor;
      dropCursor = this.moves[this.moves.length - 2]!.dropCursor;
    }
    for (let x = this.drops.length; x > dropCursor; x--) this.undoDrop();
    for (let x = this.pickups.length; x > pickupCursor; x--) this.undoPickup();
    this.moves.pop();
  }

  private undoPickup(): void {
    const pickup = this.pickups[this.pickups.length - 1]!;
    this.board.setSquare(pickup.piece!, pickup.square);
    this.pickups.pop();
  }

  private undoDrop(): void {
    const drop = this.drops[this.drops.length - 1]!;
    this.board.clearSquare(drop.square);
    drop.piece.moveCount--;
    if (drop.newType != null) {
      drop.piece.pieceType = drop.newType;
      drop.piece.typeNumber = drop.newType.typeNumber;
    }
    this.drops.pop();
  }
}
