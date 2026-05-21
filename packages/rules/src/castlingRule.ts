/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/CastlingRule.cs
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
  moveTypeHasProperty,
  type PieceType,
  Rule,
} from '@chessv/engine';
import { CheckmateRule } from './checkmateRule.js';

/** One configured castling move (king + partner piece displacement). */
export interface CastlingMove {
  kingFromSquare: number;
  kingToSquare: number;
  otherFromSquare: number;
  otherToSquare: number;
  requiredPriv: number;
  privChar: string;
}

/**
 * Standard castling: the king and a partner piece (usually a rook) move
 * simultaneously, subject to castling privileges, an unobstructed path, and —
 * in games with check — the king not passing through an attacked square.
 */
export class CastlingRule extends Rule {
  private static readonly MAX_CASTLING_MOVES = 16;

  /** `castlingMoves[player][n]` — the castling moves available to each player. */
  protected castlingMoves: CastlingMove[][] = [];
  protected nCastlingMoves: number[] = [];
  protected searchStackPrivs: Int32Array = new Int32Array(0);
  protected gameHistoryPrivs: Int32Array = new Int32Array(0);
  protected allPrivsPerPlayer: number[] = [];
  protected privLookup = new Map<string, number>();
  protected nextPriv = 1;
  protected privEraseMap: Int32Array = new Int32Array(0);
  protected allPrivString = '';
  protected hasCheckmateRule = false;
  protected hashKeyIndex = 0;

  override initialize(game: Game): void {
    super.initialize(game);
    this.castlingMoves = Array.from({ length: game.numPlayers }, () => []);
    this.nCastlingMoves = new Array<number>(game.numPlayers).fill(0);
    this.searchStackPrivs = new Int32Array(MAX_PLY);
    this.gameHistoryPrivs = new Int32Array(MAX_GAME_LENGTH);
    this.allPrivsPerPlayer = new Array<number>(game.numPlayers).fill(0);
    this.allPrivString = '';
    this.nextPriv = 1;
    this.privEraseMap = new Int32Array(game.board.numSquaresExtended);
    game.moveBeingPlayedHandlers.push(() => this.onMoveBeingPlayed());
  }

  override postInitialize(): void {
    const game = this.game!;
    this.hashKeyIndex = game.hashKeys.takeKeys(this.nextPriv - 1);
    this.hasCheckmateRule = game.findRule(CheckmateRule) != null;
    for (let square = 0; square < game.board.numSquares; square++) {
      let flagValue = -1;
      for (let player = 0; player < game.numPlayers; player++) {
        for (let move = 0; move < this.nCastlingMoves[player]!; move++) {
          const cm = this.castlingMoves[player]![move]!;
          if (cm.kingFromSquare === square || cm.otherFromSquare === square) {
            flagValue &= ~cm.requiredPriv;
          }
        }
      }
      this.privEraseMap[square] = flagValue;
    }
    for (let square = game.board.numSquares; square < game.board.numSquaresExtended; square++) {
      this.privEraseMap[square] = -1;
    }
  }

  override clearGameState(): void {
    this.searchStackPrivs.fill(0);
    this.gameHistoryPrivs.fill(0);
  }

  /** Register a castling move for a player, associating it with a FEN priv char. */
  addCastlingMove(
    player: number,
    kingFrom: number,
    kingTo: number,
    otherFrom: number,
    otherTo: number,
    privChar: string,
  ): void {
    let priv = this.privLookup.get(privChar);
    if (priv === undefined) {
      priv = this.nextPriv;
      this.nextPriv <<= 1;
      this.privLookup.set(privChar, priv);
    }
    if (!this.allPrivString.includes(privChar)) this.allPrivString += privChar;
    this.allPrivsPerPlayer[player]! |= priv;
    this.castlingMoves[player]![this.nCastlingMoves[player]!++] = {
      kingFromSquare: kingFrom,
      kingToSquare: kingTo,
      otherFromSquare: otherFrom,
      otherToSquare: otherTo,
      requiredPriv: priv,
      privChar,
    };
  }

  override getPositionHashCode(ply: number): bigint {
    const castlingPriv =
      ply === 1
        ? this.gameHistoryPrivs[this.game!.gameMoveNumber + 1]!
        : this.searchStackPrivs[ply - 1]!;
    return HashKeys.Keys[this.hashKeyIndex + castlingPriv]!;
  }

  override setDefaultsInFEN(fen: FEN): void {
    if (fen.get('castling') === '#default') fen.set('castling', this.allPrivString);
  }

  override positionLoaded(fen: FEN): void {
    this.searchStackPrivs[0] = 0;
    const castling = fen.get('castling');
    if (castling !== '-') {
      for (const c of castling) {
        const priv = this.privLookup.get(c);
        if (priv === undefined) {
          throw new Error(`Invalid character in FEN castling privileges: ${c}`);
        }
        this.searchStackPrivs[0]! |= priv;
      }
    }
    this.gameHistoryPrivs[this.game!.gameMoveNumber] = this.searchStackPrivs[0]!;
  }

  override savePositionToFEN(fen: FEN): void {
    const castlingPriv = this.gameHistoryPrivs[this.game!.gameMoveNumber]!;
    let privString = '';
    for (const [char, value] of this.privLookup) {
      if ((value & castlingPriv) !== 0) privString += char;
    }
    fen.set('castling', privString === '' ? '-' : privString);
  }

  private onMoveBeingPlayed(): void {
    this.gameHistoryPrivs[this.game!.gameMoveNumber] = this.searchStackPrivs[1]!;
    this.searchStackPrivs[0] = this.searchStackPrivs[1]!;
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    let privsToErase = this.privEraseMap[move.fromSquare]! & this.privEraseMap[move.toSquare]!;
    if (
      moveTypeHasProperty(move.moveType, MoveType.CaptureProperty) &&
      moveTypeHasProperty(move.moveType, MoveType.BaroqueCaptureProperty)
    ) {
      privsToErase &= this.privEraseMap[move.tag]!;
    }
    this.searchStackPrivs[ply] =
      (ply === 1
        ? this.gameHistoryPrivs[this.game!.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!) & privsToErase;
    if (ply === 1) {
      this.gameHistoryPrivs[this.game!.gameMoveNumber + 1] = this.searchStackPrivs[1]!;
    }
    return MoveEventResponse.MoveOk;
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const castlingPriv =
      ply === 1
        ? this.gameHistoryPrivs[game.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!;

    for (let x = 0; x < this.nCastlingMoves[game.currentSide]!; x++) {
      const cm = this.castlingMoves[game.currentSide]![x]!;
      if ((cm.requiredPriv & castlingPriv) === 0) continue;
      if (!this.isCastlingPathEmpty(cm)) continue;
      if (this.isKingPathAttacked(cm)) continue;

      if (board.pieceAt(cm.kingFromSquare) == null) {
        throw new Error('CastlingRule: king missing from its castling square');
      }
      list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, cm.kingToSquare);
      const king = list.addPickup(cm.kingFromSquare);
      const other = list.addPickup(cm.otherFromSquare);
      list.addDrop(king, cm.kingToSquare, null);
      list.addDrop(other, cm.otherToSquare, null);
      list.endMoveAdd(100);
    }
  }

  /**
   * True iff every square in the king/partner travel range is empty,
   * excepting the king's and partner's source squares.
   */
  protected isCastlingPathEmpty(cm: CastlingMove): boolean {
    const board = this.board!;
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
    const rank = board.getRank(minSquare);
    const lastFile = board.getFile(maxSquare);
    for (let file = board.getFile(minSquare); file <= lastFile; file++) {
      const sq = board.rankFileToSquare(rank, file);
      if (sq !== cm.kingFromSquare && sq !== cm.otherFromSquare && board.pieceAt(sq) != null) {
        return false;
      }
    }
    return true;
  }

  /**
   * True iff any square the king passes through (or lands on) is attacked.
   * No-op in games without a CheckmateRule.
   */
  protected isKingPathAttacked(cm: CastlingMove): boolean {
    if (!this.hasCheckmateRule) return false;
    const game = this.game!;
    const board = this.board!;
    const step = cm.kingFromSquare < cm.kingToSquare ? 1 : -1;
    const rank = board.getRank(cm.kingFromSquare);
    const endFile = board.getFile(cm.kingToSquare);
    for (
      let file = board.getFile(cm.kingFromSquare);
      step > 0 ? file <= endFile : file >= endFile;
      file += step
    ) {
      const sq = board.rankFileToSquare(rank, file);
      if (game.isSquareAttacked(sq, game.currentSide ^ 1)) return true;
    }
    return false;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    const firstMove = this.castlingMoves[0]?.[0];
    if (firstMove === undefined) return;
    const king = this.board!.pieceAt(firstMove.kingFromSquare);
    if (king != null && king.pieceType === type) notes.push('can castle');
  }
}
