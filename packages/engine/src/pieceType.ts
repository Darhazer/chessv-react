/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/PieceType.cs
 *
 *  Note: the C# original's reflection-driven `AddMovesOf(Type)` is omitted —
 *  the web port hand-writes piece types, so move composition is done with the
 *  instance-based `addMovesOf(other)` overload only.
 ***************************************************************************/

import { Direction, SpecialAttacks } from './basics.js';
import type { Board } from './board.js';
import { MAX_DIRECTIONS } from './constants.js';
import { ExObject } from './exObject.js';
import { HashKeys } from './hashKeys.js';
import { MoveCapability } from './moveCapability.js';
import type { Game } from './game.js';
import type { MoveList } from './moveList.js';
import type { Piece } from './piece.js';

/** A piece type's custom move generator; returns false to suppress the default generation. */
export type CustomMoveGenerationHandler = (
  pieceType: PieceType,
  piece: Piece,
  moveList: MoveList,
  capturesOnly: boolean,
) => boolean;

/** Pluggable RNG used for piece-square-table variation; deterministic by default. */
let pstRandom: () => number = (() => {
  let state = 0x2545f4914f6cdd1d;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
})();

/** Override the RNG used when applying PST variations (e.g. for tests). */
export function setPstRandom(rng: () => number): void {
  pstRandom = rng;
}

const MAX_MOVE_CAPABILITIES = 32;

/**
 * Defines how a kind of piece moves, what it is worth, how it is notated and
 * how it contributes to evaluation. Piece types are data-driven: a list of
 * {@link MoveCapability} objects describes movement, so the engine needs no
 * hard-coded knowledge of any particular piece.
 */
export class PieceType extends ExObject {
  game: Game | null = null;
  board: Board | null = null;

  readonly internalName: string;
  name: string;
  /** Notation for [player 0, player 1]. */
  notation: [string, string] = ['', ''];
  /** Notation with any leading disambiguation underscore stripped, for display. */
  notationClean: [string, string] = ['', ''];
  imagePreferenceList: string[] = [];
  preferredImage: string | null;
  fallbackImage: string | null = null;

  /** True when every move is a plain slide/step (enables the fast generator). */
  simpleMoveGeneration = true;
  hasMovesWithPaths = false;
  hasMovesWithConditionalLocation = false;
  isPawn = false;
  enabled = true;

  /** Game-specific sequential type number. */
  typeNumber = 0;
  attackRangePerDirection: Int32Array = new Int32Array(MAX_DIRECTIONS);
  cannonAttackRangePerDirection: Int32Array = new Int32Array(MAX_DIRECTIONS);

  midgameValue: number;
  endgameValue: number;

  /** Whether the piece is colour-bound (its board splits into reachable "slices"). */
  isSliced = true;
  numSlices = 0;
  sliceLookup: Int32Array = new Int32Array(0);

  customMoveGenerator: CustomMoveGenerationHandler | null = null;

  // Piece-square-table tuning parameters.
  pstMidgameInSmallCenter = 3;
  pstMidgameInLargeCenter = 3;
  pstMidgameSmallCenterAttacks = 1;
  pstMidgameLargeCenterAttacks = 1;
  pstMidgameForwardness = 0;
  pstMidgameGlobalOffset = -15;
  pstEndgameInSmallCenter = 3;
  pstEndgameInLargeCenter = 3;
  pstEndgameSmallCenterAttacks = 1;
  pstEndgameLargeCenterAttacks = 1;
  pstEndgameForwardness = 0;
  pstEndgameGlobalOffset = -15;
  averageMobility = 0;
  averageDirectionsAttacked = 0;
  averageSafeChecks = 0;

  // Internal state.
  protected moveCapabilities: (MoveCapability | undefined)[] = new Array(MAX_MOVE_CAPABILITIES);
  protected nMoveCapabilities = 0;
  protected hashKeyIndex: Int32Array = new Int32Array(0);
  protected pawnHashKeyIndex: Int32Array = new Int32Array(0);
  protected materialHashKeyIndex: Int32Array[] = [];
  protected pstSmallCenterAttacks: Int32Array = new Int32Array(0);
  protected pstLargeCenterAttacks: Int32Array = new Int32Array(0);
  protected pstMidgame: Int32Array = new Int32Array(0);
  protected pstEndgame: Int32Array = new Int32Array(0);

  constructor(
    internalName: string,
    name: string,
    notation: string | null,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super();
    this.internalName = internalName;
    this.name = name;
    if (notation != null) this.setNotation(notation);
    this.imagePreferenceList.push(internalName);
    if (internalName !== name) this.imagePreferenceList.push(name);
    this.preferredImage = preferredImageName;
    this.midgameValue = midgameValue;
    this.endgameValue = endgameValue;
  }

  /** Number of move capabilities currently defined. */
  get numMoveCapabilities(): number {
    return this.nMoveCapabilities;
  }

  // *** INITIALIZATION *** //

  /** Bind the type to its game, resolve directions, slices, hashes and PST. */
  initialize(game: Game): void {
    this.game = game;
    this.board = game.board;

    if (this.preferredImage != null) this.imagePreferenceList.unshift(this.preferredImage);
    if (this.fallbackImage != null) this.imagePreferenceList.push(this.fallbackImage);

    this.typeNumber = game.getPieceTypeNumber(this);

    const gameDirections = game.getDirections();
    for (let x = 0; x < this.nMoveCapabilities; x++) {
      const move = this.moveCapabilities[x]!;
      move.initialize(game);
      // Resolve the direction number within the game's direction index.
      for (let y = 0; y < gameDirections.length; y++) {
        if (move.direction.equals(gameDirections[y]!)) {
          move.nDirection = y;
          break;
        }
      }
      // Resolve direction numbers for each step of each path.
      if (move.pathInfo != null) {
        this.simpleMoveGeneration = false;
        for (const dirPath of move.pathInfo.pathDirections) {
          const path: number[] = [];
          for (const dir of dirPath) {
            for (let y = 0; y < gameDirections.length; y++) {
              if (dir.equals(gameDirections[y]!)) {
                path.push(y);
                break;
              }
            }
          }
          move.pathInfo.pathNDirections.push(path);
        }
      }
      if (move.canCapture && this.attackRangePerDirection[move.nDirection]! < move.maxSteps) {
        this.attackRangePerDirection[move.nDirection] = move.maxSteps;
      }
      if (
        (move.specialAttacks & SpecialAttacks.CannonCapture) !== 0 &&
        this.cannonAttackRangePerDirection[move.nDirection]! < move.maxSteps
      ) {
        this.cannonAttackRangePerDirection[move.nDirection] = move.maxSteps;
      }
    }

    this.computeSlices();
    this.initializeHashKeys(game);
    this.initializePST(game.variation);
  }

  /** Partition the board into colour-bound "slices" reachable by this piece. */
  private computeSlices(): void {
    const board = this.requireBoard();
    this.numSlices = 0;
    this.sliceLookup = new Int32Array(board.numSquaresExtended);
    for (let square = 0; square < board.numSquaresExtended; square++) {
      this.sliceLookup[square] = this.isSliced
        ? square < board.numSquares
          ? -1
          : 0
        : 0;
    }
    for (let square = 0; square < board.numSquares; square++) {
      if (this.sliceLookup[square] === -1) {
        this.findSquare(square, this.numSlices++);
      }
    }
    if (this.numSlices === 0) this.numSlices = 1;
  }

  /** Allocate the Zobrist key ranges this type needs. */
  private initializeHashKeys(game: Game): void {
    const board = this.requireBoard();
    this.hashKeyIndex = new Int32Array(game.numPlayers);
    this.pawnHashKeyIndex = new Int32Array(game.numPlayers);
    this.materialHashKeyIndex = [];
    for (let player = 0; player < game.numPlayers; player++) {
      this.hashKeyIndex[player] = game.hashKeys.takeKeys(board.numSquaresExtended);
      this.pawnHashKeyIndex[player] = 0;
      const sliceKeys = new Int32Array(this.numSlices);
      for (let slice = 0; slice < this.numSlices; slice++) {
        sliceKeys[slice] = game.hashKeys.takeMaterialKeys(32);
      }
      this.materialHashKeyIndex[player] = sliceKeys;
    }
  }

  /** Build the midgame/endgame piece-square tables. */
  initializePST(variation: number): void {
    const board = this.requireBoard();
    const game = this.requireGame();

    let zInSmallM = this.pstMidgameInSmallCenter;
    let zInLargeM = this.pstMidgameInLargeCenter;
    let zSmallAttM = this.pstMidgameSmallCenterAttacks;
    let zLargeAttM = this.pstMidgameLargeCenterAttacks;
    let zForwardM = this.pstMidgameForwardness;
    let zOffsetM = this.pstMidgameGlobalOffset;
    let zInSmallE = this.pstEndgameInSmallCenter;
    let zInLargeE = this.pstEndgameInLargeCenter;
    let zSmallAttE = this.pstEndgameSmallCenterAttacks;
    let zLargeAttE = this.pstEndgameLargeCenterAttacks;
    let zForwardE = this.pstEndgameForwardness;
    let zOffsetE = this.pstEndgameGlobalOffset;

    if (variation > 0) {
      const tables: Record<number, number[]> = {
        1: [-1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        2: [-2, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2],
        3: [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2],
      };
      const adjustments = tables[variation] ?? new Array(16).fill(0);
      const pick = (): number => adjustments[Math.floor(pstRandom() * 16)] ?? 0;
      const adjustPair = (
        m: number,
        e: number,
        floor: number,
      ): [number, number] => {
        if (m === e) {
          const adj = pick();
          return [Math.max(m + adj, floor), Math.max(e + adj, floor)];
        }
        return [Math.max(m + pick(), floor), Math.max(e + pick(), floor)];
      };

      [zInSmallM, zInSmallE] = adjustPair(
        this.pstMidgameInSmallCenter,
        this.pstEndgameInSmallCenter,
        0,
      );
      [zInLargeM, zInLargeE] = adjustPair(
        this.pstMidgameInLargeCenter,
        this.pstEndgameInLargeCenter,
        0,
      );
      [zSmallAttM, zSmallAttE] = adjustPair(
        this.pstMidgameSmallCenterAttacks,
        this.pstEndgameSmallCenterAttacks,
        0,
      );
      [zLargeAttM, zLargeAttE] = adjustPair(
        this.pstMidgameLargeCenterAttacks,
        this.pstEndgameLargeCenterAttacks,
        0,
      );
      if (this.pstMidgameGlobalOffset === this.pstEndgameGlobalOffset) {
        const adj = pick();
        zOffsetM += adj;
        zOffsetE += adj;
      } else {
        zOffsetM += pick();
        zOffsetE += pick();
      }
      if (this.pstMidgameForwardness > 0 && this.pstEndgameForwardness > 0) {
        [zForwardM, zForwardE] = adjustPair(
          this.pstMidgameForwardness,
          this.pstEndgameForwardness,
          1,
        );
      }
    }

    // Centre-attack counts: how many central squares the piece can reach.
    this.pstSmallCenterAttacks = new Int32Array(board.numSquares);
    this.pstLargeCenterAttacks = new Int32Array(board.numSquares);
    const reachable = new Array<boolean>(board.numSquares).fill(false);
    for (let sq = 0; sq < board.numSquares; sq++) {
      reachable.fill(false);
      this.getEmptyBoardMobility(game, 0, sq, reachable);
      for (let y = 0; y < board.numSquares; y++) {
        if (reachable[y]) {
          this.pstSmallCenterAttacks[sq]! += board.inSmallCenter(y);
          this.pstLargeCenterAttacks[sq]! += board.inLargeCenter(y);
        }
      }
    }

    this.pstMidgame = new Int32Array(board.numSquaresExtended);
    this.pstEndgame = new Int32Array(board.numSquaresExtended);
    for (let sq = 0; sq < board.numSquares; sq++) {
      this.pstMidgame[sq] =
        zOffsetM +
        zInLargeM * board.inLargeCenter(sq) +
        zInSmallM * board.inSmallCenter(sq) +
        zLargeAttM * this.pstLargeCenterAttacks[sq]! +
        zSmallAttM * this.pstSmallCenterAttacks[sq]! +
        zForwardM * board.forwardness(sq);
      this.pstEndgame[sq] =
        zOffsetM +
        zInLargeE * board.inLargeCenter(sq) +
        zInSmallE * board.inSmallCenter(sq) +
        zLargeAttE * this.pstLargeCenterAttacks[sq]! +
        zSmallAttE * this.pstSmallCenterAttacks[sq]! +
        zForwardE * board.forwardness(sq);
    }
    for (let sq = board.numSquares; sq < board.numSquaresExtended; sq++) {
      this.pstMidgame[sq] = 50;
      this.pstEndgame[sq] = 0;
    }
  }

  /** Parse a notation string into the per-player notation pair. */
  setNotation(notation: string): void {
    const slash = notation.indexOf('/');
    if (slash > 0) {
      this.notation = [notation.substring(0, slash), notation.substring(slash + 1)];
    } else {
      this.notation = [notation.toUpperCase(), notation.toLowerCase()];
    }
    this.notationClean = [
      this.notation[0][0] === '_' ? this.notation[0].substring(1) : this.notation[0],
      this.notation[1][0] === '_' ? this.notation[1].substring(1) : this.notation[1],
    ];
  }

  // *** MOVE CAPABILITIES *** //

  /** The list of move capabilities and its used length. */
  getMoveCapabilities(): { moves: (MoveCapability | undefined)[]; count: number } {
    return { moves: this.moveCapabilities, count: this.nMoveCapabilities };
  }

  /** Find the move capability travelling in a given direction, if any. */
  findMove(dir: Direction): MoveCapability | null {
    for (let x = 0; x < this.nMoveCapabilities; x++) {
      if (this.moveCapabilities[x]!.direction.equals(dir)) return this.moveCapabilities[x]!;
    }
    return null;
  }

  private push(capability: MoveCapability): MoveCapability {
    this.moveCapabilities[this.nMoveCapabilities++] = capability;
    return capability;
  }

  step(direction: Direction): MoveCapability {
    return this.push(MoveCapability.step(direction));
  }

  slide(direction: Direction, maxSteps?: number): MoveCapability {
    return this.push(MoveCapability.slide(direction, maxSteps));
  }

  stepMoveOnly(direction: Direction): MoveCapability {
    return this.push(MoveCapability.stepMoveOnly(direction));
  }

  slideMoveOnly(direction: Direction): MoveCapability {
    return this.push(MoveCapability.slideMoveOnly(direction));
  }

  stepCaptureOnly(direction: Direction): MoveCapability {
    return this.push(MoveCapability.stepCaptureOnly(direction));
  }

  slideCaptureOnly(direction: Direction): MoveCapability {
    return this.push(MoveCapability.slideCaptureOnly(direction));
  }

  cannonMove(direction: Direction): MoveCapability {
    this.simpleMoveGeneration = false;
    return this.push(MoveCapability.cannonMove(direction));
  }

  rifleCapture(direction: Direction, maxSpaces: number): MoveCapability {
    this.simpleMoveGeneration = false;
    return this.push(MoveCapability.rifleCapture(direction, maxSpaces));
  }

  /** Add an existing move capability, tracking path/conditional flags. */
  addMoveCapability(moveCapability: MoveCapability): MoveCapability {
    if (moveCapability.pathInfo != null) this.hasMovesWithPaths = true;
    if (moveCapability.condition != null) this.hasMovesWithConditionalLocation = true;
    return this.push(moveCapability);
  }

  /** Copy all of another piece type's move capabilities into this one. */
  addMovesOf(other: PieceType): void {
    const { moves, count } = other.getMoveCapabilities();
    for (let x = 0; x < count; x++) this.addMoveCapability(moves[x]!);
  }

  /** Remove the move capability travelling in the given direction. */
  removeMoveCapability(direction: Direction): void {
    for (let x = 0; x < this.nMoveCapabilities; x++) {
      if (this.moveCapabilities[x]!.direction.equals(direction)) {
        for (let y = x; y < this.nMoveCapabilities - 1; y++) {
          this.moveCapabilities[y] = this.moveCapabilities[y + 1];
        }
        this.nMoveCapabilities--;
        break;
      }
    }
  }

  /** Discard every move capability. */
  resetMoveCapabilities(): void {
    this.nMoveCapabilities = 0;
    this.simpleMoveGeneration = true;
    this.hasMovesWithPaths = false;
    this.hasMovesWithConditionalLocation = false;
  }

  // *** OPERATIONS *** //

  /** Mark every square this piece could reach from `square` on an empty board. */
  getEmptyBoardMobility(game: Game, player: number, square: number, boardSquares: boolean[]): void {
    for (let x = 0; x < this.nMoveCapabilities; x++) {
      const move = this.moveCapabilities[x]!;
      if (
        !move.mustCapture &&
        (move.conditionalBySquare == null ||
          move.conditionalBySquare[player]!.isBitSet(square))
      ) {
        let steps = 1;
        let nextSquare = game.board.nextSquare(
          game.playerDirection(player, move.nDirection),
          square,
        );
        while (nextSquare >= 0 && steps <= move.maxSteps) {
          if (steps >= move.minSteps) boardSquares[nextSquare] = true;
          steps++;
          nextSquare = game.board.nextSquare(
            game.playerDirection(player, move.nDirection),
            nextSquare,
          );
        }
      }
    }
  }

  getMidgamePSTArray(): Int32Array {
    return this.pstMidgame;
  }

  getEndgamePSTArray(): Int32Array {
    return this.pstEndgame;
  }

  getMidgamePST(square: number): number {
    return this.pstMidgame[square] ?? 0;
  }

  getEndgamePST(square: number): number {
    return this.pstEndgame[square] ?? 0;
  }

  getHashKey(player: number, square: number): bigint {
    return HashKeys.Keys[this.hashKeyIndex[player]! + square]!;
  }

  getPawnHashKey(player: number, square: number): bigint {
    return HashKeys.Keys[this.pawnHashKeyIndex[player]! + square]!;
  }

  getMaterialHashKey(player: number, slice: number, nPieces: number): bigint {
    return HashKeys.Keys[this.materialHashKeyIndex[player]![slice]! + nPieces]!;
  }

  // *** HELPERS *** //

  /** Flood-fill the slice (colour-binding) a square belongs to. */
  private findSquare(square: number, slice: number, step?: number, move?: MoveCapability): void {
    const board = this.requireBoard();
    if (step !== undefined && move !== undefined) {
      // Continuing along a min-step move that has not yet become a capture.
      if (step >= move.minSteps && move.canCapture) {
        this.findSquare(square, slice);
      } else if (
        move.maxSteps <= step &&
        (move.conditionalBySquare == null || move.conditionalBySquare[0]!.isBitSet(square))
      ) {
        const nextSquare = board.nextSquare(move.nDirection, square);
        if (nextSquare >= 0 && this.sliceLookup[nextSquare] === -1) {
          this.findSquare(nextSquare, slice, step + 1, move);
        }
      }
      return;
    }

    this.sliceLookup[square] = slice;
    for (let x = 0; x < this.nMoveCapabilities; x++) {
      const capability = this.moveCapabilities[x]!;
      if (
        capability.conditionalBySquare == null ||
        capability.conditionalBySquare[0]!.isBitSet(square)
      ) {
        const nextSquare = board.nextSquare(capability.nDirection, square);
        if (nextSquare >= 0 && this.sliceLookup[nextSquare] === -1) {
          if (capability.minSteps > 1) {
            this.findSquare(nextSquare, slice, 1, capability);
          } else {
            this.findSquare(nextSquare, slice);
          }
        }
      }
    }
  }

  private requireGame(): Game {
    if (this.game === null) throw new Error('PieceType used before initialization');
    return this.game;
  }

  private requireBoard(): Board {
    if (this.board === null) throw new Error('PieceType used before initialization');
    return this.board;
  }
}
