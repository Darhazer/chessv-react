/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  This file is part of the ChessV web port.  ChessV is free software; you
 *  can redistribute it and/or modify it under the terms of the GNU General
 *  Public License as published by the Free Software Foundation, either
 *  version 3 of the License, or (at your option) any later version.
 *
 *  Ported from ChessV.Base/Game.cs
 *
 *  `Game` is a C# `partial class` spread over Game.cs, Search.cs and
 *  Evaluate.cs. This module ports the Game.cs portion only — game setup, the
 *  move-generation driver, make/unmake, FEN load/save, move notation and the
 *  win/loss/draw test. The alpha-beta search (Search.cs) and the leaf
 *  evaluation (Evaluate.cs) are deferred to Phase 2 of the port; the search
 *  data structures Game must allocate for `MoveList` are still created here.
 ***************************************************************************/

import {
  Direction,
  Location,
  MoveEventResponse,
  MoveNotation,
  MoveType,
  moveTypeHasProperty,
  PerftResults,
} from './basics.js';
import { Board, NOT_CONNECTED } from './board.js';
import { BoardMoveStack } from './boardMoveStack.js';
import { MAX_GAME_LENGTH, MAX_PLY } from './constants.js';
import { ExObject } from './exObject.js';
import { FEN } from './fen.js';
import type { GenericPiece } from './genericPiece.js';
import { HashKeys } from './hashKeys.js';
import type { MoveCapability } from './moveCapability.js';
import { MoveCompletionDefaultRule, MoveCompletionRule } from './moveCompletionRule.js';
import type { MoveInfo } from './moveInfo.js';
import { MoveList } from './moveList.js';
import type { Counter3D } from './moveList.js';
import { Movement } from './movement.js';
import { Piece } from './piece.js';
import type { PieceType } from './pieceType.js';
import { Result, ResultType } from './result.js';
import { PromotionRule } from './rule.js';
import type { Rule } from './rule.js';
import { createSearchStack } from './searchTypes.js';
import type { SearchStack } from './searchTypes.js';
import type { Symmetry } from './symmetry.js';

/** A constructor type, used by {@link Game.findRule} for rule lookup. */
type Constructor<T> = abstract new (...args: never[]) => T;

/**
 * The central object of the engine: one playable instance of a chess variant.
 *
 * A variant is a subclass that overrides the setup hooks ({@link setGameVariables},
 * {@link addPieceTypes}, {@link addRules}, ...). Construct the subclass, then
 * call {@link initialize} once to build the board, piece types, directions,
 * rules and starting position. After that the object drives move generation,
 * make/unmake and the game record.
 *
 * Movement itself lives in `Piece`/`MoveList`; rules — never the game subclass —
 * customise generation through their hooks. This keeps every variant expressible
 * as data plus a handful of reusable `Rule` objects.
 */
export class Game extends ExObject {
  // *** CONSTANTS *** //
  static readonly MAX_DIRECTIONS = 48;
  static readonly MAX_PIECE_TYPES = 24;
  static readonly MAX_PIECES = 64;
  static readonly MAX_PLY = MAX_PLY;
  static readonly MAX_GAME_LENGTH = MAX_GAME_LENGTH;

  // *** DIMENSIONS / CORE OBJECTS *** //
  readonly numPlayers: number;
  readonly numFiles: number;
  readonly numRanks: number;
  readonly symmetry: Symmetry;
  /** The playing surface. Assigned by {@link initialize}. */
  board!: Board;
  /** Assigns Zobrist key ranges to piece types and rules. */
  readonly hashKeys: HashKeys = new HashKeys();
  /** Records moves actually played, supporting unlimited takeback. */
  boardMoveStack!: BoardMoveStack;

  // *** GAME VARIABLES (set by variant setup hooks) *** //
  name = '';
  invented = '';
  inventedBy = '';
  numberOfSquareColors = 2;
  playerNames: string[];
  /** The FEN of the starting position. */
  fenStart = '';
  /** The board-array portion of the FEN, when supplied as its own variable. */
  array = '';
  /** Suppresses generation of moves that would be duplicates (cylindrical boards). */
  deduplicateMoves = false;
  /** Whether static-exchange evaluation may be used (disabled for complex movement). */
  staticExchangeEvaluation = true;

  // *** STATE *** //
  /** The side whose turn it is to move. */
  currentSide = 0;
  /** The current search ply (1 at the root). */
  ply = 0;
  /** The outcome of the game; `result.isNone` until it ends. */
  result: Result = new Result(ResultType.NoResult);
  /** True while the board is being set up from an array (suspends some rule hooks). */
  arrayBeingLoaded = false;
  /** PST-variation level (0 = fully deterministic). */
  variation = 0;
  /** True when no piece has complex (cannon/path) movement — enables fast paths. */
  simpleMoveGeneration = true;
  /** Squares to highlight for the last move, or null. */
  highlightSquares: number[] | null = null;
  /** Total material at which midgame evaluation begins shifting to endgame. */
  midgameMaterialThreshold = 0;
  /** Total material at which evaluation is fully endgame. */
  endgameMaterialThreshold = 0;
  /** Largest history-heuristic score seen so far; used for move ordering. */
  currentMaxHistoryScore = 1;

  // *** DIRECTIONS *** //
  protected readonly directions: Direction[] = [];
  protected nSlidingDirections = 0;
  /** `playerDirections[player][direction]` — direction translated per player. */
  protected playerDirections: Int32Array[] = [];
  /** `oppositeDirections[direction]` — the direction pointing the other way. */
  protected oppositeDirections: Int32Array = new Int32Array(0);
  /** `maxAttackRange[player][direction]` — farthest any piece attacks that way. */
  protected maxAttackRangeTable: Int32Array[] = [];

  // *** PIECE TYPES *** //
  protected readonly pieceTypes: PieceType[] = [];
  protected readonly disabledPieceTypes: PieceType[] = [];
  protected readonly pieceTypeNumbers = new Map<PieceType, number>();
  /** Piece types looked up by notation, one map per player. */
  readonly typesByNotation: [Map<string, PieceType>, Map<string, PieceType>] = [
    new Map(),
    new Map(),
  ];

  // *** PIECES *** //
  /** `pieces[player]` — every piece of that player, captured pieces included. */
  protected readonly pieces: Piece[][] = [];

  // *** RULES *** //
  protected readonly rules: Rule[] = [];
  /** The single rule that owns turn order; set when it is added. */
  protected moveCompletionRule!: MoveCompletionRule;

  // *** SEARCH DATA STRUCTURES (allocated for MoveList; search is Phase 2) *** //
  protected moveLists: MoveList[] = [];
  protected readonly searchStack: SearchStack[] = createSearchStack();
  protected readonly killers1 = new Uint32Array(MAX_PLY);
  protected readonly killers2 = new Uint32Array(MAX_PLY);
  protected historyCounters: Counter3D = [];
  protected butterflyCounters: Counter3D = [];
  protected countermoves: Uint32Array[] = [];
  protected searchPath: Movement[] = [];
  protected seeAttackers: [Piece[], Piece[]] = [[], []];

  // *** GAME RECORD *** //
  protected readonly gameHistory: MoveInfo[] = [];
  protected readonly gameHistoryTurnNumbers: number[] = [];

  // *** FEN *** //
  protected fen: FEN | null = null;

  // *** EVENTS *** //
  /** Invoked before {@link movePlayedHandlers}, when a move is played. */
  readonly moveBeingPlayedHandlers: ((move: MoveInfo) => void)[] = [];
  /** Invoked when a move is played on the board. */
  readonly movePlayedHandlers: ((move: MoveInfo) => void)[] = [];
  /** Invoked when a move is taken back. */
  readonly moveTakenBackHandlers: (() => void)[] = [];

  protected finalized = false;

  // *** CONSTRUCTION *** //

  constructor(numPlayers: number, numFiles: number, numRanks: number, symmetry: Symmetry) {
    super();
    this.numPlayers = numPlayers;
    this.numFiles = numFiles;
    this.numRanks = numRanks;
    this.symmetry = symmetry;
    this.playerNames = new Array<string>(numPlayers).fill('');
    for (let player = 0; player < numPlayers; player++) this.pieces[player] = [];
  }

  /**
   * Build the game: board, piece types, directions, rules and the starting
   * position. Call exactly once, after constructing a variant subclass.
   */
  initialize(): void {
    // *** BOARD *** //
    this.board = this.createBoard(this.numPlayers, this.numFiles, this.numRanks);
    this.board.postCreate(this);
    this.symmetry.board = this.board;

    // *** GAME VARIABLES *** //
    this.setGameVariables();
    this.setOtherVariables();

    // *** PIECE TYPES *** //
    this.addPieceTypes();
    // Remove any piece types that have been disabled.
    for (let n = this.pieceTypes.length - 1; n >= 0; n--) {
      if (!this.pieceTypes[n]!.enabled) {
        this.disabledPieceTypes.push(this.pieceTypes[n]!);
        this.pieceTypes.splice(n, 1);
      }
    }
    // Number the surviving piece types.
    for (let n = 0; n < this.pieceTypes.length; n++) {
      this.pieceTypeNumbers.set(this.pieceTypes[n]!, n);
    }

    this.buildDirections();

    // *** PIECE NOTATIONS *** //
    for (const type of this.pieceTypes) {
      if (type.notation[0] && type.notation[1]) {
        this.typesByNotation[0].set(type.notation[0], type);
        this.typesByNotation[1].set(type.notation[1], type);
      }
    }

    // *** PIECE PLACEMENT *** //
    this.expandVariablesInFEN();
    this.fen = new FEN(this.requireFen().formatString, this.fenStart);
    this.parseStartingArray(this.requireFen().get('array'));

    // *** RULES *** //
    this.addRules();
    this.reorderRules();
    for (const rule of this.rules) rule.setDefaultsInFEN(this.requireFen());
    this.requireFen().setUninitializedDefaults();
    this.fenStart = this.requireFen().toString();

    this.buildMaxAttackRange();

    // *** BOARD / PIECE-TYPE INITIALIZATION *** //
    this.board.initialize();
    for (const type of this.pieceTypes) type.initialize(this);

    this.addEvaluations();
    this.finishInitialization();
    this.postInitialize();
  }

  /** Build the direction set, then the per-player and opposite direction tables. */
  protected buildDirections(): void {
    // Eight predefined directions: N, S, E, W, NE, SW, NW, SE.
    this.directions.length = 0;
    this.directions.push(
      new Direction(1, 0),
      new Direction(-1, 0),
      new Direction(0, 1),
      new Direction(0, -1),
      new Direction(1, 1),
      new Direction(-1, -1),
      new Direction(1, -1),
      new Direction(-1, 1),
    );
    this.nSlidingDirections = 0;

    // Two passes: pass 1 records sliding directions, pass 2 the single-step ones,
    // so sliding directions cluster at the low indices following the predefined set.
    for (let pass = 1; pass <= 2; pass++) {
      for (let player = 0; player < this.numPlayers; player++) {
        for (const type of this.pieceTypes) {
          const { moves, count } = type.getMoveCapabilities();
          for (let y = 0; y < count; y++) {
            const move = moves[y]!;
            if (pass === 2 || move.maxSteps > 1) {
              const dir = this.symmetry.translateDirection(player, move.direction);
              let isNew = true;
              for (let z = 0; z < this.directions.length && isNew; z++) {
                if (this.directions[z]!.equals(dir)) {
                  isNew = false;
                  if (player === 0) move.nDirection = z;
                }
              }
              if (isNew) {
                this.directions.push(dir);
                if (move.maxSteps > 1) this.nSlidingDirections++;
                if (player === 0) move.nDirection = this.directions.length - 1;
              }
            }
          }
        }
      }
    }

    // Per-player direction translation.
    this.playerDirections = [];
    for (let player = 0; player < this.numPlayers; player++) {
      const row = new Int32Array(this.directions.length);
      for (let dir = 0; dir < this.directions.length; dir++) {
        row[dir] = this.getDirectionNumber(
          this.symmetry.translateDirection(player, this.directions[dir]!),
        );
      }
      this.playerDirections[player] = row;
    }

    // Opposite directions.
    this.oppositeDirections = new Int32Array(this.directions.length);
    for (let dir = 0; dir < this.directions.length; dir++) {
      const direction = this.directions[dir]!;
      let found = false;
      for (let opdir = 0; !found && opdir < this.directions.length; opdir++) {
        const other = this.directions[opdir]!;
        if (
          direction.fileOffset === -other.fileOffset &&
          direction.rankOffset === -other.rankOffset
        ) {
          this.oppositeDirections[dir] = opdir;
          found = true;
        }
      }
      if (!found) throw new Error('Asymmetry of this type not yet implemented.');
    }
  }

  /** Compute the farthest each player can attack in every direction. */
  protected buildMaxAttackRange(): void {
    this.maxAttackRangeTable = [];
    for (let player = 0; player < this.numPlayers; player++) {
      this.maxAttackRangeTable[player] = new Int32Array(this.directions.length);
    }
    for (let dir = 0; dir < this.directions.length; dir++) {
      for (let player = 0; player < this.numPlayers; player++) {
        for (const type of this.pieceTypes) {
          const { moves, count } = type.getMoveCapabilities();
          for (let n = 0; n < count; n++) {
            const move = moves[n]!;
            const playerDirection = this.playerDirection(player, dir);
            if (
              dir === move.nDirection &&
              (move.canCapture || move.specialAttacks !== 0) &&
              move.maxSteps > this.maxAttackRangeTable[player]![playerDirection]!
            ) {
              this.maxAttackRangeTable[player]![playerDirection] = move.maxSteps;
            }
          }
        }
      }
    }
  }

  /** Allocate search/move-ordering structures and the per-ply move lists. */
  protected finishInitialization(): void {
    if (this.board.disableSimpleMoveGeneration) {
      this.simpleMoveGeneration = false;
    } else {
      this.simpleMoveGeneration = this.pieceTypes.every((type) => type.simpleMoveGeneration);
    }
    // Static exchange evaluation only works with simple movement.
    if (!this.simpleMoveGeneration) this.staticExchangeEvaluation = false;

    this.result = new Result(ResultType.NoResult);

    const players = this.numPlayers;
    const types = this.pieceTypes.length;
    const extended = this.board.numSquaresExtended;

    this.historyCounters = this.allocateCounters(players, types, extended);
    this.butterflyCounters = this.allocateCounters(players, types, extended);
    this.countermoves = Array.from({ length: extended }, () => new Uint32Array(extended));
    this.searchPath = Array.from({ length: MAX_PLY }, () => Movement.invalid());

    this.moveLists = [];
    for (let x = 0; x < MAX_PLY; x++) {
      this.moveLists[x] = new MoveList(
        this.board,
        this.searchStack,
        this.killers1,
        this.killers2,
        this.historyCounters,
        this.butterflyCounters,
        x,
      );
    }
    this.moveLists[1]!.legalMovesOnly = true;
  }

  /** Second-phase setup: post-initialize rules and load the starting position. */
  protected postInitialize(): void {
    for (const rule of this.rules) rule.postInitialize();

    this.boardMoveStack = new BoardMoveStack(this.board);
    this.loadFEN(this.fenStart);

    // Betza mobility statistics (used only by the AI evaluation) are a Phase-2
    // concern and are intentionally not computed here.

    const totalMaterial =
      this.board.getPlayerMaterial(0) + this.board.getPlayerMaterial(1);
    this.midgameMaterialThreshold = Math.floor(totalMaterial * 0.8);
    this.endgameMaterialThreshold = Math.floor(totalMaterial * 0.3);
  }

  private allocateCounters(players: number, types: number, squares: number): Counter3D {
    const counters: Counter3D = [];
    for (let player = 0; player < players; player++) {
      counters[player] = [];
      for (let type = 0; type < types; type++) {
        counters[player]![type] = new Uint32Array(squares);
      }
    }
    return counters;
  }

  // *** OVERRIDABLE SETUP HOOKS *** //

  /** Create the board. Override for non-rectangular geometries. */
  protected createBoard(_numPlayers: number, numFiles: number, numRanks: number): Board {
    return new Board(numFiles, numRanks);
  }

  /** Set the game's variables (names, FEN format, ...). Override in variants. */
  protected setGameVariables(): void {
    this.playerNames[0] = 'White';
    this.playerNames[1] = 'Black';
    this.deduplicateMoves = false;
    this.staticExchangeEvaluation = true;
    this.numberOfSquareColors = 2;
  }

  /** React to choices made while resolving game variables. Override as needed. */
  protected setOtherVariables(): void {}

  /** Add the variant's piece types via {@link addPieceType}. Override in variants. */
  protected addPieceTypes(): void {}

  /** Add the variant's rules via {@link addRule}. Override in variants. */
  protected addRules(): void {
    this.addRule(new MoveCompletionDefaultRule());
  }

  /** Reorder the rules so the move-completion rule runs first. */
  protected reorderRules(): void {
    const index = this.rules.indexOf(this.moveCompletionRule);
    if (index > 0) {
      this.rules.splice(index, 1);
      this.rules.unshift(this.moveCompletionRule);
    }
  }

  /** Add the variant's leaf evaluations. Override in Phase 2 variants. */
  protected addEvaluations(): void {}

  /** Expand any `#{variable}` tokens in the starting FEN. */
  protected expandVariablesInFEN(): void {
    const regex = /#\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
    for (;;) {
      let changed = false;
      this.fenStart = this.fenStart.replace(regex, (_match, name: string) => {
        const value = this.lookupGameVariable(name);
        if (value === null || value === undefined) {
          throw new Error(`Unrecognized game variable in FEN: #{${name}}`);
        }
        changed = true;
        return String(value);
      });
      if (!changed) break;
    }
  }

  /** Resolve a game variable by name. Override to expose variant-specific ones. */
  protected lookupGameVariable(name: string): unknown {
    switch (name) {
      case 'Array':
        return this.array;
      case 'FENStart':
        return this.fenStart;
      case 'Name':
        return this.name;
      case 'NumberOfSquareColors':
        return this.numberOfSquareColors;
      default:
        return this.getCustomProperty(name) ?? null;
    }
  }

  // *** PIECE TYPES *** //

  /** Register a piece type with the game. Returns the same type for chaining. */
  addPieceType(type: PieceType): PieceType {
    this.pieceTypes.push(type);
    if (type.name) this.setCustomProperty(type.name, type);
    return type;
  }

  /** Number of (enabled) piece types. */
  get nPieceTypes(): number {
    return this.pieceTypes.length;
  }

  /** The piece type with the given sequential type number. */
  getPieceType(typeNumber: number): PieceType {
    const type = this.pieceTypes[typeNumber];
    if (type === undefined) throw new Error(`Game.getPieceType - invalid type number ${typeNumber}`);
    return type;
  }

  /** The sequential type number assigned to a piece type. */
  getPieceTypeNumber(type: PieceType): number {
    const number = this.pieceTypeNumbers.get(type);
    if (number === undefined) throw new Error('Game.getPieceTypeNumber - unknown piece type');
    return number;
  }

  /** All piece types. */
  getPieceTypes(): readonly PieceType[] {
    return this.pieceTypes;
  }

  /** Find a piece type by notation (either player's), or null. */
  getTypeByNotation(notation: string): PieceType | null {
    return (
      this.typesByNotation[0].get(notation) ?? this.typesByNotation[1].get(notation) ?? null
    );
  }

  /**
   * Parse one piece type from a string, advancing `cursor.value`. Handles the
   * underscore prefix that forces recognition of a two-character notation.
   */
  parsePieceTypeFromString(str: string, cursor: { value: number }): PieceType {
    const ch = str[cursor.value];
    if (ch === '_') {
      if (cursor.value + 2 >= str.length) {
        throw new Error(`Failure to parse piece type: ${str.substring(cursor.value)}`);
      }
      const notation = str.substring(cursor.value, cursor.value + 3);
      let type =
        this.typesByNotation[0].get(notation) ??
        this.typesByNotation[1].get(notation) ??
        this.typesByNotation[0].get(notation.substring(1)) ??
        this.typesByNotation[1].get(notation.substring(1));
      if (type === undefined) throw new Error(`Piece type not found: ${notation}`);
      cursor.value += 3;
      return type;
    }
    const isLetter = (c: string | undefined): boolean =>
      c !== undefined && ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'));
    if (isLetter(ch)) {
      const start = cursor.value++;
      let type =
        this.typesByNotation[0].get(str.substring(start, start + 1)) ??
        this.typesByNotation[1].get(str.substring(start, start + 1));
      const next = str[cursor.value];
      if (
        type === undefined &&
        (isLetter(next) || next === '!' || next === "'")
      ) {
        type =
          this.typesByNotation[0].get(str.substring(start, start + 2)) ??
          this.typesByNotation[1].get(str.substring(start, start + 2));
        cursor.value++;
      }
      if (type === undefined) {
        throw new Error(`Unrecognized type notation: ${str[start]}`);
      }
      return type;
    }
    throw new Error(`Failure to parse piece type: ${str.substring(cursor.value)}`);
  }

  /** Parse a whitespace-free list of piece-type notations into piece types. */
  parseTypeListFromString(types: string): PieceType[] {
    const list: PieceType[] = [];
    const cursor = { value: 0 };
    while (cursor.value < types.length) {
      list.push(this.parsePieceTypeFromString(types, cursor));
    }
    return list;
  }

  // *** PIECES *** //

  /** Add a piece to the game, placing it on the board if it has a square. */
  addPiece(piece: Piece): void {
    this.pieces[piece.player]!.push(piece);
    if (piece.square >= 0) this.board.setSquare(piece, piece.square);
  }

  /** Every piece currently on the board, for every player. */
  getPieceList(): Piece[] {
    const list: Piece[] = [];
    for (let player = 0; player < this.numPlayers; player++) {
      for (const piece of this.pieces[player]!) {
        if (piece.square >= 0) list.push(piece);
      }
    }
    return list;
  }

  /** The pieces of one player currently on the board. */
  getPlayerPieceList(player: number): Piece[] {
    return this.pieces[player]!.filter((piece) => piece.square >= 0);
  }

  /** The captured (off-board) pieces of one player. */
  getCapturedPieceList(player: number): Piece[] {
    return this.pieces[player]!.filter((piece) => piece.square < 0);
  }

  // *** BOARD GEOMETRY AND DIRECTIONS *** //

  /** Number of distinct movement directions in this game. */
  get nDirections(): number {
    return this.directions.length;
  }

  /** Number of sliding directions (multi-step directions added beyond the eight predefined). */
  get nSliding(): number {
    return this.nSlidingDirections;
  }

  /** The direction set, shared with the board. */
  getDirections(): Direction[] {
    return this.directions;
  }

  /** The direction with the given number. */
  getDirection(nDirection: number): Direction {
    return this.directions[nDirection]!;
  }

  /** The number of a direction; throws if it is not part of this game. */
  getDirectionNumber(direction: Direction): number {
    for (let x = 0; x < this.directions.length; x++) {
      if (this.directions[x]!.equals(direction)) return x;
    }
    throw new Error('Unknown direction');
  }

  /** A direction translated into a player's frame of reference. */
  playerDirection(player: number, nDirection: number): number {
    return this.playerDirections[player]![nDirection]!;
  }

  /** The direction pointing opposite to the given one. */
  oppositeDirection(nDirection: number): number {
    return this.oppositeDirections[nDirection]!;
  }

  /** The farthest a player attacks in a direction. */
  maxAttackRange(player: number, nDirection: number): number {
    return this.maxAttackRangeTable[player]![nDirection]!;
  }

  // *** FEN *** //

  /** The FEN format template string. Setting it replaces the FEN object. */
  get fenFormat(): string {
    return this.requireFen().formatString;
  }
  set fenFormat(value: string) {
    this.fen = new FEN(value);
  }

  /** The FEN object describing the current position. */
  getFEN(): FEN {
    this.updateFEN();
    return this.requireFen();
  }

  /** Refresh the FEN object with the current board array and rule state. */
  protected updateFEN(): void {
    const fen = this.requireFen();
    fen.set('array', this.buildArray());
    for (const rule of this.rules) rule.savePositionToFEN(fen);
  }

  /** Render the current board into a FEN-style position-array string. */
  protected buildArray(): string {
    let array = '';
    for (let rank = this.board.numRanks - 1; rank >= 0; rank--) {
      if (rank !== this.board.numRanks - 1) array += '/';
      let emptyCount = 0;
      for (let file = 0; file < this.board.numFiles; file++) {
        const piece = this.board.pieceAt(this.board.locationToSquare(new Location(rank, file)));
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            array += String(emptyCount);
            emptyCount = 0;
          }
          let notation = piece.pieceType.notation[piece.player]!;
          // Prepend an underscore if the two-char notation collides with a one-char one.
          if (notation.length === 2) {
            for (const type of this.pieceTypes) {
              if (
                type.notation[piece.player]!.length === 1 &&
                type.notation[piece.player]![0] === notation[0]
              ) {
                notation = `_${notation}`;
              }
            }
          }
          array += notation;
        }
      }
      if (emptyCount > 0) array += String(emptyCount);
    }
    return array;
  }

  /** Map out where pieces start; populates the starting-position bookkeeping. */
  protected parseStartingArray(array: string): void {
    const pieceMap = this.board.arrayToPieceMap(array);
    this.startingPieces = new Map<string, GenericPiece | null>();
    for (let square = 0; square < this.board.numSquares; square++) {
      if (!pieceMap.has(square)) throw new Error('The array does not cover the board');
      const notation = this.getSquareNotation(square);
      const piece = pieceMap.get(square) ?? null;
      if (piece !== null) {
        this.startingPieces.set(notation, piece);
      } else if (notation.indexOf(' ') < 0) {
        this.startingPieces.set(notation, null);
      }
    }

    this.startingPieceSquares = [];
    this.startingPieceCount = new Int32Array(this.numPlayers);
    for (let player = 0; player < this.numPlayers; player++) {
      const row = new Int32Array(this.board.numSquaresExtended);
      for (let square = 0; square < this.board.numSquares; square++) {
        const piece = pieceMap.get(square) ?? null;
        if (piece !== null && piece.player === player) {
          row[square] = 1;
          this.startingPieceCount[player] = (this.startingPieceCount[player] ?? 0) + 1;
        }
      }
      this.startingPieceSquares[player] = row;
    }
  }

  /** Map of square notation → starting piece (null for an empty square). */
  startingPieces: Map<string, GenericPiece | null> = new Map();
  /** `startingPieceSquares[player][square]` — 1 if occupied at game start. */
  startingPieceSquares: Int32Array[] = [];
  /** Count of each player's pieces at game start. */
  startingPieceCount: Int32Array = new Int32Array(0);

  /** Place pieces on the board as described by a position-array string. */
  protected placePiecesByArray(array: string): void {
    const pieceMap = this.board.arrayToPieceMap(array);
    this.arrayBeingLoaded = true;
    for (const [square, generic] of pieceMap) {
      if (generic !== null) this.addPiece(Piece.fromGeneric(this, generic, square));
    }
    this.arrayBeingLoaded = false;
  }

  /**
   * Load a position from a FEN string: place the pieces, notify the rules, and
   * generate the moves for the side to move.
   */
  loadFEN(newFEN: string): void {
    this.fen = new FEN(this.fenFormat, newFEN);
    this.placePiecesByArray(this.requireFen().get('array'));
    for (const rule of this.rules) rule.positionLoaded(this.requireFen());
    this.gameHistory.length = 0;
    this.gameHistoryTurnNumbers.length = 0;
    this.ply = 1;
    this.generateMoves(this.currentSide, 1, 0);
  }

  // *** MOVE GENERATION *** //

  /** Generate the moves for `player` into the ply's move list. */
  protected generateMoves(player: number, ply: number, moveHash: number, capturesOnly = false): void {
    const countermove =
      ply === 1
        ? 0
        : this.countermoves[this.searchPath[ply - 1]!.fromSquare]![
            this.searchPath[ply - 1]!.toSquare
          ]!;
    this.moveLists[ply]!.reset(moveHash, countermove);
    for (const piece of this.pieces[player]!) {
      if (piece.square >= 0) piece.generateMoves(this.moveLists[ply]!, capturesOnly);
    }
    this.generateSpecialMoves(this.moveLists[ply]!, capturesOnly);
  }

  /** Let the rules contribute moves that normal piece movement does not produce. */
  generateSpecialMoves(list: MoveList, capturesOnly: boolean): void {
    for (const rule of this.rules) rule.generateSpecialMoves(list, capturesOnly, this.ply);
  }

  /** The moves available at the root, with the count actually populated. */
  getRootMoves(): { moves: MoveInfo[]; count: number } {
    return this.moveLists[1]!.getMoves();
  }

  /** The root moves made by a specific piece. */
  getRootMovesForPiece(movingPiece: Piece): MoveInfo[] {
    const { moves, count } = this.moveLists[1]!.getMoves();
    const result: MoveInfo[] = [];
    for (let x = 0; x < count; x++) {
      if (moves[x]!.pieceMoved === movingPiece) result.push(moves[x]!);
    }
    return result;
  }

  // *** PERFT *** //

  /**
   * Count the leaf nodes of the move tree to the given depth — the canonical
   * move-generation correctness check. Ported from ChessV.Base/Search.cs.
   */
  perft(depth: number): PerftResults {
    const results = new PerftResults();
    this.perftRecurse(1, depth, results);
    return results;
  }

  private perftRecurse(ply: number, depth: number, results: PerftResults): void {
    if (depth === 0) {
      results.nodes++;
      return;
    }
    this.ply = ply;
    this.generateMoves(this.currentSide, ply, 0);
    while (this.moveLists[ply]!.makeNextMove()) {
      if (depth === 1) {
        const move = this.moveLists[ply]!.currentMove;
        if (move.moveType === MoveType.StandardCapture) {
          results.captures++;
        } else if (move.moveType === MoveType.Castling) {
          results.castles++;
        } else if (move.moveType === MoveType.EnPassant) {
          results.captures++;
          results.enPassants++;
        }
        if (moveTypeHasProperty(move.moveType, MoveType.PromotionProperty)) {
          results.promotions++;
        }
      }
      this.perftRecurse(ply + 1, depth - 1, results);
      this.moveLists[ply]!.unmakeMove();
    }
  }

  // *** RULE EVENT DISPATCH *** //

  /**
   * Ask every rule whether it wants to veto or transform a move as it is
   * generated; returns true if any rule handled it.
   */
  moveBeingGenerated(moves: MoveList, from: number, to: number, type: MoveType): boolean {
    for (const rule of this.rules) {
      if (rule.moveBeingGenerated(moves, from, to, type) !== MoveEventResponse.NotHandled) {
        return true;
      }
    }
    return false;
  }

  /**
   * Notify the rules that a move is being made; advance the turn order.
   * Returns false if any rule declares the move illegal.
   */
  moveBeingMade(move: MoveInfo): boolean {
    let moveIsLegal = true;
    for (const rule of this.rules) {
      if (rule.moveBeingMade(move, this.ply) === MoveEventResponse.IllegalMove) {
        moveIsLegal = false;
      }
    }
    // The single move-completion rule updates the side to move and turn number.
    this.moveCompletionRule.completeMove(move, this.ply);
    for (const rule of this.rules) rule.moveMade(move, this.ply);
    this.ply++;
    return moveIsLegal;
  }

  /** Notify the rules that a move is being unmade; roll back the turn order. */
  moveBeingUnmade(move: MoveInfo): void {
    this.ply--;
    this.moveCompletionRule.undoingMove();
    for (const rule of this.rules) rule.moveBeingUnmade(move, this.ply);
  }

  /** Ask the rules whether the game is won, lost or drawn. */
  testForWinLossDraw(currentPlayer: number): MoveEventResponse {
    for (const rule of this.rules) {
      const response = rule.testForWinLossDraw(currentPlayer, this.ply);
      if (response !== MoveEventResponse.NotHandled) return response;
    }
    return MoveEventResponse.NotHandled;
  }

  /** Ask the rules for the result when the side to move has no legal moves. */
  noMovesResult(currentPlayer: number): MoveEventResponse {
    for (const rule of this.rules) {
      const response = rule.noMovesResult(currentPlayer, this.ply);
      if (response !== MoveEventResponse.NotHandled) return response;
    }
    throw new Error('No rule handled the NoMovesResult message');
  }

  /** The Zobrist hash of the current position at the given ply. */
  getPositionHashCode(ply: number): bigint {
    let hash = this.board.hashCode;
    for (const rule of this.rules) hash ^= rule.getPositionHashCode(ply);
    return hash;
  }

  // *** MAKING / UNMAKING COMMITTED MOVES *** //

  /**
   * Perform `move` on the board, committing it to the game record, testing for
   * a result and generating the moves for the new position.
   */
  makeMove(move: MoveInfo, highlightMove: boolean): void {
    if (!this.moveLists[1]!.makeMove(move)) {
      throw new Error('Game.makeMove: invalid move specified');
    }

    this.boardMoveStack.makingMove(this.moveLists[1]!, move);
    this.gameHistoryTurnNumbers[this.gameHistory.length] = this.gameTurnNumber;
    this.gameHistory.push(move);

    for (const rule of this.rules) rule.moveMade(move, this.ply);

    if (highlightMove) {
      const stack = this.boardMoveStack;
      if (
        stack.moveCount < 2 ||
        stack.getMove(stack.moveCount - 2).player !== move.player
      ) {
        this.highlightSquares = [];
      }
      if (move.moveType !== MoveType.Pass) {
        this.highlightSquares!.push(move.fromSquare, move.toSquare);
      }
    } else {
      this.highlightSquares = null;
    }

    if (this.result.isNone) {
      const response = this.testForWinLossDraw(this.currentSide);
      if (response === MoveEventResponse.GameDrawn) {
        this.result = new Result(ResultType.Draw);
      } else if (response === MoveEventResponse.GameLost) {
        this.result = new Result(ResultType.Win, this.currentSide ^ 1);
      } else if (response === MoveEventResponse.GameWon) {
        this.result = new Result(ResultType.Win, this.currentSide);
      }
    }

    for (const handler of this.moveBeingPlayedHandlers) handler(move);
    for (const handler of this.movePlayedHandlers) handler(move);

    if (this.result.isNone) {
      this.moveLists[1]!.reset();
      this.ply = 1;
      this.generateMoves(this.currentSide, 1, 0);
      if (this.moveLists[1]!.count === 0) {
        const response = this.noMovesResult(this.currentSide);
        if (response === MoveEventResponse.GameDrawn) {
          this.result = new Result(ResultType.Draw);
        } else if (response === MoveEventResponse.GameWon) {
          this.result = new Result(ResultType.Win, this.currentSide);
        } else if (response === MoveEventResponse.GameLost) {
          this.result = new Result(ResultType.Win, this.currentSide ^ 1);
        }
      }
    }
  }

  /** Perform a move identified only by its packed {@link Movement}. */
  makeMovement(move: Movement, highlightMove: boolean): void {
    const { moves, count } = this.moveLists[1]!.getMoves();
    for (let x = 0; x < count; x++) {
      if (moves[x]!.hash === move.hash) {
        this.makeMove(moves[x]!, highlightMove);
        return;
      }
    }
    throw new Error('Attempt to execute an illegal move in Game.makeMovement');
  }

  /** Take back the most recent committed move. */
  undoMove(): void {
    if (this.finalized) return;
    this.boardMoveStack.unmakeMove();
    this.gameHistory.pop();
    this.gameHistoryTurnNumbers.pop();
    this.moveLists[1]!.reset();
    this.ply = 1;
    this.generateMoves(this.currentSide, 1, 0);
    for (const handler of this.moveTakenBackHandlers) handler();
  }

  /** Take back the given number of committed moves. */
  takeBackMoves(numMoves: number): void {
    for (let x = 0; x < numMoves; x++) this.undoMove();
  }

  /** Play a sequence of moves given in the supplied notation. */
  playMoves(moves: Iterable<string>, format: MoveNotation = MoveNotation.StandardAlgebraic): void {
    for (const notation of moves) {
      const move = this.moveFromDescription(notation, format);
      if (move === null) throw new Error(`Notation does not describe a legal move: ${notation}`);
      this.makeMovement(move, true);
    }
  }

  // *** GAME RECORD *** //

  /** The number of player moves made so far. */
  get gameMoveNumber(): number {
    return this.gameHistory.length;
  }

  /** The current turn number (a white move and a black move count as one). */
  get gameTurnNumber(): number {
    return this.moveCompletionRule.turnNumber;
  }

  /** The side to move after the current move completes. */
  get nextSide(): number {
    return this.moveCompletionRule.getNextSide();
  }

  /** A move from the game record by its index. */
  getHistoricalMove(moveNumber: number): MoveInfo {
    const move = this.gameHistory[moveNumber];
    if (move === undefined) {
      throw new Error('Game.getHistoricalMove - invalid move number specified');
    }
    return move;
  }

  // *** RULES *** //

  /** All rules attached to the game. */
  getRules(): readonly Rule[] {
    return this.rules;
  }

  /** Attach a rule to the game and initialize it. */
  addRule(rule: Rule): void {
    // There is exactly one move-completion rule: a new one replaces the default.
    if (rule instanceof MoveCompletionRule) {
      const existing = this.rules.indexOf(this.moveCompletionRule as Rule);
      if (this.moveCompletionRule && existing >= 0) this.rules.splice(existing, 1);
      this.moveCompletionRule = rule;
    }
    this.rules.push(rule);
    rule.initialize(this);
  }

  /** Find the first rule of (or deriving from) the given class, or null. */
  findRule<T extends Rule>(ruleType: Constructor<T>, inheritedTypes = false): T | null {
    for (const rule of this.rules) {
      if (inheritedTypes ? rule instanceof ruleType : rule.constructor === ruleType) {
        return rule as T;
      }
    }
    return null;
  }

  /** Remove every rule of (or deriving from) the given class. */
  removeRule<T extends Rule>(ruleType: Constructor<T>, inheritedTypes = false): void {
    for (let x = this.rules.length - 1; x >= 0; x--) {
      const rule = this.rules[x]!;
      if (inheritedTypes ? rule instanceof ruleType : rule.constructor === ruleType) {
        this.rules.splice(x, 1);
        rule.ruleRemoved();
      }
    }
  }

  /** The active promotion rule, if the game has one. */
  get activePromotionRule(): PromotionRule | null {
    return this.findRule(PromotionRule, true);
  }

  // *** NOTATION *** //

  /** The notation of a square. Override for variants with custom notation. */
  getSquareNotation(square: number): string {
    return this.board.getDefaultSquareNotation(square);
  }

  /** The square denoted by a notation string. Override for custom notation. */
  notationToSquare(notation: string): number {
    return this.board.defaultNotationToSquare(notation);
  }

  /** Resolve a square notation in a specific move-notation format. */
  protected notationToSquareInFormat(notation: string, format: MoveNotation): number {
    if (format === MoveNotation.XBoard) {
      const file = notation.charCodeAt(0) - 'a'.charCodeAt(0);
      const rankInteger = Number.parseInt(notation.substring(1), 10);
      const rank = this.board.numRanks === 10 ? rankInteger : rankInteger - 1;
      return file * this.board.numRanks + rank;
    }
    if (format === MoveNotation.StandardAlgebraic) {
      return this.notationToSquare(notation);
    }
    throw new Error('Game.notationToSquareInFormat: format not supported');
  }

  /** The square colour for a board location, given the number of colours. */
  getSquareColor(location: Location, nColors: number): number {
    let color = 0;
    const rank = Math.max(location.rank, 0);
    const file = Math.max(location.file, 0);
    if (nColors === 2) {
      color = (rank + file) % 2;
      // Ensure the light colour is bottom-right by inverting for even file counts.
      if (this.board.numFiles % 2 === 0) color ^= 1;
    } else if (nColors === 3) {
      if ((rank + file) % 2 !== this.board.numFiles % 2) {
        color = 0;
      } else {
        color = (rank % 2) + 1;
      }
    }
    return color;
  }

  /** Render a move as text in the requested notation. */
  describeMove(move: MoveInfo, format: MoveNotation): string | null {
    // Give the rules a chance to supply a custom description first.
    for (const rule of this.rules) {
      const result = rule.describeMove(move, format, '');
      if (result.response === MoveEventResponse.Handled) return result.description;
    }
    if (format === MoveNotation.MoveSelectionText) return null;

    if (format === MoveNotation.StandardAlgebraic) {
      if (move.moveType === MoveType.Drop) {
        return `${move.pieceMoved!.pieceType.notation[move.player]}@${this.getSquareNotation(move.toSquare)}`;
      }
      if (move.moveType === MoveType.NullMove) return 'NULL';
      let description = this.getSquareNotation(move.fromSquare) + this.getSquareNotation(move.toSquare);
      if ((move.moveType & (MoveType.PromotionProperty | MoveType.DropOrReplaceProperty)) !== 0) {
        description += this.getPieceType(move.promotionType).notation[move.player];
      }
      return description;
    }

    if (format === MoveNotation.XBoard) {
      const coord = (square: number): string => {
        const file = String.fromCharCode('a'.charCodeAt(0) + this.board.getFile(square));
        const rank = this.board.getRank(square);
        return file + String(this.board.numRanks === 10 ? rank : rank + 1);
      };
      if (move.moveType === MoveType.Drop) {
        return `${move.pieceMoved!.pieceType.notation[move.player]}@${coord(move.toSquare)}`;
      }
      let description = coord(move.fromSquare) + coord(move.toSquare);
      if ((move.moveType & (MoveType.PromotionProperty | MoveType.DropOrReplaceProperty)) !== 0) {
        description += this.getPieceType(move.promotionType).notation[move.player];
      }
      return description;
    }

    return null;
  }

  /**
   * Parse a move description back into a {@link Movement}, matching it against
   * the legal root moves. Returns null if no legal move matches.
   */
  moveFromDescription(description: string, format: MoveNotation): Movement | null {
    const { moves, count } = this.getRootMoves();

    // Drop move: "<piece>@<square>".
    if (description.indexOf('@') > 0) {
      const [pieceNotation, squareNotation] = description.split('@');
      let type: PieceType | null = null;
      for (const candidate of this.pieceTypes) {
        if (candidate.notation[0] === pieceNotation || candidate.notation[1] === pieceNotation) {
          type = candidate;
        }
      }
      if (type !== null && squareNotation !== undefined) {
        const square = this.notationToSquareInFormat(squareNotation, format);
        for (let x = 0; x < count; x++) {
          const move = moves[x]!;
          if (
            move.moveType === MoveType.Drop &&
            move.pieceMoved!.typeNumber === type.typeNumber &&
            move.toSquare === square
          ) {
            return move.toMovement();
          }
        }
      }
    }

    // Castling notation.
    if (description === 'O-O' || description === 'O-O-O') {
      for (let x = 0; x < count; x++) {
        const move = moves[x]!;
        if (move.moveType === MoveType.Castling) {
          if (
            (description === 'O-O' && move.fromSquare < move.toSquare) ||
            (description === 'O-O-O' && move.fromSquare > move.toSquare)
          ) {
            return move.toMovement();
          }
        }
      }
    }

    // Coordinate notation: "<from><to>[<promotion>]".
    const trimmed = description.trim();
    if (trimmed.length >= 4) {
      const isDigit = (c: string): boolean => c >= '0' && c <= '9';
      if (!isDigit(trimmed[0]!)) {
        let cursor = 1;
        while (cursor < trimmed.length && isDigit(trimmed[cursor]!)) cursor++;
        const fromNotation = trimmed.substring(0, cursor);
        if (cursor < trimmed.length) {
          const start = cursor++;
          while (cursor < trimmed.length && isDigit(trimmed[cursor]!)) cursor++;
          const toNotation = trimmed.substring(start, cursor);
          const promotion = cursor < trimmed.length ? trimmed.substring(cursor) : null;
          const fromSquare = this.notationToSquareInFormat(fromNotation, format);
          const toSquare = this.notationToSquareInFormat(toNotation, format);
          for (let x = 0; x < count; x++) {
            const move = moves[x]!;
            if (fromSquare === move.fromSquare && toSquare === move.toSquare) {
              if (
                (move.moveType & MoveType.PromotionProperty) === 0 ||
                (promotion !== null &&
                  promotion.toLowerCase() ===
                    this.getPieceType(move.promotionType).notation[move.player]!.toLowerCase())
              ) {
                return move.toMovement();
              }
            }
          }
        }
      }
    }

    return null;
  }

  // *** ATTACK DETECTION *** //

  /**
   * Whether `square` is attacked by `player`. Walks every direction outward
   * from the square looking for an enemy piece that attacks back along it,
   * honouring screens (cannon-style) and path constraints (lame leapers).
   */
  isSquareAttacked(square: number, player: number): boolean {
    if (square < 0 || square >= this.board.numSquares || player < 0 || player > 1) {
      throw new Error('Game.isSquareAttacked called with an invalid argument');
    }

    for (let dir = 0; dir < this.nDirections; dir++) {
      const maxRange = this.maxAttackRange(player, this.oppositeDirection(dir));
      let steps = 1;
      let nextSquare = this.board.nextSquare(dir, square);
      let passedScreen = false;

      while (nextSquare >= 0 && steps <= maxRange) {
        const pieceOnSquare = this.board.pieceAt(nextSquare);
        if (pieceOnSquare !== null) {
          if (pieceOnSquare.player === player) {
            const inRange = this.simpleMoveGeneration
              ? pieceOnSquare.getAttackRange(this.oppositeDirection(dir)) >= steps
              : (!passedScreen &&
                  pieceOnSquare.getAttackRange(this.oppositeDirection(dir)) >= steps) ||
                (passedScreen &&
                  pieceOnSquare.getCannonAttackRange(this.oppositeDirection(dir)) >= steps);
            if (inRange) {
              // Find the relevant capability for path/conditional pieces.
              let move: MoveCapability | null = null;
              if (
                pieceOnSquare.pieceType.hasMovesWithPaths ||
                pieceOnSquare.pieceType.hasMovesWithConditionalLocation
              ) {
                const { moves, count } = pieceOnSquare.pieceType.getMoveCapabilities();
                for (let x = 0; x < count; x++) {
                  if (
                    this.playerDirection(player, moves[x]!.nDirection) ===
                    this.oppositeDirection(dir)
                  ) {
                    move = moves[x]!;
                    break;
                  }
                }
              }
              if (
                move !== null &&
                move.conditionalBySquare !== null &&
                !move.conditionalBySquare[player]!.isBitSet(nextSquare)
              ) {
                break;
              }
              if (!pieceOnSquare.pieceType.hasMovesWithPaths) return true;
              if (move === null || move.pathInfo === null) return true;
              // The piece has paths — at least one must be unobstructed.
              const pathOrigin = this.simpleMoveGeneration ? square : nextSquare;
              for (const stepDirs of move.pathInfo.pathNDirections) {
                let sq = pathOrigin;
                let blocked = false;
                for (const stepDir of stepDirs) {
                  sq = this.board.nextSquare(this.playerDirection(player, stepDir), sq);
                  if (!this.simpleMoveGeneration && sq === square) return true;
                  if (sq === NOT_CONNECTED || this.board.pieceAt(sq) !== null) {
                    blocked = true;
                    break;
                  }
                }
                if (!blocked) return true;
              }
            }
          }
          if (!this.simpleMoveGeneration && !passedScreen) {
            passedScreen = true;
            nextSquare = this.board.nextSquare(dir, nextSquare);
          } else {
            nextSquare = -1;
          }
        } else {
          nextSquare = this.board.nextSquare(dir, nextSquare);
        }
        steps++;
      }
    }

    for (const rule of this.rules) {
      if (rule.isSquareAttacked(square, player)) return true;
    }
    return false;
  }

  /**
   * Static-exchange evaluation, "greater than or equal" form: decides whether
   * the exchange initiated by the move from→to is worth at least `value`. The
   * algorithm follows Stockfish's SEE; it assumes a simple from-to move and is
   * only used in games where simple movement is in effect.
   */
  seeGe(from: number, to: number, value: number): boolean {
    let nextVictim = this.board.pieceAt(from)!;
    let side = nextVictim.player ^ 1;
    const target = this.board.pieceAt(to);
    let balance = target === null ? 0 : target.midgameValue;

    if (balance < value) return false;
    if (nextVictim.midgameValue === 0) return true; // royal
    balance -= nextVictim.midgameValue;
    if (balance >= value) return true;

    this.seeAttackers[0].length = 0;
    this.seeAttackers[1].length = 0;

    let dir = 0;
    for (; dir < this.nSlidingDirections; dir++) {
      let steps = 1;
      let nextSquare = this.board.nextSquare(dir, to);
      while (nextSquare >= 0) {
        const pieceOnSquare = this.board.pieceAt(nextSquare);
        if (pieceOnSquare !== null && nextSquare !== from) {
          if (pieceOnSquare.getAttackRange(this.oppositeDirection(dir)) >= steps) {
            this.seeAttackers[pieceOnSquare.player as 0 | 1].push(pieceOnSquare);
          }
          nextSquare = -1;
        } else {
          nextSquare = this.board.nextSquare(dir, nextSquare);
          steps++;
        }
      }
    }
    for (; dir < this.nDirections; dir++) {
      const nextSquare = this.board.nextSquare(dir, to);
      if (nextSquare >= 0) {
        const pieceOnSquare = this.board.pieceAt(nextSquare);
        if (pieceOnSquare !== null && nextSquare !== from) {
          if (pieceOnSquare.getAttackRange(this.oppositeDirection(dir)) >= 1) {
            this.seeAttackers[pieceOnSquare.player as 0 | 1].push(pieceOnSquare);
          }
        }
      }
    }

    let relativeSide = true; // true while the opponent is to move
    for (;;) {
      const attackers = this.seeAttackers[side as 0 | 1];
      if (attackers.length === 0) return relativeSide;

      // Find and remove the least valuable attacker.
      let victimIndex = 0;
      for (let x = 1; x < attackers.length; x++) {
        if (
          attackers[x]!.midgameValue < attackers[victimIndex]!.midgameValue &&
          attackers[x]!.midgameValue !== 0
        ) {
          victimIndex = x;
        }
      }
      nextVictim = attackers[victimIndex]!;
      attackers.splice(victimIndex, 1);

      if (nextVictim.midgameValue === 0) {
        return relativeSide === (this.seeAttackers[(side ^ 1) as 0 | 1].length !== 0);
      }

      balance += relativeSide ? nextVictim.midgameValue : -nextVictim.midgameValue;
      relativeSide = !relativeSide;
      if (relativeSide === balance >= value) return relativeSide;

      // Look behind this attacker for a newly uncovered one.
      dir = this.board.directionFromTo(to, nextVictim.square);
      if (dir >= 0 && dir < this.nSlidingDirections) {
        let steps = this.board.getDistance(to, nextVictim.square) + 1;
        let nextSquare = this.board.nextSquare(dir, nextVictim.square);
        while (nextSquare >= 0) {
          const pieceOnSquare = this.board.pieceAt(nextSquare);
          if (pieceOnSquare !== null) {
            if (pieceOnSquare.getAttackRange(this.oppositeDirection(dir)) >= steps) {
              this.seeAttackers[pieceOnSquare.player as 0 | 1].push(pieceOnSquare);
            }
            nextSquare = -1;
          } else {
            nextSquare = this.board.nextSquare(dir, nextSquare);
            steps++;
          }
        }
      }

      side ^= 1;
    }
  }

  // *** HELPERS *** //

  private requireFen(): FEN {
    if (this.fen === null) throw new Error('Game.fen used before the FEN format was set');
    return this.fen;
  }
}
