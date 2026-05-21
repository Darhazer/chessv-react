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
import { INFINITY, MAX_GAME_LENGTH, MAX_PLY, ONEPLY } from './constants.js';
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
import { Evaluation } from './evaluation.js';
import { Hashtable } from './hashtable.js';
import { HashType } from './ttHashEntry.js';
import { Statistics } from './statistics.js';
import { TimeControl } from './timeControl.js';
import { PromotionRule } from './rule.js';
import type { Rule } from './rule.js';
import { createSearchStack, PV } from './searchTypes.js';
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
/** Node classification used by the alpha-beta search. */
export enum NodeType {
  PV,
  All,
  Cut,
}

/** Progress report emitted after each completed search iteration. */
export interface SearchInfo {
  /** Iteration depth, in plies. */
  depth: number;
  /** Score from the side-to-move's perspective, in centipawns. */
  score: number;
  /** Total nodes searched so far. */
  nodes: number;
  /** Nodes per second. */
  nps: number;
  /** Principal variation as SAN move strings. */
  pv: string[];
}

/** Shared sentinel for the search path's null-move ply — avoids per-call allocation. */
const NULL_MOVEMENT_MARKER = new Movement(0, 0, 0, MoveType.NullMove);

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

  // *** AI ENGINE (Search.cs / Evaluate.cs) *** //
  /** Game-specific evaluation terms applied on top of material + PST. */
  protected readonly evaluations: Evaluation[] = [];
  /** Reused [midgame, endgame] scratch passed to {@link Rule.adjustEvaluation}. */
  private readonly evalScratch: number[] = [0, 0];
  /** The transposition table; created lazily on the first search. */
  protected hashtable: Hashtable | null = null;
  /** Transposition-table size budget, in megabytes. */
  ttSizeInMB = 128;
  /** Deliberate play-weakening level (0 = full strength). */
  weakening = 0;
  /** Search statistics for the most recent / current search. */
  readonly statistics = new Statistics();
  /** Per-side evaluation sign (player 0 positive, player 1 negative). */
  protected readonly sign: readonly number[] = [1, -1];
  protected searchTimeControl: TimeControl | null = null;
  protected abortSearchFlag = false;
  protected idepth = 0;
  protected thinkStartTime = 0;
  protected maxSearchTime = -1;
  protected absoluteMaxSearchTime = -1;
  protected exactMaxTime = -1;
  protected weakeningHashShift = 12;
  protected readonly previousBestMoves = new Uint32Array(5);
  protected readonly razorMargin: readonly number[] = [300, 350, 400, 450, 450, 450, 450, 450];
  /** Optional callback invoked after each completed search iteration. */
  onSearchInfo: ((info: SearchInfo) => void) | null = null;

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
    for (let n = this.pieceTypes.length - 1; n >= 0; n--) {
      if (!this.pieceTypes[n]!.enabled) {
        this.disabledPieceTypes.push(this.pieceTypes[n]!);
        this.pieceTypes.splice(n, 1);
      }
    }
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
    for (const evaluation of this.evaluations) evaluation.initialize(this);
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
          const count = type.nMoveCapabilities;
          for (let y = 0; y < count; y++) {
            const move = type.moveCapabilities[y]!;
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
          const count = type.nMoveCapabilities;
          for (let n = 0; n < count; n++) {
            const move = type.moveCapabilities[n]!;
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

  /**
   * Substitute one registered piece type for another, in place. Used by
   * variants that inherit a piece (e.g. the Pawn) from a base class but need
   * a behaviourally different replacement.
   */
  replacePieceType(oldType: PieceType, newType: PieceType): PieceType {
    const index = this.pieceTypes.indexOf(oldType);
    if (index < 0) throw new Error('Game.replacePieceType - piece type not registered');
    this.pieceTypes[index] = newType;
    if (newType.name) this.setCustomProperty(newType.name, newType);
    return newType;
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
    const list = this.moveLists[1]!;
    return { moves: list.moves, count: list.count };
  }

  /** The root moves made by a specific piece. */
  getRootMovesForPiece(movingPiece: Piece): MoveInfo[] {
    const list = this.moveLists[1]!;
    const result: MoveInfo[] = [];
    for (let x = 0; x < list.count; x++) {
      if (list.moves[x]!.pieceMoved === movingPiece) result.push(list.moves[x]!);
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
  testForWinLossDraw(currentPlayer: number, ply: number = this.ply): MoveEventResponse {
    for (const rule of this.rules) {
      const response = rule.testForWinLossDraw(currentPlayer, ply);
      if (response !== MoveEventResponse.NotHandled) return response;
    }
    return MoveEventResponse.NotHandled;
  }

  /** Ask the rules for the result when the side to move has no legal moves. */
  noMovesResult(currentPlayer: number, ply: number = this.ply): MoveEventResponse {
    for (const rule of this.rules) {
      const response = rule.noMovesResult(currentPlayer, ply);
      if (response !== MoveEventResponse.NotHandled) return response;
    }
    throw new Error('No rule handled the NoMovesResult message');
  }

  /**
   * Map {@link testForWinLossDraw} to a search score, or null when the game
   * is still in progress. Centralises the response → score mapping used at
   * the head of every search routine.
   */
  private terminalScore(ply: number): number | null {
    const response = this.testForWinLossDraw(this.currentSide, ply);
    if (response === MoveEventResponse.NotHandled) return null;
    if (response === MoveEventResponse.GameDrawn) return 0;
    if (response === MoveEventResponse.GameWon) return INFINITY - ply;
    if (response === MoveEventResponse.GameLost) return -INFINITY + ply;
    return null;
  }

  /**
   * Score returned when the side to move has no legal moves. Mates always
   * score from the loser's perspective; stalemates are drawn.
   */
  private noMovesScore(ply: number): number {
    const result = this.noMovesResult(this.currentSide, ply);
    if (result === MoveEventResponse.GameWon) return INFINITY - ply;
    if (result === MoveEventResponse.GameLost) return -INFINITY + ply;
    return 0;
  }

  /**
   * Memoised Zobrist hash of the current position. `getPositionHashCode` is
   * called several times per search frame at the same (ply, board.hashCode)
   * — once to probe the TT and again to store the result — and each call
   * iterates every rule and XORs a fresh bigint. The cache holds the most
   * recent result keyed by (ply, board.hashCode). Both keys are needed:
   * the rules' contribution depends on ply, and the board's own hash on
   * the piece arrangement.
   */
  private cachedHashPly = -1;
  private cachedHashBoardKey = 0n;
  private cachedHashValue = 0n;

  /** The Zobrist hash of the current position at the given ply. */
  getPositionHashCode(ply: number): bigint {
    const boardHash = this.board.hashCode;
    if (ply === this.cachedHashPly && boardHash === this.cachedHashBoardKey) {
      return this.cachedHashValue;
    }
    let hash = boardHash;
    for (const rule of this.rules) hash ^= rule.getPositionHashCode(ply);
    this.cachedHashPly = ply;
    this.cachedHashBoardKey = boardHash;
    this.cachedHashValue = hash;
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
    // `move` lives in moveLists[1] and is reused on the next generation —
    // the clone keeps the history snapshot stable.
    this.gameHistory.push(move.clone());

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
    const list = this.moveLists[1]!;
    for (let x = 0; x < list.count; x++) {
      if (list.moves[x]!.hash === move.hash) {
        this.makeMove(list.moves[x]!, highlightMove);
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

  /** Every move played so far, in order. */
  getMoveHistory(): readonly MoveInfo[] {
    return this.gameHistory;
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

  /** Attach a game-specific evaluation term. Initialized during {@link initialize}. */
  addEvaluation(evaluation: Evaluation): void {
    this.evaluations.push(evaluation);
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
                const moves = pieceOnSquare.pieceType.moveCapabilities;
                const count = pieceOnSquare.pieceType.nMoveCapabilities;
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
      attackers[victimIndex] = attackers[attackers.length - 1]!;
      attackers.pop();

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

  // *** EVALUATION (Evaluate.cs) *** //

  /**
   * Statically evaluate the current position, in centipawns, from the side to
   * move's perspective: material + piece-square tables, adjusted by the
   * game-specific evaluations and rules, then interpolated between the midgame
   * and endgame according to the remaining material.
   */
  evaluate(): number {
    const scratch = this.evalScratch;
    scratch[0] = this.board.getMidgameMaterialEval(0) - this.board.getMidgameMaterialEval(1);
    scratch[1] = this.board.getEndgameMaterialEval(0) - this.board.getEndgameMaterialEval(1);

    for (const evaluation of this.evaluations) evaluation.adjustEvaluation(scratch);
    for (const rule of this.rules) rule.adjustEvaluation(this.ply, scratch);

    let midgameEval = scratch[0]!;
    let endgameEval = scratch[1]!;

    const materialEval = this.board.getPlayerMaterial(0) + this.board.getPlayerMaterial(1);
    const phase =
      materialEval >= this.midgameMaterialThreshold
        ? 128
        : materialEval <= this.endgameMaterialThreshold
          ? 0
          : Math.trunc(
              ((materialEval - this.endgameMaterialThreshold) * 128) /
                (this.midgameMaterialThreshold - this.endgameMaterialThreshold),
            );
    let evalScore = Math.trunc(
      (this.sign[this.currentSide]! * (midgameEval * phase + endgameEval * (128 - phase))) / 128,
    );
    // Round to the nearest 4 (quarter-pawn resolution).
    evalScore = ((evalScore & 2) << 1) + (evalScore & ~3);
    return evalScore;
  }

  // *** SEARCH (Search.cs) *** //

  /** Request that the current search stop as soon as possible. */
  abortSearch(): void {
    this.abortSearchFlag = true;
  }

  /**
   * Search the current position and return the best line for the side to move.
   * Ported from `Game.Think` — iterative deepening with aspiration windows.
   */
  think(timeControl: TimeControl): Movement[] {
    this.thinkStartTime = Date.now();
    this.searchTimeControl = timeControl;
    this.abortSearchFlag = false;

    // Reset killer, history, butterfly and countermove tables.
    this.killers1.fill(0);
    this.killers2.fill(0);
    for (let p = 0; p < this.numPlayers; p++) {
      for (let t = 0; t < this.nPieceTypes; t++) {
        this.historyCounters[p]![t]!.fill(0);
        this.butterflyCounters[p]![t]!.fill(1);
      }
    }
    for (const row of this.countermoves) row.fill(0);

    this.statistics.reset();
    this.statistics.searchStartTime = Date.now();

    if (this.hashtable === null) {
      this.hashtable = new Hashtable();
      this.hashtable.setSize(this.ttSizeInMB);
      this.weakeningHashShift = this.variation === 0 ? 12 : 13 + Math.floor(Math.random() * 12);
    }

    const pv = new PV();
    let pvScore = -INFINITY;
    this.searchStack[1]!.eval = this.evaluate();

    this.determineTimeAllocation(timeControl);

    let score = -INFINITY;
    let delta = -INFINITY;
    let scorePreviousIteration = -INFINITY;
    this.currentMaxHistoryScore = 1;

    let deepen = true;
    for (this.idepth = ONEPLY; deepen && !this.abortSearchFlag; this.idepth += ONEPLY) {
      let alpha = -INFINITY;
      let beta = INFINITY;
      if (this.idepth >= 5 * ONEPLY) {
        delta = 35;
        alpha = Math.max(pvScore - delta, -INFINITY);
        beta = Math.min(pvScore + delta, INFINITY);
      }

      for (;;) {
        score = this.searchRoot(alpha, beta, this.idepth);
        if (this.abortSearchFlag) break;
        if (score <= alpha) {
          beta = Math.trunc((alpha + beta) / 2);
          alpha = Math.max(score - delta, -INFINITY);
        } else if (score >= beta) {
          alpha = Math.trunc((alpha + beta) / 2);
          beta = Math.min(score + delta, INFINITY);
        } else {
          break;
        }
        delta += delta;
      }
      pvScore = score;

      if (!this.abortSearchFlag) {
        this.searchStack[1]!.pv.copyTo(pv);
        this.emitSearchInfo(this.idepth, score);
      } else {
        deepen = false;
      }

      // Track recent best moves for time-management heuristics.
      const depthIndex = this.idepth / ONEPLY;
      if (depthIndex <= 5) {
        this.previousBestMoves[depthIndex - 1] = pv.get(1);
      } else {
        for (let x = 0; x < 4; x++) this.previousBestMoves[x] = this.previousBestMoves[x + 1]!;
        this.previousBestMoves[4] = pv.get(1);
      }

      deepen = this.shouldDeepen(timeControl, score, scorePreviousIteration, pv);
      scorePreviousIteration = score;
    }

    this.hashtable.nextGeneration();

    // Collect the side-to-move's moves from the PV (usually exactly one).
    const moves: Movement[] = [];
    for (let x = 1; pv.get(x) !== 0 && Movement.playerFromHash(pv.get(x)) === this.currentSide; x++) {
      moves.push(Movement.fromHash(pv.get(x)));
    }
    return moves;
  }

  /** Compute the soft / hard time limits for this search. */
  protected determineTimeAllocation(timeControl: TimeControl): void {
    this.maxSearchTime = -1;
    this.absoluteMaxSearchTime = -1;
    this.exactMaxTime = -1;
    if (timeControl.timePerMove !== 0) {
      this.exactMaxTime = timeControl.timePerMove;
      return;
    }
    if (timeControl.movesLeft !== 0) {
      if (timeControl.movesLeft === 1) {
        this.maxSearchTime = Math.trunc(timeControl.activeTimeLeft / 2);
        this.absoluteMaxSearchTime = Math.min(
          Math.trunc(timeControl.activeTimeLeft / 2),
          timeControl.activeTimeLeft - 500,
        );
      } else {
        this.maxSearchTime = Math.trunc(
          timeControl.activeTimeLeft / Math.min(timeControl.movesLeft, 20),
        );
        this.absoluteMaxSearchTime = Math.min(
          Math.trunc((4 * timeControl.activeTimeLeft) / timeControl.movesLeft),
          Math.trunc(timeControl.activeTimeLeft / 3),
        );
      }
    } else if (timeControl.activeTimeLeft > 0) {
      const pieceCount =
        this.board.getPlayerPieceBitboard(0).bitCount +
        this.board.getPlayerPieceBitboard(1).bitCount;
      if (timeControl.timeIncrement > 0) {
        this.maxSearchTime =
          timeControl.timeIncrement +
          Math.trunc(
            timeControl.activeTimeLeft /
              Math.min(
                this.startingPieceCount[0]! + this.startingPieceCount[1]! - 24,
                pieceCount + 2,
              ),
          );
        this.absoluteMaxSearchTime = Math.max(
          Math.trunc(timeControl.activeTimeLeft / 6),
          timeControl.timeIncrement - 100,
        );
      } else {
        this.maxSearchTime = Math.trunc(
          timeControl.activeTimeLeft /
            Math.min(
              this.startingPieceCount[0]! + this.startingPieceCount[1]! - 10,
              pieceCount + 6,
            ),
        );
        this.absoluteMaxSearchTime = Math.trunc(timeControl.activeTimeLeft / 6);
      }
    }
  }

  /** Decide whether to run another iterative-deepening iteration. */
  protected shouldDeepen(
    timeControl: TimeControl,
    score: number,
    scorePreviousIteration: number,
    pv: PV,
  ): boolean {
    let deepen = this.idepth / ONEPLY < MAX_PLY - 1;
    if (!timeControl.infinite) {
      const timeUsed = Date.now() - this.thinkStartTime;
      if (this.exactMaxTime > 0) {
        if (timeUsed > (this.exactMaxTime * 2) / 3) deepen = false;
      } else if (this.maxSearchTime > 0 || this.absoluteMaxSearchTime > 0) {
        let aggressiveness = timeControl.timeIncrement > 0 ? 36 : 34;
        if (score < scorePreviousIteration - 150) {
          aggressiveness += 8;
        } else if (score > 150) {
          aggressiveness -= Math.min(Math.trunc((score - 150) / 10), 8);
        }
        let bestMove = pv.get(1);
        for (let x = Math.min(this.idepth / ONEPLY - 2, 3); x >= 0; x--) {
          if (this.previousBestMoves[x] !== bestMove) {
            aggressiveness = Math.trunc((aggressiveness * 6) / 5);
            bestMove = this.previousBestMoves[x]!;
          }
        }
        if (
          timeUsed > (this.maxSearchTime * aggressiveness) / 120 ||
          timeUsed > this.absoluteMaxSearchTime
        ) {
          deepen = false;
        }
      }
    }
    if (timeControl.plyLimit > 0 && deepen) {
      deepen = this.idepth < timeControl.plyLimit * ONEPLY;
    } else if (timeControl.nodeLimit > 0 && deepen) {
      deepen = this.statistics.nodes * 2 < timeControl.nodeLimit;
    }
    return deepen;
  }

  /** Build and emit a {@link SearchInfo} for a completed iteration. */
  protected emitSearchInfo(idepth: number, score: number): void {
    if (this.onSearchInfo === null) return;
    const elapsed = Math.max(Date.now() - this.thinkStartTime, 1);
    const pvLine: string[] = [];
    for (let x = 1; this.searchStack[1]!.pv.get(x) !== 0; x++) {
      pvLine.push(this.describeMoveHash(this.searchStack[1]!.pv.get(x)));
    }
    this.onSearchInfo({
      depth: idepth / ONEPLY,
      score,
      nodes: this.statistics.nodes,
      nps: Math.trunc((this.statistics.nodes * 1000) / elapsed),
      pv: pvLine,
    });
  }

  /** Coordinate notation for a packed move hash (used for PV display). */
  describeMoveHash(moveHash: number): string {
    const from = this.getSquareNotation(Movement.fromSquareFromHash(moveHash));
    const to = this.getSquareNotation(Movement.toSquareFromHash(moveHash));
    return from + to;
  }

  /** Search every root move; returns the best score. */
  searchRoot(alpha: number, beta: number, depth: number): number {
    let moveNumber = 0;
    let normalMoveCount = 0;
    const extension = this.getExtension(1);
    if (depth < ONEPLY) depth += extension;

    const nodesPerMove = new Map<number, number>();
    this.moveLists[1]!.restart(this.searchStack[1]!.pv.get(1));

    const movingSide = this.currentSide;
    while (!this.abortSearchFlag && this.moveLists[1]!.makeNextMove()) {
      this.statistics.nodes++;
      const currentMove = this.moveLists[1]!.currentMove;
      const startNodeCount = this.statistics.nodes;
      this.searchPath[1] = currentMove.toMovement();
      if ((currentMove.moveType & MoveType.CaptureProperty) === 0) normalMoveCount++;

      let score: number;
      if (moveNumber < 1) {
        score =
          this.currentSide !== movingSide
            ? -this.searchPV(-beta, -alpha, depth - ONEPLY, 2)
            : this.searchPV(alpha, beta, depth - ONEPLY, 2);
      } else {
        const reduction =
          depth >= 2 * ONEPLY &&
          moveNumber > 4 &&
          normalMoveCount > 1 &&
          currentMove.moveType === MoveType.StandardMove &&
          extension === 0
            ? Math.min(Math.trunc(Math.max(depth - 2, 0) / 4), Math.trunc(Math.max(moveNumber - 4, 0) / 3)) +
              Math.min(
                Math.trunc(Math.max(depth - 2, 0) / 5),
                Math.trunc((Math.max(moveNumber - 2, 0) * 2) / 3),
              ) +
              Math.trunc(moveNumber / 16)
            : 0;
        score =
          this.currentSide !== movingSide
            ? -this.search(-alpha, depth - ONEPLY - reduction, 2, true, NodeType.Cut)
            : this.search(beta, depth - ONEPLY - reduction, 2, true, NodeType.Cut);
        if (reduction > 0 && score > alpha) {
          score =
            this.currentSide !== movingSide
              ? -this.search(-alpha, depth - ONEPLY, 2, true, NodeType.Cut)
              : this.search(beta, depth - ONEPLY, 2, true, NodeType.Cut);
        }
        if (score > alpha) {
          score =
            this.currentSide !== movingSide
              ? -this.searchPV(-beta, -alpha, depth - ONEPLY, 2)
              : this.searchPV(alpha, beta, depth - ONEPLY, 2);
        }
      }
      this.moveLists[1]!.unmakeMove();
      if (this.abortSearchFlag) break;

      nodesPerMove.set(
        currentMove.hash,
        Math.trunc((this.statistics.nodes - startNodeCount) / depth),
      );
      if (score > alpha) {
        alpha = score;
        this.updatePV(1);
      }
      moveNumber++;
    }

    if (!this.abortSearchFlag && depth >= 3 * ONEPLY) {
      this.moveLists[1]!.reorderMoves(nodesPerMove);
    }
    return alpha;
  }

  /** Full-window (principal-variation) search. */
  searchPV(alpha: number, beta: number, depth: number, ply: number): number {
    const terminal = this.terminalScore(ply);
    if (terminal !== null) return terminal;
    if (this.statistics.nodes % 1024 === 0) {
      this.doBookkeeping();
      if (this.abortSearchFlag) return 0;
    }

    const extension = this.getExtension(ply);
    if (depth < ONEPLY || ply < this.idepth * 2) depth += extension;
    if (depth < ONEPLY) return this.qsearch(alpha, beta, 0, ply);

    this.searchStack[ply]!.pv.set(ply, 0);
    this.searchStack[ply + 1]!.pv.set(ply, 0);

    let hashtableMove = 0;
    const hash = this.hashtable!.lookup(this.getPositionHashCode(ply));
    if (hash !== null) {
      hashtableMove = hash.moveHash;
      if (hash.depth >= depth && hash.type === HashType.Exact) {
        if (hash.score >= beta) this.saveKillerHash(ply, hash.moveHash);
        return this.scoreFromHashtable(hash.score, ply);
      }
    }

    const evalScore = this.evaluate();
    this.searchStack[ply]!.eval = evalScore;
    if (depth === MAX_PLY - 1) return evalScore;

    const improving = ply < 3 || this.searchStack[ply]!.eval > this.searchStack[ply - 2]!.eval;
    if (
      depth < 4 * ONEPLY &&
      evalScore < INFINITY - MAX_PLY &&
      evalScore - this.futilityMargin(depth, improving) >= beta
    ) {
      return evalScore;
    }

    if (
      Movement.moveTypeFromHash(hashtableMove) === MoveType.Invalid &&
      depth >= 5 * ONEPLY &&
      extension === 0
    ) {
      this.searchPV(alpha, beta, depth - 2 * ONEPLY, ply);
      hashtableMove = this.searchStack[ply]!.pv.get(ply);
    }

    this.ply = ply;
    this.generateMoves(this.currentSide, ply, hashtableMove);

    let score = -INFINITY;
    let bestScore = -INFINITY;
    let moveNumber = 0;
    let normalMoveCount = 0;
    const movingSide = this.currentSide;
    while (alpha < beta && this.moveLists[ply]!.makeNextMove()) {
      this.statistics.nodes++;
      const currentMove = this.moveLists[ply]!.currentMove;
      if (this.weakening > 0 && this.weakeningBlind()) {
        this.moveLists[ply]!.unmakeMove();
        continue;
      }
      this.searchPath[ply] = currentMove.toMovement();
      if (currentMove.moveType === MoveType.StandardMove) normalMoveCount++;

      if (moveNumber === 0) {
        score =
          this.currentSide !== movingSide
            ? -this.searchPV(-beta, -alpha, depth - ONEPLY, ply + 1)
            : this.searchPV(alpha, beta, depth - ONEPLY, ply + 1);
        this.moveLists[ply]!.unmakeMove();
      } else {
        const reduce =
          depth >= 2 * ONEPLY &&
          moveNumber > 5 &&
          normalMoveCount > 1 &&
          currentMove.moveType === MoveType.StandardMove &&
          extension === 0 &&
          currentMove.hash !==
            this.countermoves[this.searchPath[ply - 1]!.fromSquare]![
              this.searchPath[ply - 1]!.toSquare
            ];
        let reduction = reduce ? this.lateMoveReduction(depth, moveNumber) : 0;
        reduction = this.adjustReductionForHistory(reduction, currentMove);
        if (reduction > 0 && this.weakening > 0) {
          reduction += Math.min(Math.trunc((moveNumber - 3) / 4), Math.trunc(this.weakening / 4) + 1);
        }
        const reducedDepth =
          reduction > 0 ? Math.max(depth - ONEPLY - reduction, ONEPLY) : depth - ONEPLY;
        const actualReduction = depth - ONEPLY - reducedDepth;

        score =
          this.currentSide !== movingSide
            ? -this.search(-alpha, reducedDepth, ply + 1, true, NodeType.Cut)
            : this.search(beta, reducedDepth, ply + 1, true, NodeType.Cut);
        if (actualReduction > 0 && score > alpha) {
          score =
            this.currentSide !== movingSide
              ? -this.search(-alpha, depth - ONEPLY, ply + 1, true, NodeType.Cut)
              : this.search(beta, depth - ONEPLY, ply + 1, true, NodeType.Cut);
        }
        if (score > alpha && score < beta) {
          score =
            this.currentSide !== movingSide
              ? -this.searchPV(-beta, -alpha, depth - ONEPLY, ply + 1)
              : this.searchPV(alpha, beta, depth - ONEPLY, ply + 1);
        }
        this.moveLists[ply]!.unmakeMove();
      }
      if (this.abortSearchFlag) return 0;

      if (score > bestScore) {
        bestScore = score;
        if (score > alpha) {
          alpha = score;
          this.updatePV(ply);
          if (score >= beta) {
            this.saveKillerMove(ply, currentMove);
            if (depth > 2 * ONEPLY) this.updateHistoryCountersMove(depth, currentMove);
            if (ply > 1) {
              this.countermoves[this.searchPath[ply - 1]!.fromSquare]![
                this.searchPath[ply - 1]!.toSquare
              ] = currentMove.hash;
            }
          }
        }
      }
      moveNumber++;
    }

    if (moveNumber === 0) return this.noMovesScore(ply);

    const positionHash = this.getPositionHashCode(ply);
    if (bestScore < alpha) {
      this.hashtable!.store(positionHash, this.scoreToHashtable(bestScore, ply), depth, 0, HashType.UpperBound);
    } else if (bestScore >= beta) {
      this.hashtable!.store(
        positionHash,
        this.scoreToHashtable(bestScore, ply),
        depth,
        this.searchStack[ply]!.pv.get(ply),
        HashType.LowerBound,
      );
    } else {
      this.hashtable!.store(
        positionHash,
        this.scoreToHashtable(bestScore, ply),
        depth,
        this.searchStack[ply]!.pv.get(ply),
        HashType.Exact,
      );
    }
    return bestScore;
  }

  /** Zero-window (scout) search. */
  search(
    beta: number,
    depth: number,
    ply: number,
    tryNullMove: boolean,
    nodeType: NodeType,
  ): number {
    const terminal = this.terminalScore(ply);
    if (terminal !== null) return terminal;
    if (this.statistics.nodes % 1024 === 0) {
      this.doBookkeeping();
      if (this.abortSearchFlag) return 0;
    }

    let extension = 0;
    if (depth < ONEPLY || ply < this.idepth * 2) {
      extension = this.getExtension(ply);
      depth += extension;
    }
    if (depth < ONEPLY) return this.qsearch(beta - 1, beta, 0, ply);

    this.searchStack[ply]!.pv.set(ply, 0);
    this.searchStack[ply + 1]!.pv.set(ply, 0);

    let hashtableMove = 0;
    const hash = this.hashtable!.lookup(this.getPositionHashCode(ply));
    if (hash !== null) {
      hashtableMove = hash.moveHash;
      if (
        (hash.depth >= depth ||
          hash.score >= Math.max(INFINITY - 100, beta) ||
          hash.score < Math.min(-INFINITY + 100, beta)) &&
        ((hash.type === HashType.LowerBound && hash.score >= beta) ||
          (hash.type === HashType.UpperBound && hash.score < beta) ||
          hash.type === HashType.Exact)
      ) {
        if (hash.score >= beta) {
          this.saveKillerHash(ply, hash.moveHash);
          if (depth > 2 * ONEPLY) this.updateHistoryCountersHash(depth, hash.moveHash);
          if (ply > 1) {
            this.countermoves[this.searchPath[ply - 1]!.fromSquare]![
              this.searchPath[ply - 1]!.toSquare
            ] = hash.moveHash;
          }
          this.updatePV(ply);
        }
        return this.scoreFromHashtable(hash.score, ply);
      }
    }

    const evalScore = this.evaluate();
    this.searchStack[ply]!.eval = evalScore;
    if (depth === MAX_PLY - 1) return evalScore;

    // Razoring.
    if (
      depth < 3 * ONEPLY + Math.trunc(this.weakening / 5) &&
      extension === 0 &&
      evalScore +
        this.razorMargin[Math.trunc(depth / ONEPLY)]! -
        Math.trunc(this.weakening / 3) * (24 - depth * 2) <=
        beta - 1
    ) {
      if (depth <= ONEPLY) return this.qsearch(beta - 1, beta, 0, ply);
      const rAlpha = beta - this.razorMargin[Math.trunc(depth / ONEPLY)]! - 1;
      const val = this.qsearch(rAlpha, rAlpha + 1, 0, ply);
      if (val <= rAlpha) return val;
    }

    // Child-node futility pruning.
    const improving = ply < 3 || this.searchStack[ply]!.eval > this.searchStack[ply - 2]!.eval;
    if (
      depth < 4 * ONEPLY &&
      evalScore < INFINITY - MAX_PLY &&
      evalScore - this.futilityMargin(depth, improving) >= beta
    ) {
      return evalScore;
    }

    // Null-move pruning.
    let nullMoveMatesUs = false;
    const canNull =
      tryNullMove &&
      extension === 0 &&
      this.board.getPlayerPieceBitboard(0).bitCount >= 2 &&
      this.board.getPlayerPieceBitboard(1).bitCount >= 2 &&
      this.board.getPlayerPieceBitboard(0).bitCount +
        this.board.getPlayerPieceBitboard(1).bitCount >=
        5 &&
      beta < INFINITY - 100 &&
      beta > -INFINITY + 100;
    const nullReduction = (depth / ONEPLY >= 7 ? 3 : 2) * ONEPLY;
    if (
      canNull &&
      depth >= nullReduction + ONEPLY + ONEPLY &&
      this.board.getMidgameMaterialEvalTotal() + (nodeType === NodeType.All ? 350 : 500) > beta
    ) {
      const nullMoveSide = this.currentSide;
      this.moveLists[ply]!.makeNullMove();
      this.searchPath[ply] = NULL_MOVEMENT_MARKER;
      const nullScore =
        this.currentSide !== nullMoveSide
          ? -this.search(-(beta - 1), depth - ONEPLY - nullReduction, ply + 1, false, nodeType)
          : this.search(beta, depth - ONEPLY - nullReduction, ply + 1, false, nodeType);
      this.moveLists[ply]!.unmakeNullMove();
      if (nullScore >= beta) {
        return nullScore > INFINITY - MAX_PLY ? beta : nullScore;
      }
      if (nullScore < -INFINITY + MAX_PLY) nullMoveMatesUs = true;
    }

    this.ply = ply;
    this.generateMoves(this.currentSide, ply, hashtableMove);

    let score = -INFINITY;
    let bestScore = -INFINITY;
    let moveNumber = 0;
    let normalMoveCount = 0;
    const pruningEligible =
      depth - ONEPLY < 3 * ONEPLY &&
      this.board.getEndgameMaterialEval(this.currentSide) >= 375 &&
      extension === 0;
    const movingSide = this.currentSide;

    while (score < beta && this.moveLists[ply]!.makeNextMove()) {
      this.statistics.nodes++;
      const currentMove = this.moveLists[ply]!.currentMove;
      if (this.weakening > 0 && this.weakeningBlind()) {
        this.moveLists[ply]!.unmakeMove();
        continue;
      }
      this.searchPath[ply] = currentMove.toMovement();
      if (currentMove.moveType === MoveType.StandardMove) normalMoveCount++;

      // Pruning.
      if (pruningEligible) {
        let prune = false;
        if (
          moveNumber > 1 &&
          currentMove.moveType === MoveType.StandardMove &&
          evalScore +
            this.board.calculateStandardMovePST(currentMove.fromSquare, currentMove.toSquare) +
            (depth < 2 * ONEPLY ? (currentMove.pieceMoved!.pieceType.isPawn ? 50 : 30) : 200) <
            beta
        ) {
          const newEval = depth < 2 * ONEPLY ? this.evaluate() : beta - 1;
          if (newEval < beta && this.canPruneMove(currentMove)) prune = true;
        }
        if (
          !prune &&
          depth < 3 * ONEPLY &&
          moveNumber > (depth < 2 * ONEPLY ? 14 : 18) + (improving ? 3 : 0) &&
          currentMove.moveType === MoveType.StandardMove
        ) {
          prune = true;
        }
        if (prune && this.canPruneMove(currentMove) && this.getExtension(ply + 1) === 0) {
          this.moveLists[ply]!.unmakeMove();
          continue;
        }
      }

      // Late move reductions.
      const reduce =
        depth >= 2 * ONEPLY &&
        moveNumber > 4 &&
        normalMoveCount > 1 &&
        currentMove.moveType === MoveType.StandardMove &&
        !nullMoveMatesUs &&
        extension === 0 &&
        currentMove.hash !==
          this.countermoves[this.searchPath[ply - 1]!.fromSquare]![
            this.searchPath[ply - 1]!.toSquare
          ];
      let reduction = !reduce
        ? 0
        : Math.min(Math.trunc(Math.max(depth - 2, 0) / 3), Math.trunc(Math.max(moveNumber - 2, 0) / 3)) +
          Math.min(
            Math.trunc(Math.max(depth - 2, 0) / 5),
            Math.trunc((Math.max(moveNumber - 2, 0) * 2) / 3),
          ) +
          Math.trunc(moveNumber / 16) +
          (nodeType === NodeType.Cut ? 2 : 0) +
          (improving ? 0 : 1);
      reduction = this.adjustReductionForHistory(reduction, currentMove);
      if (reduction > 0 && this.weakening > 0) {
        reduction += Math.min(Math.trunc((moveNumber - 3) / 4), Math.trunc(this.weakening / 4) + 1);
      }
      const reducedDepth =
        reduction > 0 ? Math.max(depth - ONEPLY - reduction, ONEPLY) : depth - ONEPLY;
      const actualReduction = depth - ONEPLY - reducedDepth;

      const childType = nodeType === NodeType.Cut ? NodeType.All : NodeType.Cut;
      score =
        this.currentSide !== movingSide
          ? -this.search(-(beta - 1), reducedDepth, ply + 1, true, childType)
          : this.search(beta, reducedDepth, ply + 1, true, childType);
      if (actualReduction > 0 && score >= beta) {
        score =
          this.currentSide !== movingSide
            ? -this.search(-(beta - 1), depth - ONEPLY, ply + 1, true, childType)
            : this.search(beta, depth - ONEPLY, ply + 1, true, childType);
      }
      if (
        currentMove.moveType === MoveType.StandardMove &&
        depth > 2 * ONEPLY &&
        score < beta &&
        nodeType === NodeType.Cut
      ) {
        const p = currentMove.player;
        const t = currentMove.pieceMoved!.typeNumber;
        this.butterflyCounters[p]![t]![currentMove.toSquare]! += Math.trunc(depth / ONEPLY);
      }
      this.moveLists[ply]!.unmakeMove();
      if (this.abortSearchFlag) return 0;

      if (score > bestScore) {
        bestScore = score;
        const positionHash = this.getPositionHashCode(ply);
        if (score >= beta) {
          this.saveKillerMove(ply, currentMove);
          if (depth > 2 * ONEPLY) this.updateHistoryCountersMove(depth, currentMove);
          if (ply > 1) {
            this.countermoves[this.searchPath[ply - 1]!.fromSquare]![
              this.searchPath[ply - 1]!.toSquare
            ] = currentMove.hash;
          }
          this.updatePV(ply);
          this.hashtable!.store(
            positionHash,
            this.scoreToHashtable(score, ply),
            depth,
            currentMove.hash,
            HashType.LowerBound,
          );
        } else {
          this.hashtable!.store(
            positionHash,
            this.scoreToHashtable(score, ply),
            depth,
            0,
            HashType.UpperBound,
          );
        }
      }
      moveNumber++;
    }

    if (moveNumber === 0) return this.noMovesScore(ply);
    return bestScore;
  }

  /** Quiescence search — extends the search through captures only. */
  qsearch(
    alpha: number,
    beta: number,
    depth: number,
    ply: number,
    recaptureSquare = -1,
  ): number {
    const terminal = this.terminalScore(ply);
    if (terminal !== null) return terminal;

    this.searchStack[ply]!.pv.set(ply, 0);
    this.searchStack[ply + 1]!.pv.set(ply, 0);

    const hash = this.hashtable!.lookup(this.getPositionHashCode(ply));
    if (hash !== null) {
      if (
        (hash.type === HashType.LowerBound && hash.score >= beta) ||
        (hash.type === HashType.UpperBound && hash.score < beta)
      ) {
        return this.scoreFromHashtable(hash.score, ply);
      }
    }

    if (this.statistics.nodes % 4096 === 0) {
      this.doBookkeeping();
      if (this.abortSearchFlag) return 0;
    }

    const pvNode = alpha !== beta - 1;
    const inCheck = this.getExtension(ply) > 0;
    const oldAlpha = alpha;
    let evalScore = this.evaluate();
    // Allow a stand-pat even in check after 8 plies of q-search, to bound the
    // tree in variants where checks proliferate.
    if (inCheck && depth < -8 * ONEPLY) evalScore = -INFINITY;
    let score = evalScore;

    if (depth === MAX_PLY - 1) return score;
    if (score >= beta) return score;

    let bestScore = score;
    if (bestScore > alpha) alpha = bestScore;

    this.ply = ply;
    this.generateMoves(this.currentSide, ply, 0, !inCheck);

    const movingSide = this.currentSide;
    while (
      alpha < beta &&
      this.moveLists[ply]!.makeNextMove(inCheck ? 0 : alpha - evalScore - 50)
    ) {
      this.statistics.nodes++;
      this.statistics.qNodes++;
      const currentMove = this.moveLists[ply]!.currentMove;

      if (!inCheck && depth < -4 * ONEPLY && currentMove.toSquare !== recaptureSquare) {
        this.moveLists[ply]!.unmakeMove();
        continue;
      }
      if (this.weakening > 0 && this.weakeningBlind()) {
        this.moveLists[ply]!.unmakeMove();
        continue;
      }
      this.searchPath[ply] = currentMove.toMovement();

      score =
        this.currentSide !== movingSide
          ? -this.qsearch(-beta, -alpha, depth - ONEPLY, ply + 1, currentMove.toSquare)
          : this.qsearch(alpha, beta, depth - ONEPLY, ply + 1, currentMove.toSquare);
      this.moveLists[ply]!.unmakeMove();
      if (this.abortSearchFlag) return 0;

      if (score > bestScore) {
        bestScore = score;
        if (score > alpha) {
          alpha = score;
          if (pvNode) this.updatePV(ply);
        }
      }
    }

    if (inCheck && bestScore === -INFINITY) return -INFINITY + ply;

    if (alpha - beta !== 1) {
      const positionHash = this.getPositionHashCode(ply);
      if (bestScore < beta) {
        if (bestScore > evalScore) {
          this.hashtable!.store(
            positionHash,
            this.scoreToHashtable(score, ply),
            0,
            0,
            pvNode && bestScore > oldAlpha ? HashType.Exact : HashType.UpperBound,
          );
        }
      } else {
        this.hashtable!.store(
          positionHash,
          this.scoreToHashtable(score, ply),
          0,
          0,
          HashType.LowerBound,
        );
      }
    }
    return bestScore;
  }

  // *** SEARCH HELPERS *** //

  /** True if Weakening should make the engine "blind" to the current move. */
  protected weakeningBlind(): boolean {
    const bits = Number((this.board.hashCode >> BigInt(this.weakeningHashShift)) & 0xffn);
    return bits < this.weakening * 2;
  }

  /** Base late-move reduction amount for a given depth and move number. */
  protected lateMoveReduction(depth: number, moveNumber: number): number {
    return (
      Math.min(Math.trunc(Math.max(depth - 2, 0) / 4), Math.trunc(Math.max(moveNumber - 4, 0) / 3)) +
      Math.min(
        Math.trunc(Math.max(depth - 2, 0) / 5),
        Math.trunc((Math.max(moveNumber - 2, 0) * 2) / 3),
      ) +
      Math.trunc(moveNumber / 16)
    );
  }

  /** Reduce the reduction for moves with a good history score. */
  protected adjustReductionForHistory(reduction: number, move: MoveInfo): number {
    if (reduction <= 0 || move.pieceMoved === null) return reduction;
    const p = move.player;
    const t = move.pieceMoved.typeNumber;
    const history = Math.trunc(
      this.historyCounters[p]![t]![move.toSquare]! /
        Math.max(this.butterflyCounters[p]![t]![move.toSquare]!, 1),
    );
    if (history > 0) {
      reduction--;
      if (history > this.currentMaxHistoryScore / (this.idepth / ONEPLY)) reduction = 0;
    }
    return reduction;
  }

  /** Whether this variant permits pruning the given move. Override as needed. */
  canPruneMove(_move: MoveInfo): boolean {
    return true;
  }

  protected scoreFromHashtable(score: number, ply: number): number {
    if (score >= INFINITY - MAX_PLY) return score - ply;
    if (score <= -INFINITY + MAX_PLY) return score + ply;
    return score;
  }

  protected scoreToHashtable(score: number, ply: number): number {
    if (score >= INFINITY - MAX_PLY) return score + ply;
    if (score <= -INFINITY + MAX_PLY) return score - ply;
    return score;
  }

  /** Sum the rules' positional search extensions, capped at one ply. */
  protected getExtension(ply: number): number {
    let extension = 0;
    for (const rule of this.rules) {
      extension += rule.positionalSearchExtension(this.currentSide, ply);
    }
    return extension > ONEPLY ? ONEPLY : extension;
  }

  protected saveKillerMove(ply: number, move: MoveInfo): void {
    if (move.moveType === MoveType.StandardMove && move.hash !== this.killers1[ply]) {
      this.killers2[ply] = this.killers1[ply]!;
      this.killers1[ply] = move.hash;
    }
  }

  protected saveKillerHash(ply: number, moveHash: number): void {
    if (
      Movement.moveTypeFromHash(moveHash) === MoveType.StandardMove &&
      moveHash !== this.killers1[ply]
    ) {
      this.killers2[ply] = this.killers1[ply]!;
      this.killers1[ply] = moveHash;
    }
  }

  protected updateHistoryCountersMove(depth: number, move: MoveInfo): void {
    if (move.moveType !== MoveType.StandardMove || move.pieceMoved === null) return;
    const p = move.pieceMoved.player;
    const t = move.pieceMoved.typeNumber;
    const d = Math.trunc(depth / ONEPLY);
    this.historyCounters[p]![t]![move.toSquare]! += (d + 2) * (d + 1);
    this.currentMaxHistoryScore = Math.max(
      this.currentMaxHistoryScore,
      Math.trunc(this.historyCounters[p]![t]![move.toSquare]! / this.butterflyCounters[p]![t]![move.toSquare]!),
    );
  }

  protected updateHistoryCountersHash(depth: number, moveHash: number): void {
    if (Movement.moveTypeFromHash(moveHash) !== MoveType.StandardMove) return;
    const player = Movement.playerFromHash(moveHash);
    const piece = this.board.pieceAt(Movement.fromSquareFromHash(moveHash));
    if (piece === null) return;
    const t = piece.typeNumber;
    const toSquare = Movement.toSquareFromHash(moveHash);
    const d = Math.trunc(depth / ONEPLY);
    this.historyCounters[player]![t]![toSquare]! += (d + 2) * (d + 1);
    this.currentMaxHistoryScore = Math.max(
      this.currentMaxHistoryScore,
      Math.trunc(this.historyCounters[player]![t]![toSquare]! / this.butterflyCounters[player]![t]![toSquare]!),
    );
  }

  protected futilityMargin(depth: number, improving: boolean): number {
    return improving
      ? Math.trunc((75 * depth) / ONEPLY)
      : Math.trunc((125 * depth) / ONEPLY);
  }

  /** Copy the child PV onto this ply's PV, prefixed by the current move. */
  protected updatePV(ply: number): void {
    this.searchStack[ply]!.pv.set(ply, this.moveLists[ply]!.currentMove.hash);
    let p = ply + 1;
    for (; this.searchStack[ply + 1]!.pv.get(p) !== 0; p++) {
      this.searchStack[ply]!.pv.set(p, this.searchStack[ply + 1]!.pv.get(p));
    }
    this.searchStack[ply]!.pv.set(p, this.searchStack[ply + 1]!.pv.get(p));
  }

  /** Periodic time / node-limit check during the search. */
  protected doBookkeeping(): void {
    const tc = this.searchTimeControl;
    if (tc === null || tc.infinite) return;
    const timeUsed = Date.now() - this.thinkStartTime;
    if (
      (this.absoluteMaxSearchTime > 0 && timeUsed > this.absoluteMaxSearchTime) ||
      (this.exactMaxTime > 0 && timeUsed > this.exactMaxTime) ||
      (tc.nodeLimit > 0 && this.statistics.nodes > tc.nodeLimit)
    ) {
      this.abortSearchFlag = true;
    }
  }

  /** Format a search score for display (`M5`, `-M3`, or a pawn count). */
  formatScoreForDisplay(score: number): string {
    if (score > INFINITY - MAX_PLY) {
      if (score === INFINITY - 2) return 'Mate';
      return `M${Math.trunc((INFINITY - (score + 2)) / 2)}`;
    }
    if (score < -INFINITY + MAX_PLY) {
      return `-M${Math.trunc((INFINITY + (score - 1)) / 2)}`;
    }
    return (score / 100).toFixed(2);
  }

  // *** HELPERS *** //

  private requireFen(): FEN {
    if (this.fen === null) throw new Error('Game.fen used before the FEN format was set');
    return this.fen;
  }
}
