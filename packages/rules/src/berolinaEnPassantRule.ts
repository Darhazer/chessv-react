/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Berolina/BerolinaEnPassantRule.cs
 ***************************************************************************/

import {
  type FEN,
  type Game,
  HashKeys,
  MAX_GAME_LENGTH,
  MAX_PLY,
  MoveEventResponse,
  type MoveInfo,
  type MoveList,
  MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * En passant for the Berolina pawn, which moves diagonally and captures
 * straight forward. Because the capture direction differs from the move
 * direction, two squares must be tracked: the square passed over (where the
 * en-passant capture lands) and the square of the pawn to be removed.
 */
export class BerolinaEnPassantRule extends Rule {
  readonly pawnType: PieceType;

  private hashKeyIndex = 0;
  private epCaptureSquares: Int32Array = new Int32Array(0);
  private epMoverSquares: Int32Array = new Int32Array(0);
  private gameHistoryCaptureSquares: Int32Array = new Int32Array(0);
  private gameHistoryMoverSquares: Int32Array = new Int32Array(0);
  /** The pawn's capture direction, per player. */
  private captureDirections: number[] = [0, 0];

  constructor(pawnType: PieceType) {
    super();
    this.pawnType = pawnType;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.hashKeyIndex = game.hashKeys.takeKeys(game.board.numSquares);
    this.epCaptureSquares = new Int32Array(MAX_PLY);
    this.epMoverSquares = new Int32Array(MAX_PLY);
    this.gameHistoryCaptureSquares = new Int32Array(MAX_GAME_LENGTH);
    this.gameHistoryMoverSquares = new Int32Array(MAX_GAME_LENGTH);

    const moves = this.pawnType.moveCapabilities;
    const count = this.pawnType.nMoveCapabilities;
    for (let n = 0; n < count; n++) {
      if (moves[n]!.canCapture) {
        this.captureDirections[0] = game.playerDirection(0, moves[n]!.nDirection);
        this.captureDirections[1] = game.playerDirection(1, moves[n]!.nDirection);
      }
    }

    game.moveBeingPlayedHandlers.push(() => this.onMoveBeingPlayed());
  }

  override clearGameState(): void {
    this.epCaptureSquares.fill(0);
    this.epMoverSquares.fill(0);
    this.gameHistoryCaptureSquares.fill(0);
    this.gameHistoryMoverSquares.fill(0);
  }

  override getPositionHashCode(ply: number): bigint {
    const game = this.game!;
    const epCaptureSquare =
      ply === 1
        ? this.gameHistoryCaptureSquares[game.gameMoveNumber]!
        : this.epCaptureSquares[ply - 1]!;
    if (epCaptureSquare !== 0) {
      const epMoverSquare =
        ply === 1
          ? this.gameHistoryMoverSquares[game.gameMoveNumber]!
          : this.epMoverSquares[ply - 1]!;
      return (
        HashKeys.Keys[this.hashKeyIndex + epCaptureSquare]! ^
        HashKeys.Keys[this.hashKeyIndex + epMoverSquare]!
      );
    }
    return 0n;
  }

  override positionLoaded(fen: FEN): void {
    const ep = fen.get('en-passant');
    if (ep === '-') {
      this.epCaptureSquares[0] = -1;
      this.epMoverSquares[0] = -1;
    } else {
      // The notation holds two squares; the first square's rank may be more
      // than one digit, so scan past the digits to find the split point.
      let splitpoint = 1;
      while (splitpoint < ep.length && ep[splitpoint]! >= '0' && ep[splitpoint]! <= '9') {
        splitpoint++;
      }
      this.epCaptureSquares[0] = this.game!.notationToSquare(ep.substring(0, splitpoint));
      this.epMoverSquares[0] = this.game!.notationToSquare(ep.substring(splitpoint));
    }
  }

  override savePositionToFEN(fen: FEN): void {
    const game = this.game!;
    const epCaptureSquare =
      game.gameMoveNumber === 0
        ? this.epCaptureSquares[0]!
        : this.gameHistoryCaptureSquares[game.gameMoveNumber - 1]!;
    const epMoverSquare =
      game.gameMoveNumber === 0
        ? this.epMoverSquares[0]!
        : this.gameHistoryMoverSquares[game.gameMoveNumber - 1]!;
    fen.set(
      'en-passant',
      epCaptureSquare > 0
        ? game.getSquareNotation(epCaptureSquare) + game.getSquareNotation(epMoverSquare)
        : '-',
    );
  }

  override setDefaultsInFEN(fen: FEN): void {
    if (fen.get('en-passant') === '#default') fen.set('en-passant', '-');
  }

  private onMoveBeingPlayed(): void {
    const game = this.game!;
    this.gameHistoryCaptureSquares[game.gameMoveNumber] = this.epCaptureSquares[1]!;
    this.gameHistoryMoverSquares[game.gameMoveNumber] = this.epMoverSquares[1]!;
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    const game = this.game!;
    const board = this.board!;
    this.epCaptureSquares[ply] = 0;
    this.epMoverSquares[ply] = 0;
    if (ply === 1) {
      this.gameHistoryCaptureSquares[game.gameMoveNumber] = 0;
      this.gameHistoryMoverSquares[game.gameMoveNumber] = 0;
    }
    if (game.currentSide === game.nextSide) return MoveEventResponse.NotHandled;

    if (
      move.pieceMoved != null &&
      move.pieceMoved.pieceType === this.pawnType &&
      board.getDistance(move.fromSquare, move.toSquare) > 1
    ) {
      const moveDirection = board.directionFromTo(move.fromSquare, move.toSquare);
      let epCaptureSquare = board.nextSquare(moveDirection, move.fromSquare);
      while (epCaptureSquare >= 0 && board.pieceAt(epCaptureSquare) == null) {
        const nextSquare = board.nextSquare(this.captureDirections[move.player]!, epCaptureSquare);
        if (nextSquare >= 0) {
          const piece = board.pieceAt(nextSquare);
          if (
            piece != null &&
            piece.pieceType === this.pawnType &&
            piece.player !== move.player
          ) {
            this.epCaptureSquares[ply] = epCaptureSquare;
            this.epMoverSquares[ply] = move.toSquare;
            if (ply === 1) {
              this.gameHistoryCaptureSquares[game.gameMoveNumber] = epCaptureSquare;
              this.gameHistoryMoverSquares[game.gameMoveNumber] = move.toSquare;
            }
            return MoveEventResponse.MoveOk;
          }
        }
        epCaptureSquare = board.nextSquare(moveDirection, epCaptureSquare);
      }
    }
    return MoveEventResponse.NotHandled;
  }

  override generateSpecialMoves(list: MoveList, _capturesOnly: boolean, ply: number): void {
    const game = this.game!;
    const board = this.board!;
    let epCaptureSquare =
      ply === 1
        ? game.gameMoveNumber === 0
          ? this.epCaptureSquares[0]!
          : this.gameHistoryCaptureSquares[game.gameMoveNumber - 1]!
        : this.epCaptureSquares[ply - 1]!;
    if (epCaptureSquare <= 0) return;

    const targetSquare =
      ply === 1
        ? game.gameMoveNumber === 0
          ? this.epMoverSquares[0]!
          : this.gameHistoryMoverSquares[game.gameMoveNumber - 1]!
        : this.epMoverSquares[ply - 1]!;
    const victimPawnMoveDirection = board.directionFromTo(epCaptureSquare, targetSquare);
    const targetPawn = board.pieceAt(targetSquare);
    if (targetPawn == null) return;

    while (epCaptureSquare !== targetSquare && epCaptureSquare >= 0) {
      const attackerSquare = board.nextSquare(
        this.captureDirections[targetPawn.player]!,
        epCaptureSquare,
      );
      const attacker = attackerSquare >= 0 ? board.pieceAt(attackerSquare) : null;
      if (attacker != null && attacker.pieceType === this.pawnType) {
        list.beginMoveAdd(MoveType.EnPassant, attacker.square, epCaptureSquare);
        list.addPickup(attacker.square);
        list.addPickup(targetPawn.square);
        list.addDrop(attacker, epCaptureSquare, null);
        list.endMoveAdd(3000);
      }
      epCaptureSquare = board.nextSquare(victimPawnMoveDirection, epCaptureSquare);
    }
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.pawnType) notes.push('en passant');
  }
}
