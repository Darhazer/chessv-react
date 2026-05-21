/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/ExtraMovesForUnmovedPieceRule.cs
 ***************************************************************************/

import {
  type FEN,
  type Game,
  MAX_GAME_LENGTH,
  MAX_PLY,
  MoveCapability,
  MoveEventResponse,
  type MoveInfo,
  type MoveList,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * Each piece of `pieceType` on its starting square has access to the rule's
 * extra `MoveCapability` list. The privilege is tracked as a bitmask keyed
 * off the piece's starting file letter; moving the piece clears its bit.
 *
 * Used by Courier Chess Moderno (Elephant gets a (2,0)/(2,±2) leap from its
 * starting square) and ArchCourier Chess.
 */
export class ExtraMovesForUnmovedPieceRule extends Rule {
  readonly pieceType: PieceType;
  readonly fenSegmentName: string;

  private readonly extraMoves: MoveCapability[] = [];

  private gameHistoryPrivs: Int32Array = new Int32Array(0);
  private searchStackPrivs: Int32Array = new Int32Array(0);
  private allPrivsPerPlayer: Int32Array = new Int32Array(0);
  private privEraseMap: Int32Array = new Int32Array(0);
  private privLookup = new Map<string, number>();
  private privToSquareLookup = new Map<number, number>();
  private allPrivString = '';

  constructor(pieceType: PieceType, fenSegmentName: string) {
    super();
    this.pieceType = pieceType;
    this.fenSegmentName = fenSegmentName;
  }

  /** Register a movement option available to unmoved pieces of `pieceType`. */
  addMove(move: MoveCapability): void {
    this.extraMoves.push(move);
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.searchStackPrivs = new Int32Array(MAX_PLY);
    this.gameHistoryPrivs = new Int32Array(MAX_GAME_LENGTH);
    this.allPrivsPerPlayer = new Int32Array(game.numPlayers);
    this.privEraseMap = new Int32Array(game.board.numSquaresExtended).fill(-1);
    this.allPrivString = '';

    let nextPriv = 1;
    for (const [notation, generic] of game.startingPieces) {
      if (generic === null || generic.pieceType !== this.pieceType) continue;
      const square = game.board.defaultNotationToSquare(notation);
      const file = game.board.getFile(square);
      const fileNotation = game.board.getFileNotation(file);
      if (fileNotation.length !== 1) {
        throw new Error('ExtraMovesForUnmovedPieceRule: file notation must be a single character');
      }
      const priv = nextPriv;
      nextPriv <<= 1;
      this.privEraseMap[square] = -1 & ~priv;
      const privChar =
        generic.player === 0 ? fileNotation.toUpperCase() : fileNotation.toLowerCase();
      if (this.privLookup.has(privChar)) {
        throw new Error(
          'ExtraMovesForUnmovedPieceRule: multiple pieces on the same file not supported',
        );
      }
      this.privLookup.set(privChar, priv);
      this.privToSquareLookup.set(priv, square);
      this.allPrivsPerPlayer[generic.player]! |= priv;
      this.allPrivString += privChar;
    }

    game.movePlayedHandlers.push(() => this.onMovePlayed());
  }

  override postInitialize(): void {
    super.postInitialize();
    const game = this.game!;
    // Resolve direction numbers for each registered capability — these are
    // not auto-assigned for capabilities that don't belong to a piece type.
    for (const move of this.extraMoves) {
      move.nDirection = game.getDirectionNumber(move.direction);
    }
  }

  override clearGameState(): void {
    this.searchStackPrivs.fill(0);
    this.gameHistoryPrivs.fill(0);
  }

  override setDefaultsInFEN(fen: FEN): void {
    if (fen.get(this.fenSegmentName) === '#default') {
      fen.set(this.fenSegmentName, this.allPrivString === '' ? '-' : this.allPrivString);
    }
  }

  override positionLoaded(fen: FEN): void {
    this.searchStackPrivs[0] = 0;
    const text = fen.get(this.fenSegmentName);
    if (text !== '-') {
      for (const c of text) {
        const priv = this.privLookup.get(c);
        if (priv === undefined) {
          throw new Error(
            `ExtraMovesForUnmovedPieceRule: invalid character in FEN ${this.fenSegmentName} privileges: '${c}'`,
          );
        }
        this.searchStackPrivs[0]! |= priv;
      }
    }
    this.gameHistoryPrivs[this.game!.gameMoveNumber] = this.searchStackPrivs[0]!;
  }

  override savePositionToFEN(fen: FEN): void {
    const privs = this.gameHistoryPrivs[this.game!.gameMoveNumber]!;
    let text = '';
    for (const [c, bit] of this.privLookup) {
      if ((privs & bit) !== 0) text += c;
    }
    fen.set(this.fenSegmentName, text === '' ? '-' : text);
  }

  private onMovePlayed(): void {
    this.gameHistoryPrivs[this.game!.gameMoveNumber] = this.searchStackPrivs[1]!;
    this.searchStackPrivs[0] = this.searchStackPrivs[1]!;
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    this.searchStackPrivs[ply] =
      (ply === 1
        ? this.gameHistoryPrivs[this.game!.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!) & this.privEraseMap[move.fromSquare]!;
    if (ply === 1) {
      this.gameHistoryPrivs[this.game!.gameMoveNumber + 1] = this.searchStackPrivs[1]!;
    }
    return MoveEventResponse.MoveOk;
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    const game = this.game!;
    const board = this.board!;
    let privs =
      ((ply === 1
        ? this.gameHistoryPrivs[game.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!) &
        this.allPrivsPerPlayer[game.currentSide]!) >>>
      0;
    while (privs !== 0) {
      const bit = privs & -privs; // isolate lowest set bit
      privs ^= bit;
      const square = this.privToSquareLookup.get(bit)!;
      const piece = board.pieceAt(square);
      if (piece === null) continue;
      for (const extra of this.extraMoves) {
        piece.generateMovesForCapability(game.simpleMoveGeneration, extra, list, capturesOnly);
      }
    }
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.pieceType) notes.push('extra initial moves');
  }
}
