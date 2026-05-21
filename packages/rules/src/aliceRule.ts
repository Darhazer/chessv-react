/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Alice/AliceRule.cs
 ***************************************************************************/

import {
  MoveEventResponse,
  type MoveInfo,
  type MoveList,
  MoveType,
  type PieceType,
  Rule,
  TwoBoards,
} from '@chessv/engine';

/**
 * Alice Chess teleportation rule. Every standard move and capture is
 * transformed so the piece ends on the *other* board's corresponding
 * square — provided that square is empty (for non-captures, both squares
 * must be empty on their respective boards; for captures the destination
 * carries the captured piece and the mirror square must be empty).
 *
 * The base move generation produces moves within a single sub-board (the
 * piece's nextStep matrix doesn't cross the file boundary). This rule
 * redirects every such move to its mirror.
 */
export class AliceRule extends Rule {
  /** The royal piece type (if the game has one) — used for check legality. */
  royalType: PieceType | null = null;

  override moveBeingGenerated(
    moves: MoveList,
    from: number,
    to: number,
    type: MoveType,
  ): MoveEventResponse {
    const board = this.board as TwoBoards;
    if (type === MoveType.StandardMove) {
      const mirror = board.mirrorSquare(to);
      if (board.pieceAt(mirror) === null) {
        moves.addMove(from, mirror, true);
      }
      return MoveEventResponse.Handled;
    }
    if (type === MoveType.StandardCapture) {
      const mirror = board.mirrorSquare(to);
      // The mirror square is the actual destination; the capture happens on
      // the original square (where the enemy piece sits). We have to pick
      // up both: the mover from `from`, and the captured piece from `to`.
      moves.beginMoveAdd(MoveType.StandardCapture, from, mirror);
      const moving = moves.addPickup(from);
      const captured = moves.addPickup(to);
      moves.addDrop(moving, mirror, null);
      moves.endMoveAdd(
        3000 + captured.pieceType.midgameValue - Math.floor(moving.pieceType.midgameValue / 16),
      );
      return MoveEventResponse.Handled;
    }
    return MoveEventResponse.NotHandled;
  }

  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    const board = this.board as TwoBoards;
    const game = this.game!;
    if (this.royalType === null) return MoveEventResponse.MoveOk;
    if (move.pieceMoved === null || move.pieceMoved.pieceType !== this.royalType) {
      return MoveEventResponse.MoveOk;
    }
    // The king's actual destination is on the *other* board; we also need
    // to check that the originating board's mirror square isn't attacked
    // (otherwise the king would have been moving through check on its way).
    const mirror = board.mirrorSquare(move.toSquare);
    if (game.isSquareAttacked(mirror, move.player ^ 1)) return MoveEventResponse.IllegalMove;
    return MoveEventResponse.MoveOk;
  }
}
