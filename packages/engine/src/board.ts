/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/Board.cs
 *
 *  Note: the C# original keeps a parallel set of `BitBoard64` structures as a
 *  speed optimisation for boards of <= 64 squares. The web port uses the
 *  arbitrary-width `BitBoard` everywhere; the 64-bit fast path can be
 *  reintroduced during performance hardening if profiling calls for it.
 ***************************************************************************/

import { Direction, Location } from './basics.js';
import { BitBoard } from './bitBoard.js';
import { GenericPiece } from './genericPiece.js';
import type { Game } from './game.js';
import type { Piece } from './piece.js';
import type { PieceType } from './pieceType.js';

/** The maximum number of files a board may have. */
export const MAX_FILES = 16;
/** The maximum number of ranks a board may have. */
export const MAX_RANKS = 16;
/** The maximum number of squares a board may have. */
export const MAX_SQUARES = MAX_FILES * MAX_RANKS;
/** Sentinel used in movement matrices for a square with no neighbour. */
export const NOT_CONNECTED = -1;

/**
 * The playing surface.
 *
 * Squares are stored in a flat array. Movement is driven by the `nextStep`
 * matrix: for each numbered direction it records the next square reached (or
 * `NOT_CONNECTED`). This direction-matrix design is what lets a single engine
 * support arbitrary pieces and board shapes — understanding it is essential to
 * understanding ChessV.
 */
export class Board {
  // *** DIMENSIONS *** //
  readonly numFiles: number;
  readonly numRanks: number;
  /** Squares on the playable board(s), excluding virtual drop squares. */
  readonly numSquares: number;
  /** Total squares including virtual squares (e.g. pocket-drop sources). */
  readonly numSquaresExtended: number;
  /** Number of distinct movement directions used by this game. */
  numberOfDirections = 0;
  /** Disables simple (SEE-friendly) move generation, e.g. for cylindrical boards. */
  disableSimpleMoveGeneration = false;

  /** The game this board belongs to; assigned by {@link postCreate}. */
  game: Game | null = null;

  // *** ZOBRIST / EVAL STATE *** //
  /** Position hash for repetition detection and transposition lookup. */
  hashCode = 0n;
  /** Hash of just the pawn structure. */
  pawnHashCode = 0n;
  /** Hash of the material configuration. */
  materialHashCode = 0n;

  // *** SQUARE / DIRECTION TABLES *** //
  private readonly squares: (Piece | null)[];
  // `protected` so geometry subclasses (e.g. BoardWithPockets) can stamp in
  // file/rank metadata for their extended (off-board) squares.
  protected readonly fileBySquare: Int32Array;
  protected readonly rankBySquare: Int32Array;
  private readonly distances: Int32Array[];
  private readonly pstInSmallCenter: Int32Array;
  private readonly pstInLargeCenter: Int32Array;
  private readonly pstForwardness: Int32Array;
  private rankNotations: string[];
  private fileNotations: string[];
  private readonly rankLookup = new Map<string, number>();
  private readonly fileLookup = new Map<string, number>();

  /** `nextStep[direction][square]` → next square, or `NOT_CONNECTED`. */
  // `protected` so geometry subclasses (e.g. TwoBoards) can post-process
  // the matrix to disconnect specific square pairs.
  protected nextStep: Int32Array[] = [];
  /** `flipSquare[player][square]` → square translated into the player's frame. */
  private flipSquare: Int32Array[] = [];
  /** `directionLookup[from][to]` → direction number, or -1 if not aligned. */
  private directionLookup: Int32Array[] = [];

  // *** INCREMENTALLY-MAINTAINED EVAL/MATERIAL STATE *** //
  private playerMaterial: Int32Array = new Int32Array(0);
  private playerEndgameMaterial: Int32Array = new Int32Array(0);
  private midgameMaterialEval: Int32Array = new Int32Array(0);
  private endgameMaterialEval: Int32Array = new Int32Array(0);
  private pieceCountByType: Int32Array[] = [];
  private playerPieceBitboards: BitBoard[] = [];
  private pieceTypeBitboards: BitBoard[][] = [];
  private pieceTypeBitboardsSliced: BitBoard[][][] = [];

  constructor(numFiles: number, numRanks: number, numSquaresExtended?: number) {
    this.numFiles = numFiles;
    this.numRanks = numRanks;
    this.numSquares = numFiles * numRanks;
    this.numSquaresExtended = numSquaresExtended ?? this.numSquares;

    const extended = this.numSquaresExtended;
    this.squares = new Array<Piece | null>(extended).fill(null);
    this.fileBySquare = new Int32Array(extended);
    this.rankBySquare = new Int32Array(extended);
    this.pstInSmallCenter = new Int32Array(extended);
    this.pstInLargeCenter = new Int32Array(extended);
    this.pstForwardness = new Int32Array(extended);
    this.rankNotations = new Array<string>(MAX_RANKS).fill('');
    this.fileNotations = new Array<string>(MAX_FILES).fill(' ');

    for (let rank = 0; rank < numRanks; rank++) {
      this.rankNotations[rank] = String(rank + 1);
    }
    for (let file = 0; file < numFiles; file++) {
      this.fileNotations[file] = String.fromCharCode('a'.charCodeAt(0) + file);
    }

    // distances[s1][s2] — Chebyshev (king-step) distance, NOT_CONNECTED for virtual squares.
    this.distances = Array.from({ length: extended }, () => {
      const row = new Int32Array(extended);
      row.fill(NOT_CONNECTED);
      return row;
    });

    this.computeGeometryTables();
  }

  /** Fill the file/rank lookups and PST tables for the rectangular geometry. */
  private computeGeometryTables(): void {
    const { numFiles, numRanks } = this;
    const maxDistanceFromEdgeByBoardSize = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
    const maxDistanceFromEdge =
      numFiles < numRanks
        ? (maxDistanceFromEdgeByBoardSize[numFiles] ?? 0)
        : (maxDistanceFromEdgeByBoardSize[numRanks] ?? 0);
    const forwardness8Ranks = [-2, -1, 0, 1, 2, 3, 4, 5];
    const forwardness9Ranks = [-2, -1, 0, 1, 1, 2, 3, 4, 5];
    const forwardness10Ranks = [-3, -2, -2, 0, 1, 2, 3, 4, 4, 5];
    const forwardness12Ranks = [-3, -3, -2, -1, 0, 1, 2, 3, 3, 4, 4, 5];

    const playable = numFiles * numRanks;
    for (let sq = 0; sq < playable; sq++) {
      this.fileBySquare[sq] = Math.floor(sq / numRanks);
      this.rankBySquare[sq] = sq % numRanks;
    }
    for (let sq1 = 0; sq1 < playable; sq1++) {
      const file1 = this.getFile(sq1);
      const rank1 = this.getRank(sq1);
      const fileFromEdge = Math.min(file1, numFiles - file1 - 1);
      const rankFromEdge = Math.min(rank1, numRanks - rank1 - 1);
      const distanceFromEdge = Math.min(fileFromEdge, rankFromEdge);

      if (numFiles >= 9 && numRanks >= 9) {
        this.pstInSmallCenter[sq1] = distanceFromEdge >= maxDistanceFromEdge - 1 ? 1 : 0;
        this.pstInLargeCenter[sq1] = distanceFromEdge >= maxDistanceFromEdge - 2 ? 1 : 0;
      } else {
        this.pstInSmallCenter[sq1] = distanceFromEdge === maxDistanceFromEdge ? 1 : 0;
        this.pstInLargeCenter[sq1] = distanceFromEdge >= maxDistanceFromEdge - 1 ? 1 : 0;
      }

      if (numRanks <= 8) {
        this.pstForwardness[sq1] = forwardness8Ranks[rank1 + (8 - numRanks)] ?? 0;
      } else if (numRanks === 9) {
        this.pstForwardness[sq1] = forwardness9Ranks[rank1] ?? 0;
      } else if (numRanks === 10) {
        this.pstForwardness[sq1] = forwardness10Ranks[rank1] ?? 0;
      } else if (numRanks === 12) {
        this.pstForwardness[sq1] = forwardness12Ranks[rank1] ?? 0;
      } else {
        throw new Error('Board: unsupported rank count for forwardness table');
      }

      const row = this.distances[sq1]!;
      for (let sq2 = 0; sq2 < playable; sq2++) {
        const fileOffset = Math.abs(this.getFile(sq2) - file1);
        const rankOffset = Math.abs(this.getRank(sq2) - rank1);
        row[sq2] = Math.max(fileOffset, rankOffset);
      }
    }
  }

  // *** INQUIRY *** //

  /** The piece on a square, or null. */
  pieceAt(square: number): Piece | null {
    return this.squares[square] ?? null;
  }

  getFileNotation(file: number): string {
    return this.fileNotations[file] ?? '';
  }

  getRankNotation(rank: number): string {
    return this.rankNotations[rank] ?? '';
  }

  /** Default algebraic notation (file letter + rank number) for a square. */
  getDefaultSquareNotation(square: number): string {
    return this.getFileNotation(this.getFile(square)) + this.getRankNotation(this.getRank(square));
  }

  getRank(square: number): number {
    return this.rankBySquare[square] ?? 0;
  }

  getFile(square: number): number {
    return this.fileBySquare[square] ?? 0;
  }

  /** Chebyshev (king-step) distance between two squares. */
  getDistance(square1: number, square2: number): number {
    return this.distances[square1]?.[square2] ?? NOT_CONNECTED;
  }

  /** Next square from `square` travelling in direction `nDirection`. */
  nextSquare(nDirection: number, square: number): number {
    return this.nextStep[nDirection]?.[square] ?? NOT_CONNECTED;
  }

  /** Next square for a specific player (direction translated by symmetry). */
  nextSquareForPlayer(player: number, nDirection: number, square: number): number {
    const game = this.requireGame();
    return this.nextSquare(game.playerDirection(player, nDirection), square);
  }

  /** Translate a square into the given player's frame of reference. */
  playerSquare(player: number, square: number): number {
    return this.flipSquare[player]?.[square] ?? square;
  }

  /** Direction number to travel from `from` to `to`, or -1 if not aligned. */
  directionFromTo(from: number, to: number): number {
    return this.directionLookup[from]?.[to] ?? -1;
  }

  /** Convert a square number to a (rank, file) location. */
  squareToLocation(square: number): Location {
    return new Location(this.getRank(square), this.getFile(square));
  }

  /** Convert a (rank, file) location to a square number. */
  locationToSquare(location: Location): number {
    return location.file * this.numRanks + location.rank;
  }

  /** Convert an explicit rank and file to a square number. */
  rankFileToSquare(rank: number, file: number): number {
    return file * this.numRanks + rank;
  }

  /** Resolve default file-letter+rank-number notation to a square number. */
  defaultNotationToSquare(notation: string): number {
    const file = this.fileLookup.get(notation[0] ?? '');
    const rank = this.rankLookup.get(notation.substring(1));
    if (file === undefined || rank === undefined) {
      throw new Error(`Board.defaultNotationToSquare - unknown square notation: ${notation}`);
    }
    return file * this.numRanks + rank;
  }

  /** 1 if the square lies in the small centre (used to build piece-square tables). */
  inSmallCenter(square: number): number {
    return this.pstInSmallCenter[square] ?? 0;
  }

  /** 1 if the square lies in the large centre (used to build piece-square tables). */
  inLargeCenter(square: number): number {
    return this.pstInLargeCenter[square] ?? 0;
  }

  /** "Forwardness" weight of a square (used to build piece-square tables). */
  forwardness(square: number): number {
    return this.pstForwardness[square] ?? 0;
  }

  getPlayerPieceBitboard(player: number): BitBoard {
    return this.playerPieceBitboards[player]!;
  }

  getPieceTypeBitboard(player: number, pieceType: number): BitBoard {
    return this.pieceTypeBitboards[player]![pieceType]!;
  }

  getPieceTypeBitboardSliced(player: number, pieceType: number, slice: number): BitBoard {
    return this.pieceTypeBitboardsSliced[player]![pieceType]![slice]!;
  }

  getPlayerMaterial(player: number): number {
    return this.playerMaterial[player] ?? 0;
  }

  getPlayerEndgameMaterial(player: number): number {
    return this.playerEndgameMaterial[player] ?? 0;
  }

  getMidgameMaterialEval(player: number): number {
    return this.midgameMaterialEval[player] ?? 0;
  }

  /** Combined midgame material+PST evaluation (player 0 minus player 1). */
  getMidgameMaterialEvalTotal(): number {
    return (this.midgameMaterialEval[0] ?? 0) - (this.midgameMaterialEval[1] ?? 0);
  }

  getEndgameMaterialEval(player: number): number {
    return this.endgameMaterialEval[player] ?? 0;
  }

  // *** INITIALIZATION *** //

  /** Associate the board with its game and build the notation lookups. */
  postCreate(game: Game): void {
    this.game = game;
    for (let file = 0; file < this.numFiles; file++) {
      const notation = this.fileNotations[file];
      if (notation && notation !== ' ') this.fileLookup.set(notation, file);
    }
    for (let rank = 0; rank < this.numRanks; rank++) {
      const notation = this.rankNotations[rank];
      if (notation && notation !== ' ') this.rankLookup.set(notation, rank);
    }
  }

  /** Build the movement matrices and allocate incremental-state arrays. */
  initialize(): void {
    this.buildNextStepMatrix();
    this.buildFlipSquareMatrix();
    this.buildDirectionLookupMatrix();

    const game = this.requireGame();
    const players = game.numPlayers;
    const types = game.nPieceTypes;

    this.playerMaterial = new Int32Array(players);
    this.playerEndgameMaterial = new Int32Array(players);
    this.midgameMaterialEval = new Int32Array(players);
    this.endgameMaterialEval = new Int32Array(players);
    this.pieceCountByType = [];
    this.playerPieceBitboards = [];
    this.pieceTypeBitboards = [];
    this.pieceTypeBitboardsSliced = [];

    for (let player = 0; player < players; player++) {
      this.pieceCountByType[player] = new Int32Array(types);
      this.playerPieceBitboards[player] = new BitBoard(this.numSquares);
      this.pieceTypeBitboards[player] = [];
      this.pieceTypeBitboardsSliced[player] = [];
      for (let type = 0; type < types; type++) {
        this.pieceTypeBitboards[player]![type] = new BitBoard(this.numSquares);
        this.pieceTypeBitboardsSliced[player]![type] = Array.from(
          { length: 8 },
          () => new BitBoard(this.numSquares),
        );
      }
    }
  }

  /** Build `nextStep[direction][square]` from the game's direction set. */
  protected buildNextStepMatrix(): void {
    const game = this.requireGame();
    const directions = game.getDirections();
    this.numberOfDirections = directions.length;
    this.nextStep = [];

    for (let d = 0; d < directions.length; d++) {
      const row = new Int32Array(this.numSquaresExtended);
      const direction = directions[d]!;
      for (let sq = 0; sq < this.numSquaresExtended; sq++) {
        if (sq < this.numSquares) {
          const location = this.squareToLocation(sq);
          const next = new Location(
            location.rank + direction.rankOffset,
            location.file + direction.fileOffset,
          );
          row[sq] =
            next.file >= 0 &&
            next.file < this.numFiles &&
            next.rank >= 0 &&
            next.rank < this.numRanks
              ? this.locationToSquare(next)
              : NOT_CONNECTED;
        } else {
          row[sq] = NOT_CONNECTED;
        }
      }
      this.nextStep[d] = row;
    }
  }

  /** Build `flipSquare[player][square]` from the game's symmetry. */
  protected buildFlipSquareMatrix(): void {
    const game = this.requireGame();
    this.flipSquare = [];
    for (let player = 0; player < game.numPlayers; player++) {
      const row = new Int32Array(this.numSquaresExtended);
      for (let square = 0; square < this.numSquares; square++) {
        const location = this.squareToLocation(square);
        row[square] = this.locationToSquare(game.symmetry.translate(player, location));
      }
      for (let square = this.numSquares; square < this.numSquaresExtended; square++) {
        row[square] = square;
      }
      this.flipSquare[player] = row;
    }
  }

  /** Build `directionLookup[from][to]`, preferring the primary directions. */
  protected buildDirectionLookupMatrix(): void {
    const game = this.requireGame();
    const directions = game.getDirections();
    this.numberOfDirections = directions.length;

    this.directionLookup = [];
    for (let from = 0; from < this.numSquares; from++) {
      const row = new Int32Array(this.numSquares);
      row.fill(-1);
      this.directionLookup[from] = row;
    }
    for (let from = 0; from < this.numSquares; from++) {
      const row = this.directionLookup[from]!;
      for (let direction = 0; direction < directions.length; direction++) {
        let current = this.nextStep[direction]?.[from] ?? NOT_CONNECTED;
        while (current >= 0 && current < this.numSquares) {
          if (row[current] === -1) {
            row[current] = direction;
          } else if (current === from) {
            // Wrapped all the way around a circular or cylindrical board.
            break;
          }
          current = this.nextStep[direction]?.[current] ?? NOT_CONNECTED;
        }
      }
    }
  }

  setFileNotation(fileNotation: string[]): void {
    this.fileNotations = fileNotation;
  }

  setRankNotation(rankNotation: string[]): void {
    this.rankNotations = rankNotation;
  }

  // *** OPERATIONS *** //

  /**
   * Parse a position-array string (FEN-style ranks separated by `/`) into a
   * map of square number → generic piece (null for an empty square).
   */
  arrayToPieceMap(array: string): Map<number, GenericPiece | null> {
    const game = this.requireGame();
    const map = new Map<number, GenericPiece | null>();
    const cursor = { value: 0 };
    let file = 0;
    let rank = this.numRanks - 1;

    while (cursor.value < array.length) {
      const ch = array[cursor.value]!;
      if (ch === '/') {
        while (file < this.numFiles) {
          map.set(this.locationToSquare(new Location(rank, file++)), null);
        }
        file = 0;
        rank--;
        cursor.value++;
      } else if (ch >= '0' && ch <= '9') {
        const start = cursor.value++;
        while (
          cursor.value < array.length &&
          array[cursor.value]! >= '0' &&
          array[cursor.value]! <= '9'
        ) {
          cursor.value++;
        }
        const newFile = file + parseInt(array.substring(start, cursor.value), 10);
        if (newFile > this.numFiles) {
          throw new Error(`array extends past board's right edge near character ${cursor.value}`);
        }
        while (file < newFile) {
          map.set(this.locationToSquare(new Location(rank, file++)), null);
        }
      } else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') {
        const lookahead = array[cursor.value + 1];
        const isUpper = (c: string | undefined): boolean => c !== undefined && c >= 'A' && c <= 'Z';
        const player =
          ch === '_' && array.length > cursor.value + 1
            ? isUpper(lookahead)
              ? 0
              : 1
            : isUpper(ch)
              ? 0
              : 1;
        const pieceType = game.parsePieceTypeFromString(array, cursor);
        map.set(
          this.locationToSquare(new Location(rank, file++)),
          new GenericPiece(player, pieceType),
        );
      } else {
        throw new Error(`unexpected character in piece array: ${ch}`);
      }
    }
    return map;
  }

  /** Remove and return the piece on a square, updating all incremental state. */
  clearSquare(square: number): Piece {
    const piece = this.squares[square];
    if (piece == null) throw new Error('Board.clearSquare - square is empty');
    this.squares[square] = null;
    piece.square = -1;
    this.updateForPiece(piece, square, -1);
    return piece;
  }

  /** Place a piece on a square, updating all incremental state. */
  setSquare(piece: Piece, square: number): void {
    if (this.squares[square] != null) {
      throw new Error('Board.setSquare - square is already occupied');
    }
    this.squares[square] = piece;
    piece.square = square;
    this.updateForPiece(piece, square, +1);
  }

  /**
   * Apply the material, bitboard and hash deltas for adding (`sign === 1`) or
   * removing (`sign === -1`) a piece on a square.
   */
  private updateForPiece(piece: Piece, square: number, sign: 1 | -1): void {
    const type = piece.pieceType;
    const player = piece.player;
    const typeNumber = piece.typeNumber;
    const slice = type.sliceLookup[square] ?? 0;
    const flipped = this.flipSquare[player]?.[square] ?? square;

    this.playerMaterial[player]! += sign * type.midgameValue;
    this.playerEndgameMaterial[player]! += sign * type.endgameValue;
    this.midgameMaterialEval[player]! += sign * (type.midgameValue + type.getMidgamePST(flipped));
    this.endgameMaterialEval[player]! += sign * (type.endgameValue + type.getEndgamePST(flipped));

    const playerBb = this.playerPieceBitboards[player]!;
    const typeBb = this.pieceTypeBitboards[player]![typeNumber]!;
    const slicedBb = this.pieceTypeBitboardsSliced[player]![typeNumber]![slice]!;
    if (sign === 1) {
      playerBb.setBit(square);
      typeBb.setBit(square);
      slicedBb.setBit(square);
    } else {
      playerBb.clearBit(square);
      typeBb.clearBit(square);
      slicedBb.clearBit(square);
    }

    const counts = this.pieceCountByType[player]!;
    if (sign === 1) {
      // Hash before incrementing the count, mirroring the C# ordering.
      this.hashCode ^= type.getHashKey(player, square);
      this.pawnHashCode ^= type.getPawnHashKey(player, square);
      counts[typeNumber]! += 1;
      this.materialHashCode ^= type.getMaterialHashKey(player, slice, counts[typeNumber]!);
    } else {
      this.hashCode ^= type.getHashKey(player, square);
      this.pawnHashCode ^= type.getPawnHashKey(player, square);
      this.materialHashCode ^= type.getMaterialHashKey(player, slice, counts[typeNumber]!);
      counts[typeNumber]! -= 1;
    }
  }

  /** Recompute the material+PST evaluations from scratch. */
  recalculateMaterialEvaluations(): void {
    this.midgameMaterialEval.fill(0);
    this.endgameMaterialEval.fill(0);
    for (let sq = 0; sq < this.numSquaresExtended; sq++) {
      const piece = this.squares[sq];
      if (piece != null) {
        const flipped = this.flipSquare[piece.player]?.[sq] ?? sq;
        this.midgameMaterialEval[piece.player]! +=
          piece.pieceType.midgameValue + piece.pieceType.getMidgamePST(flipped);
        this.endgameMaterialEval[piece.player]! +=
          piece.pieceType.endgameValue + piece.pieceType.getEndgamePST(flipped);
      }
    }
  }

  /** Midgame PST delta for moving the piece now standing on `to` from `from`. */
  calculateStandardMovePST(from: number, to: number): number {
    const piece = this.squares[to];
    if (piece == null) throw new Error('Board.calculateStandardMovePST - destination is empty');
    const flip = this.flipSquare[piece.player]!;
    return (
      piece.pieceType.getMidgamePST(flip[to]!) - piece.pieceType.getMidgamePST(flip[from]!)
    );
  }

  /** Remove every piece from the board. */
  clearBoard(): void {
    for (let sq = 0; sq < this.numSquaresExtended; sq++) {
      if (this.squares[sq] != null) this.clearSquare(sq);
    }
  }

  /** Convenience wrapper for resolving game-specific square notation. */
  squareByNotation(notation: string): number {
    return this.requireGame().notationToSquare(notation);
  }

  private requireGame(): Game {
    if (this.game === null) throw new Error('Board used before its game was assigned');
    return this.game;
  }
}

// Re-exported for type-only consumers that import alongside the Board class.
export type { PieceType };
