/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/KingsLeapRule.cs
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
 * King's-leap rule (Archchess): once per game, each king may leap two
 * squares orthogonally from its starting square. The privilege is tracked
 * as two bits (`K`/`k`) and is cleared on any move from the king's home
 * square. Persisted in FEN under a custom `kings-leap` field.
 */
export class KingsLeapRule extends Rule {
  /** Starting squares for white's and black's king (0 and 1 indices). */
  private readonly kingSquares: [number, number];
  /** Direction numbers for the four 2-square orthogonal leaps. */
  private directions: number[] = [];
  private privs: Int32Array = new Int32Array(0);
  private gameHistory: Int32Array = new Int32Array(0);
  private hashKeyIndex = 0;

  constructor(king1square: number, king2square: number) {
    super();
    this.kingSquares = [king1square, king2square];
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.hashKeyIndex = game.hashKeys.takeKeys(4);
    this.gameHistory = new Int32Array(MAX_GAME_LENGTH);
    this.privs = new Int32Array(MAX_PLY);
    game.movePlayedHandlers.push(() => this.onMovePlayed());
  }

  override postInitialize(): void {
    const game = this.game!;
    const allDirections = game.getDirections();
    this.directions = [];
    for (let x = 0; x < allDirections.length; x++) {
      const dir = allDirections[x]!;
      if (
        (dir.fileOffset === 0 && Math.abs(dir.rankOffset) === 2) ||
        (dir.rankOffset === 0 && Math.abs(dir.fileOffset) === 2)
      ) {
        this.directions.push(x);
      }
    }
  }

  override clearGameState(): void {
    this.privs.fill(0);
    this.gameHistory.fill(0);
  }

  override getPositionHashCode(ply: number): bigint {
    const priv =
      ply === 1 ? this.gameHistory[this.game!.gameMoveNumber + 1]! : this.privs[ply - 1]!;
    return HashKeys.Keys[this.hashKeyIndex + priv]!;
  }

  private onMovePlayed(): void {
    this.gameHistory[this.game!.gameMoveNumber] = this.privs[1]!;
    this.privs[0] = this.privs[1]!;
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const priv =
      ply === 1 ? this.gameHistory[game.gameMoveNumber]! : this.privs[ply - 1]!;
    const player = game.currentSide;
    const playerBit = player === 0 ? 1 : 2;
    if ((priv & playerBit) === 0) return;

    const home = this.kingSquares[player as 0 | 1];
    for (const direction of this.directions) {
      const square = board.nextSquare(direction, home);
      if (square < 0 || board.pieceAt(square) !== null) continue;
      list.beginMoveAdd(MoveType.StandardMove, home, square);
      const king = list.addPickup(home);
      list.addDrop(king, square, null);
      list.endMoveAdd(500);
    }
  }

  override setDefaultsInFEN(fen: FEN): void {
    if (fen.get('kings-leap') === '#default') fen.set('kings-leap', 'Kk');
  }

  override positionLoaded(fen: FEN): void {
    this.privs[0] = 0;
    const text = fen.get('kings-leap');
    if (text !== '-') {
      for (const c of text) {
        if (c === 'K') this.privs[0]! |= 1;
        else if (c === 'k') this.privs[0]! |= 2;
        else throw new Error(`Unrecognized character in FEN kings-leap section: ${c}`);
      }
    }
    this.gameHistory[this.game!.gameMoveNumber] = this.privs[0]!;
  }

  override savePositionToFEN(fen: FEN): void {
    const priv = this.gameHistory[this.game!.gameMoveNumber]!;
    let text = '';
    if (priv & 1) text += 'K';
    if (priv & 2) text += 'k';
    fen.set('kings-leap', text === '' ? '-' : text);
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    let newPriv =
      ply === 1 ? this.gameHistory[this.game!.gameMoveNumber]! : this.privs[ply - 1]!;
    // Any move from a king's home square consumes that king's leap.
    if (move.fromSquare === this.kingSquares[0]) newPriv &= 2;
    else if (move.fromSquare === this.kingSquares[1]) newPriv &= 1;
    this.privs[ply] = newPriv;
    if (ply === 1) this.gameHistory[this.game!.gameMoveNumber + 1] = newPriv;
    return MoveEventResponse.MoveOk;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    const board = this.board!;
    const piece = board.pieceAt(this.kingSquares[0]);
    if (piece !== null && piece.pieceType === type) notes.push("king's leap");
  }
}
