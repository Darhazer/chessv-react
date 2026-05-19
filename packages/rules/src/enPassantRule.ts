/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/EnPassantRule.cs
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
 * En passant: a pawn that has just made a multi-step move may be captured, on
 * any square it passed over, as if it had moved a single step — but only when
 * an enemy pawn is actually positioned to make that capture.
 */
export class EnPassantRule extends Rule {
  readonly pawnType: PieceType;
  readonly nDirection: number;

  private hashKeyIndex = 0;
  private epSquares: Int32Array = new Int32Array(0);
  private gameHistory: Int32Array = new Int32Array(0);
  /** `attackDirections[player][n]` — the pawn's capture directions per player. */
  private attackDirections: number[][] = [];
  private nAttackDirections = 0;

  constructor(pawnType: PieceType, nDirection: number) {
    super();
    this.pawnType = pawnType;
    this.nDirection = nDirection;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.hashKeyIndex = game.hashKeys.takeKeys(game.board.numSquaresExtended);
    this.epSquares = new Int32Array(MAX_PLY);
    this.gameHistory = new Int32Array(MAX_GAME_LENGTH);

    const attackDirs: number[] = [];
    const { moves, count } = this.pawnType.getMoveCapabilities();
    for (let n = 0; n < count; n++) {
      if (moves[n]!.canCapture) attackDirs.push(moves[n]!.nDirection);
    }
    this.nAttackDirections = attackDirs.length;
    this.attackDirections = [];
    for (let player = 0; player < game.numPlayers; player++) {
      this.attackDirections[player] = attackDirs.map((dir) => game.playerDirection(player, dir));
    }

    game.moveBeingPlayedHandlers.push(() => this.onMoveBeingPlayed());
  }

  override clearGameState(): void {
    this.epSquares.fill(0);
    this.gameHistory.fill(0);
  }

  override getPositionHashCode(ply: number): bigint {
    const epSquare =
      ply === 1 ? this.gameHistory[this.game!.gameMoveNumber]! : this.epSquares[ply - 1]!;
    return HashKeys.Keys[this.hashKeyIndex + epSquare]!;
  }

  override positionLoaded(fen: FEN): void {
    const ep = fen.get('en-passant');
    this.epSquares[0] = ep === '-' ? -1 : this.game!.notationToSquare(ep);
  }

  override savePositionToFEN(fen: FEN): void {
    const epSquare =
      this.game!.gameMoveNumber === 0
        ? this.epSquares[0]!
        : this.gameHistory[this.game!.gameMoveNumber - 1]!;
    fen.set('en-passant', epSquare > 0 ? this.game!.getSquareNotation(epSquare) : '-');
  }

  override setDefaultsInFEN(fen: FEN): void {
    if (fen.get('en-passant') === '#default') fen.set('en-passant', '-');
  }

  private onMoveBeingPlayed(): void {
    this.gameHistory[this.game!.gameMoveNumber] = this.epSquares[1]!;
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    const game = this.game!;
    const board = this.board!;
    this.epSquares[ply] = 0;
    if (ply === 1) this.gameHistory[game.gameMoveNumber] = 0;
    // If the side to move does not change, en passant cannot apply.
    if (game.currentSide === game.nextSide) return MoveEventResponse.NotHandled;

    if (
      move.pieceMoved != null &&
      move.pieceMoved.pieceType === this.pawnType &&
      board.directionFromTo(move.fromSquare, move.toSquare) ===
        game.playerDirection(move.player, this.nDirection) &&
      board.getDistance(move.fromSquare, move.toSquare) > 1
    ) {
      // Only set the e.p. square if an enemy pawn can actually make the capture
      // — otherwise two otherwise-identical positions would hash differently.
      let epsquare = board.nextSquare(
        game.playerDirection(move.player, this.nDirection),
        move.fromSquare,
      );
      while (epsquare >= 0 && board.pieceAt(epsquare) == null) {
        for (let ndir = 0; ndir < this.nAttackDirections; ndir++) {
          const nextSquare = board.nextSquare(this.attackDirections[move.player]![ndir]!, epsquare);
          if (nextSquare >= 0) {
            const piece = board.pieceAt(nextSquare);
            if (piece != null && piece.pieceType === this.pawnType && piece.player !== move.player) {
              this.epSquares[ply] = epsquare;
              if (ply === 1) this.gameHistory[game.gameMoveNumber] = epsquare;
              return MoveEventResponse.MoveOk;
            }
          }
        }
        epsquare = board.nextSquare(
          game.playerDirection(move.player, this.nDirection),
          epsquare,
        );
      }
    }
    return MoveEventResponse.NotHandled;
  }

  override generateSpecialMoves(list: MoveList, _capturesOnly: boolean, ply: number): void {
    const game = this.game!;
    const board = this.board!;
    const epSquare =
      ply === 1
        ? game.gameMoveNumber === 0
          ? this.epSquares[0]!
          : this.gameHistory[game.gameMoveNumber - 1]!
        : this.epSquares[ply - 1]!;
    if (epSquare <= 0) return;

    const nd = game.playerDirection(game.currentSide ^ 1, this.nDirection);
    for (let ndir = 0; ndir < this.nAttackDirections; ndir++) {
      const nextSquare = board.nextSquare(this.attackDirections[game.currentSide ^ 1]![ndir]!, epSquare);
      if (nextSquare >= 0) {
        const piece = board.pieceAt(nextSquare);
        if (piece != null && piece.pieceType === this.pawnType && piece.player === game.currentSide) {
          // Find the square of the pawn being captured (may be several steps
          // away on large boards where pawns can make long moves).
          let captureSquare = board.nextSquare(nd, epSquare);
          while (captureSquare >= 0 && board.pieceAt(captureSquare) == null) {
            captureSquare = board.nextSquare(nd, captureSquare);
          }
          list.beginMoveAdd(MoveType.EnPassant, nextSquare, epSquare);
          list.addPickup(nextSquare);
          list.addPickup(captureSquare);
          list.addDrop(piece, epSquare, null);
          list.endMoveAdd(3000);
        }
      }
    }
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.pawnType) notes.push('en passant');
  }
}
