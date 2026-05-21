/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/LocationVictoryConditionRule.cs
 ***************************************************************************/

import {
  type ConditionalLocationDelegate,
  type Game,
  MAX_PLY,
  MoveEventResponse,
  type MoveInfo,
  MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Win the game by moving any of the listed piece types to a square that
 * satisfies the predicate (in the moving player's frame of reference).
 * Used by Duplex Chess: a king that reaches the back rank wins.
 */
export class LocationVictoryConditionRule extends Rule {
  private readonly types: PieceType[];
  private readonly victoryLocation: ConditionalLocationDelegate;
  private lastDestinationSquare: Int32Array = new Int32Array(0);

  constructor(types: PieceType | PieceType[], victoryLocation: ConditionalLocationDelegate) {
    super();
    this.types = Array.isArray(types) ? types : [types];
    this.victoryLocation = victoryLocation;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.lastDestinationSquare = new Int32Array(MAX_PLY).fill(-1);
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    this.lastDestinationSquare[ply] =
      move.moveType === MoveType.Pass || move.moveType === MoveType.NullMove ? -1 : move.toSquare;
    return MoveEventResponse.NotHandled;
  }

  override testForWinLossDraw(currentPlayer: number, ply: number): MoveEventResponse {
    const board = this.board!;
    const lastDest = this.lastDestinationSquare[ply - 1] ?? -1;
    if (lastDest < 0) return MoveEventResponse.NotHandled;
    const piece = board.pieceAt(lastDest);
    if (piece === null || !this.types.includes(piece.pieceType)) {
      return MoveEventResponse.NotHandled;
    }
    const loc = board.squareToLocation(board.playerSquare(piece.player, lastDest));
    if (!this.victoryLocation(loc)) return MoveEventResponse.NotHandled;
    return currentPlayer === piece.player ? MoveEventResponse.GameWon : MoveEventResponse.GameLost;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (this.types.includes(type)) notes.push('location victory condition');
  }
}
