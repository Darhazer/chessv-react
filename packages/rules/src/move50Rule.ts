/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Move50Rule.cs
 ***************************************************************************/

import {
  type Direction,
  type FEN,
  type Game,
  MAX_GAME_LENGTH,
  MAX_PLY,
  MoveEventResponse,
  type MoveInfo,
  MoveType,
  moveTypeHasProperty,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * The fifty-move rule: declares a draw once `halfMoveCounterThreshold` plies
 * (100 by default) pass with no capture, promotion, or pawn move.
 */
export class Move50Rule extends Rule {
  /** Plies without progress after which the game is drawn. */
  halfMoveCounterThreshold = 100;

  private readonly types: PieceType[];
  private requiredDirection = -1;
  private gameHistoryCounter: Int32Array = new Int32Array(0);
  private searchStackCounter: Int32Array = new Int32Array(0);

  /** Construct from one pawn type, or a list of progress-making types. */
  constructor(pawnTypes: PieceType | PieceType[]) {
    super();
    this.types = Array.isArray(pawnTypes) ? pawnTypes : [pawnTypes];
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.gameHistoryCounter = new Int32Array(MAX_GAME_LENGTH);
    this.searchStackCounter = new Int32Array(MAX_PLY);
    game.movePlayedHandlers.push(() => this.onMovePlayed());
  }

  /** Restrict the progress reset to pawn moves in a particular direction. */
  setRequiredDirection(direction: Direction): void {
    this.requiredDirection = this.game!.getDirectionNumber(direction);
  }

  private onMovePlayed(): void {
    this.gameHistoryCounter[this.game!.gameMoveNumber] = this.searchStackCounter[1]!;
    this.searchStackCounter[0] = this.searchStackCounter[1]!;
  }

  override clearGameState(): void {
    this.searchStackCounter.fill(0);
    this.gameHistoryCounter.fill(0);
  }

  override positionLoaded(fen: FEN): void {
    const value = Number.parseInt(fen.get('half-move clock'), 10);
    if (Number.isNaN(value)) {
      throw new Error('Move50Rule: cannot parse the half-move count from FEN');
    }
    this.searchStackCounter[0] = value;
    this.gameHistoryCounter[0] = value;
  }

  override savePositionToFEN(fen: FEN): void {
    fen.set('half-move clock', String(this.gameHistoryCounter[this.game!.gameMoveNumber]));
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    const game = this.game!;
    this.searchStackCounter[ply] =
      (ply === 1
        ? this.gameHistoryCounter[game.gameMoveNumber]!
        : this.searchStackCounter[ply - 1]!) + 1;
    const resetCounter =
      move.pieceCaptured != null ||
      moveTypeHasProperty(move.moveType, MoveType.PromotionProperty) ||
      (move.pieceMoved != null &&
        this.types.includes(move.pieceMoved.pieceType) &&
        (this.requiredDirection === -1 ||
          game.playerDirection(
            move.player,
            game.board.directionFromTo(move.fromSquare, move.toSquare),
          ) === this.requiredDirection));
    if (resetCounter) this.searchStackCounter[ply] = 0;
    if (ply === 1) {
      this.gameHistoryCounter[game.gameMoveNumber + 1] = this.searchStackCounter[1]!;
    }
    return MoveEventResponse.MoveOk;
  }

  override testForWinLossDraw(_currentPlayer: number, ply: number): MoveEventResponse {
    if (
      (ply === 2 &&
        this.gameHistoryCounter[this.game!.gameMoveNumber]! >= this.halfMoveCounterThreshold) ||
      this.searchStackCounter[ply]! >= this.halfMoveCounterThreshold
    ) {
      return MoveEventResponse.GameDrawn;
    }
    return MoveEventResponse.NotHandled;
  }
}
