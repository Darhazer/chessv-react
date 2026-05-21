/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/MoveList.cs
 ***************************************************************************/

import { MoveType, moveTypeHasProperty } from './basics.js';
import type { Drop, Pickup } from './basics.js';
import type { Board } from './board.js';
import type { Game } from './game.js';
import { MoveInfo } from './moveInfo.js';
import type { Piece } from './piece.js';
import type { PieceType } from './pieceType.js';
import type { SearchStack } from './searchTypes.js';

/** History / butterfly counters, indexed `[player][typeNumber][square]`. */
export type Counter3D = Uint32Array[][];

/** The maximum number of moves a single position may generate. */
export const MAX_MOVES = 256;

/**
 * The generated moves for one position, together with the machinery to make
 * and unmake them and to order them for the search.
 *
 * Move execution is expressed as a sequence of "pickups" (pieces lifted off
 * squares) and "drops" (pieces placed onto squares); this uniform model lets
 * one routine make any move, however exotic — castling, en passant, drops.
 */
export class MoveList {
  readonly board: Board;
  readonly game: Game;
  /** When true, every added move is verified legal (illegal ones are dropped). */
  legalMovesOnly = false;

  /** Backing buffer of generated moves; only `[0, count)` are valid. */
  readonly moves: MoveInfo[];
  private moveCursor = 0;
  private readonly pickups: Pickup[];
  private pickupCursor = 0;
  private readonly drops: Drop[];
  private dropCursor = 0;
  private readonly moveOrder: Int32Array;
  private currentMoveIndex = 0;

  private readonly searchStack: SearchStack[];
  private readonly killers1: Uint32Array;
  private readonly killers2: Uint32Array;
  private readonly historyCounters: Counter3D;
  private readonly butterflyCounters: Counter3D;
  private readonly ply: number;
  private hashtableMoveHash = 0;
  private countermove = 0;
  private tempPickupCursor = 0;
  private tempDropCursor = 0;
  private triedMovesCursor = -1;

  /** Shared null-move descriptors, one per side. */
  private static nullMoves: [MoveInfo, MoveInfo] | null = null;

  constructor(
    board: Board,
    searchStack: SearchStack[],
    killers1: Uint32Array,
    killers2: Uint32Array,
    historyCounters: Counter3D,
    butterflyCounters: Counter3D,
    ply: number,
  ) {
    if (MoveList.nullMoves === null) {
      const n0 = new MoveInfo();
      n0.moveType = MoveType.NullMove;
      n0.player = 0;
      const n1 = new MoveInfo();
      n1.moveType = MoveType.NullMove;
      n1.player = 1;
      MoveList.nullMoves = [n0, n1];
    }

    if (board.game === null) throw new Error('MoveList created for a board with no game');
    this.board = board;
    this.game = board.game;
    this.moves = Array.from({ length: MAX_MOVES }, () => new MoveInfo());
    this.pickups = Array.from({ length: MAX_MOVES }, () => ({ piece: null, square: 0 }));
    this.drops = Array.from({ length: MAX_MOVES }, () => ({
      piece: null as unknown as Piece,
      square: 0,
      newType: null as PieceType | null,
    }));
    this.moveOrder = new Int32Array(MAX_MOVES);
    this.searchStack = searchStack;
    this.killers1 = killers1;
    this.killers2 = killers2;
    this.historyCounters = historyCounters;
    this.butterflyCounters = butterflyCounters;
    this.ply = ply;
    this.reset();
  }

  /** Number of moves generated. */
  get count(): number {
    return this.moveCursor;
  }

  /** The move most recently made via {@link makeNextMove}. */
  get currentMove(): MoveInfo {
    return this.moves[this.currentMoveIndex]!;
  }

  // *** SET-UP *** //

  /** Clear the list, optionally seeding the hashtable move and countermove. */
  reset(hashtableMoveHash = 0, countermove = 0): void {
    this.moveCursor = 0;
    this.pickupCursor = 0;
    this.dropCursor = 0;
    this.triedMovesCursor = -1;
    this.hashtableMoveHash = hashtableMoveHash;
    this.countermove = countermove;
  }

  /** Restart iteration over the already-generated moves. */
  restart(pvMove: number): void {
    this.triedMovesCursor = -1;
    if (pvMove !== 0) {
      for (let x = 0; x < this.moveCursor; x++) {
        if (this.moves[x]!.hash === pvMove) this.moves[x]!.evaluation = 99999;
      }
    }
  }

  /** Replace move-ordering scores from an explicit map. */
  reorderMoves(moveScores: Map<number, number>): void {
    for (let x = 0; x < this.moveCursor; x++) {
      this.moves[x]!.evaluation = moveScores.get(this.moves[x]!.hash) ?? 0;
    }
  }

  /** Find a generated move by its packed hash. */
  findMove(moveHash: number): MoveInfo {
    for (let x = 0; x < this.moveCursor; x++) {
      if (this.moves[x]!.hash === moveHash) return this.moves[x]!;
    }
    throw new Error('Move not found');
  }

  // *** MAKING / UNMAKING *** //

  /**
   * Make the next-best untried move (by ordering score). Returns false once
   * every move has been tried. Skips losing captures when `minCaptureValue`
   * is set and static-exchange evaluation rejects them.
   */
  makeNextMove(minCaptureValue = 0): boolean {
    if (this.triedMovesCursor === -1) this.triedMovesCursor = this.moveCursor;
    let succeeded = false;
    while (!succeeded && this.triedMovesCursor > 0) {
      let bestMoveIndex = 0;
      let bestMoveEval = this.moves[this.moveOrder[0]!]!.evaluation;
      for (let x = 1; x < this.triedMovesCursor; x++) {
        const evaluation = this.moves[this.moveOrder[x]!]!.evaluation;
        if (evaluation > bestMoveEval) {
          bestMoveIndex = x;
          bestMoveEval = evaluation;
        }
      }
      const best = this.moves[this.moveOrder[bestMoveIndex]!]!;
      let captureVal = 0;
      if (minCaptureValue !== 0 && moveTypeHasProperty(best.moveType, MoveType.CaptureProperty)) {
        const moved = best.pieceMoved!;
        const captured = best.pieceCaptured!;
        captureVal =
          captured.pieceType.midgameValue -
          moved.pieceType.getMidgamePST(this.board.playerSquare(moved.player, best.fromSquare)) +
          moved.pieceType.getMidgamePST(this.board.playerSquare(moved.player, best.toSquare)) +
          captured.pieceType.getMidgamePST(
            this.board.playerSquare(captured.player, captured.square),
          );
        if (moveTypeHasProperty(best.moveType, MoveType.PromotionProperty)) {
          captureVal +=
            this.game.getPieceType(best.promotionType).midgameValue - moved.pieceType.midgameValue;
        }
        if (best.moveType === MoveType.ExtraCapture) {
          captureVal += this.board.pieceAt(best.tag)!.midgameValue;
        }
      }
      if (
        (best.moveType !== MoveType.StandardCapture && best.moveType !== MoveType.EnPassant) ||
        captureVal >= minCaptureValue
      ) {
        let tryMove = true;
        if (minCaptureValue !== 0 && best.moveType === MoveType.StandardCapture) {
          tryMove =
            !this.game.staticExchangeEvaluation ||
            this.game.seeGe(best.fromSquare, best.toSquare, 0);
        }
        if (tryMove) {
          const index = this.moveOrder[bestMoveIndex]!;
          succeeded = this.makeMoveByIndex(index);
          this.currentMoveIndex = index;
          if (!succeeded) this.unmakeMove();
        }
      }
      const tempOrder = this.moveOrder[this.triedMovesCursor - 1]!;
      this.moveOrder[this.triedMovesCursor - 1] = this.moveOrder[bestMoveIndex]!;
      this.moveOrder[bestMoveIndex] = tempOrder;
      this.triedMovesCursor--;
    }
    return succeeded;
  }

  private performPickup(index: number): void {
    this.pickups[index]!.piece = this.board.clearSquare(this.pickups[index]!.square);
  }

  private performDrop(index: number): void {
    const drop = this.drops[index]!;
    const piece = drop.piece;
    if (drop.newType != null) {
      const oldType = piece.pieceType;
      piece.pieceType = drop.newType;
      piece.typeNumber = piece.pieceType.typeNumber;
      drop.newType = oldType;
    }
    piece.moveCount++;
    this.board.setSquare(piece, drop.square);
  }

  private undoPickup(index: number): void {
    this.board.setSquare(this.pickups[index]!.piece!, this.pickups[index]!.square);
  }

  private undoDrop(index: number): void {
    const drop = this.drops[index]!;
    this.board.clearSquare(drop.square);
    drop.piece.moveCount--;
    if (drop.newType != null) {
      const oldType = drop.newType;
      const newType = drop.piece.pieceType;
      drop.piece.pieceType = oldType;
      drop.piece.typeNumber = oldType.typeNumber;
      drop.newType = newType;
    }
  }

  // *** ADDING MOVES *** //

  /** Add a non-capturing move from `fromSquare` to `toSquare`. */
  addMove(fromSquare: number, toSquare: number, direct = false): void {
    if (!direct && this.game.moveBeingGenerated(this, fromSquare, toSquare, MoveType.StandardMove)) {
      return;
    }
    if (this.game.deduplicateMoves) {
      for (let x = 0; x < this.moveCursor; x++) {
        const m = this.moves[x]!;
        if (
          m.moveType === MoveType.StandardMove &&
          m.fromSquare === fromSquare &&
          m.toSquare === toSquare
        ) {
          return;
        }
      }
    }

    const pieceBeingMoved = this.board.pieceAt(fromSquare)!;

    this.pickups[this.pickupCursor]!.piece = null;
    this.pickups[this.pickupCursor++]!.square = fromSquare;
    this.drops[this.dropCursor]!.newType = null;
    this.drops[this.dropCursor]!.piece = pieceBeingMoved;
    this.drops[this.dropCursor++]!.square = toSquare;

    this.moveOrder[this.moveCursor] = this.moveCursor;

    const move = this.moves[this.moveCursor]!;
    move.moveType = MoveType.StandardMove;
    move.player = pieceBeingMoved.player;
    move.fromSquare = fromSquare;
    move.toSquare = toSquare;
    move.pickupCursor = this.pickupCursor;
    move.dropCursor = this.dropCursor;
    move.pieceMoved = pieceBeingMoved;
    move.pieceCaptured = null;
    move.tag = 0;
    move.originalType = pieceBeingMoved.pieceType.typeNumber;

    if (move.hash === this.searchStack[1]!.pv.get(this.ply)) {
      move.evaluation = 50000;
    } else if (move.hash === this.hashtableMoveHash) {
      move.evaluation = 40000;
    } else if (move.hash === this.killers1[this.ply] || move.hash === this.killers2[this.ply]) {
      move.evaluation = 2000;
    } else {
      const history =
        this.historyCounters[pieceBeingMoved.player]![pieceBeingMoved.typeNumber]![toSquare]!;
      if (history > 0) {
        const butterfly =
          this.butterflyCounters[pieceBeingMoved.player]![pieceBeingMoved.typeNumber]![toSquare]!;
        move.evaluation = Math.floor(
          (history * 500) / this.game.currentMaxHistoryScore / butterfly,
        );
      } else {
        move.evaluation =
          pieceBeingMoved.pieceType.getMidgamePST(toSquare) -
          pieceBeingMoved.pieceType.getMidgamePST(fromSquare) -
          25;
      }
    }
    if (move.hash === this.countermove) move.evaluation += 150;
    this.moveCursor++;

    if (this.legalMovesOnly) {
      const legal = this.makeMoveByIndex(this.moveCursor - 1);
      this.unmakeMoveByIndex(this.moveCursor - 1);
      if (!legal) {
        this.moveCursor--;
        this.pickupCursor--;
        this.dropCursor--;
      }
    }
  }

  /** Add a capturing move from `fromSquare` to `toSquare`. */
  addCapture(fromSquare: number, toSquare: number, direct = false): void {
    if (
      !direct &&
      this.game.moveBeingGenerated(this, fromSquare, toSquare, MoveType.StandardCapture)
    ) {
      return;
    }
    if (this.game.deduplicateMoves) {
      for (let x = 0; x < this.moveCursor; x++) {
        const m = this.moves[x]!;
        if (
          m.moveType === MoveType.StandardCapture &&
          m.fromSquare === fromSquare &&
          m.toSquare === toSquare
        ) {
          return;
        }
      }
    }

    const pieceBeingMoved = this.board.pieceAt(fromSquare)!;
    const pieceBeingCaptured = this.board.pieceAt(toSquare)!;

    this.pickups[this.pickupCursor]!.piece = null;
    this.pickups[this.pickupCursor++]!.square = fromSquare;
    this.pickups[this.pickupCursor]!.piece = null;
    this.pickups[this.pickupCursor++]!.square = toSquare;
    this.drops[this.dropCursor]!.newType = null;
    this.drops[this.dropCursor]!.piece = pieceBeingMoved;
    this.drops[this.dropCursor++]!.square = toSquare;

    this.moveOrder[this.moveCursor] = this.moveCursor;

    const move = this.moves[this.moveCursor]!;
    move.moveType = MoveType.StandardCapture;
    move.player = pieceBeingMoved.player;
    move.fromSquare = fromSquare;
    move.toSquare = toSquare;
    move.pickupCursor = this.pickupCursor;
    move.dropCursor = this.dropCursor;
    move.pieceMoved = pieceBeingMoved;
    move.pieceCaptured = pieceBeingCaptured;
    move.tag = 0;
    move.originalType = pieceBeingMoved.pieceType.typeNumber;

    move.evaluation =
      (pieceBeingCaptured.pieceType.midgameValue >= pieceBeingMoved.pieceType.midgameValue
        ? 3000
        : !this.game.simpleMoveGeneration || this.game.seeGe(fromSquare, toSquare, 0)
          ? 3000
          : 100) +
      Math.floor(pieceBeingCaptured.pieceType.midgameValue / 2) -
      Math.floor(pieceBeingMoved.pieceType.midgameValue / 32);
    if (move.hash === this.searchStack[1]!.pv.get(this.ply)) {
      move.evaluation = 50000;
    } else if (move.hash === this.hashtableMoveHash) {
      move.evaluation = 40000;
    } else if (move.hash === this.countermove) {
      move.evaluation += 250;
    }
    this.moveCursor++;

    if (this.legalMovesOnly) {
      const legal = this.makeMoveByIndex(this.moveCursor - 1);
      this.unmakeMoveByIndex(this.moveCursor - 1);
      if (!legal) {
        this.moveCursor--;
        this.pickupCursor -= 2;
        this.dropCursor--;
      }
    }
  }

  /** Add a rifle capture (captures without the attacker vacating its square). */
  addRifleCapture(fromSquare: number, toSquare: number, direct = false): void {
    if (
      !direct &&
      this.game.moveBeingGenerated(this, fromSquare, toSquare, MoveType.BaroqueCapture)
    ) {
      return;
    }

    const pieceBeingMoved = this.board.pieceAt(fromSquare)!;
    const pieceBeingCaptured = this.board.pieceAt(toSquare)!;

    this.pickups[this.pickupCursor]!.piece = null;
    this.pickups[this.pickupCursor++]!.square = toSquare;

    this.moveOrder[this.moveCursor] = this.moveCursor;

    const move = this.moves[this.moveCursor]!;
    move.moveType = MoveType.BaroqueCapture;
    move.player = pieceBeingMoved.player;
    move.fromSquare = fromSquare;
    move.toSquare = toSquare;
    move.pickupCursor = this.pickupCursor;
    move.dropCursor = this.dropCursor;
    move.pieceMoved = pieceBeingMoved;
    move.pieceCaptured = pieceBeingCaptured;
    move.tag = toSquare;
    move.originalType = pieceBeingMoved.pieceType.typeNumber;
    move.evaluation = 6000 + pieceBeingCaptured.pieceType.midgameValue;
    if (move.hash === this.searchStack[1]!.pv.get(this.ply)) {
      move.evaluation = 50000;
    } else if (move.hash === this.hashtableMoveHash) {
      move.evaluation = 40000;
    }
    this.moveCursor++;

    if (this.legalMovesOnly) {
      const legal = this.makeMoveByIndex(this.moveCursor - 1);
      this.unmakeMoveByIndex(this.moveCursor - 1);
      if (!legal) {
        this.moveCursor--;
        this.pickupCursor--;
      }
    }
  }

  // *** CUSTOM (MULTI-STEP) MOVE CONSTRUCTION *** //

  /** Begin building a custom move (used by rules for castling, drops, ...). */
  beginMoveAdd(moveType: MoveType, fromSquare: number, toSquare: number, tag = 0): void {
    const move = this.moves[this.moveCursor]!;
    move.moveType = moveType;
    move.tag = tag;
    if (fromSquare !== -1) {
      const piece = this.board.pieceAt(fromSquare)!;
      move.player = piece.player;
      move.fromSquare = fromSquare;
      move.toSquare = toSquare;
      move.originalType = piece.pieceType.typeNumber;
      move.pieceMoved = piece;
    } else {
      move.player = this.game.currentSide;
      move.fromSquare = 0;
      move.toSquare = 0;
      move.originalType = -1;
      move.pieceMoved = null;
    }
    this.moveOrder[this.moveCursor] = this.moveCursor;
    this.tempPickupCursor = this.pickupCursor;
    this.tempDropCursor = this.dropCursor;
  }

  /** Set the tag of the move currently being built. */
  setMoveTag(tag: number): void {
    this.moves[this.moveCursor]!.tag = tag;
  }

  /** Add a pickup to the move being built; returns the piece on that square. */
  addPickup(square: number): Piece {
    this.pickups[this.pickupCursor]!.piece = null;
    this.pickups[this.pickupCursor++]!.square = square;
    const pieceOnSquare = this.board.pieceAt(square)!;
    this.moves[this.moveCursor]!.pieceCaptured = pieceOnSquare;
    return pieceOnSquare;
  }

  /** Add a drop to the move being built, optionally changing the piece's type. */
  addDrop(piece: Piece, square: number, newType: PieceType | null = null): void {
    const move = this.moves[this.moveCursor]!;
    if (move.pieceCaptured === piece) move.pieceCaptured = null;
    this.drops[this.dropCursor]!.newType = newType;
    this.drops[this.dropCursor]!.piece = piece;
    this.drops[this.dropCursor++]!.square = square;
    if (newType != null) move.promotionType = newType.typeNumber;
  }

  /** Finish building a custom move, assigning its ordering score. */
  endMoveAdd(evaluation: number): void {
    const move = this.moves[this.moveCursor]!;
    move.pickupCursor = this.pickupCursor;
    move.dropCursor = this.dropCursor;
    move.evaluation = evaluation;
    if (move.hash === this.searchStack[1]!.pv.get(this.ply)) {
      move.evaluation = 50000;
    } else if (move.hash === this.hashtableMoveHash) {
      move.evaluation = 40000;
    } else if (move.hash === this.countermove) {
      move.evaluation += 250;
    }
    this.moveCursor++;

    if (this.legalMovesOnly) {
      const legal = this.makeMoveByIndex(this.moveCursor - 1);
      this.unmakeMoveByIndex(this.moveCursor - 1);
      if (!legal) {
        this.moveCursor--;
        this.pickupCursor = this.tempPickupCursor;
        this.dropCursor = this.tempDropCursor;
      }
    }
  }

  // *** EXECUTION *** //

  /** Make the move at index `index`; returns false if the game rejects it. */
  makeMoveByIndex(index: number): boolean {
    let firstPickup = 0;
    let firstDrop = 0;
    if (index > 0) {
      firstPickup = this.moves[index - 1]!.pickupCursor;
      firstDrop = this.moves[index - 1]!.dropCursor;
    }
    for (let pickup = firstPickup; pickup < this.moves[index]!.pickupCursor; pickup++) {
      this.performPickup(pickup);
    }
    for (let drop = firstDrop; drop < this.moves[index]!.dropCursor; drop++) {
      this.performDrop(drop);
    }
    return this.game.moveBeingMade(this.moves[index]!);
  }

  /** Make a specific move (found by identity); returns false if not found. */
  makeMove(move: MoveInfo): boolean {
    for (let x = 0; x < this.moveCursor; x++) {
      if (this.moves[x]!.equals(move)) return this.makeMoveByIndex(x);
    }
    return false;
  }

  private unmakeMoveByIndex(index: number): void {
    this.game.moveBeingUnmade(this.moves[index]!);
    let firstDrop = 0;
    let firstPickup = 0;
    if (index > 0) {
      firstPickup = this.moves[index - 1]!.pickupCursor;
      firstDrop = this.moves[index - 1]!.dropCursor;
    }
    for (let drop = firstDrop; drop < this.moves[index]!.dropCursor; drop++) {
      this.undoDrop(drop);
    }
    for (let pickup = firstPickup; pickup < this.moves[index]!.pickupCursor; pickup++) {
      this.undoPickup(pickup);
    }
  }

  /** Unmake the move most recently made via {@link makeNextMove}. */
  unmakeMove(): void {
    this.unmakeMoveByIndex(this.currentMoveIndex);
  }

  /** Make a null move (pass) for the side to move. */
  makeNullMove(): void {
    this.game.moveBeingMade(MoveList.nullMoves![this.game.currentSide]!);
  }

  /** Unmake a previously made null move. */
  unmakeNullMove(): void {
    this.game.moveBeingUnmade(MoveList.nullMoves![this.game.currentSide ^ 1]!);
  }

  /** Append a played move's pickups and drops to the game's permanent history. */
  copyMoveToGameHistory(gamePickups: Pickup[], gameDrops: Drop[], move: MoveInfo): void {
    for (let index = 0; index < this.moveCursor; index++) {
      if (this.moves[index]!.equals(move)) {
        let firstPickup = 0;
        let firstDrop = 0;
        if (index > 0) {
          firstPickup = this.moves[index - 1]!.pickupCursor;
          firstDrop = this.moves[index - 1]!.dropCursor;
        }
        for (let pickup = firstPickup; pickup < this.moves[index]!.pickupCursor; pickup++) {
          gamePickups.push({ ...this.pickups[pickup]! });
        }
        for (let drop = firstDrop; drop < this.moves[index]!.dropCursor; drop++) {
          gameDrops.push({ ...this.drops[drop]! });
        }
        return;
      }
    }
    throw new Error('fatal error in MoveList.copyMoveToGameHistory');
  }

  /** Debug check: every generated move must be unique. */
  validate(): void {
    for (let x = 0; x < this.moveCursor; x++) {
      for (let y = 0; y < this.moveCursor; y++) {
        if (x !== y && this.moves[x]!.equals(this.moves[y]!)) {
          throw new Error('Invalid move list.');
        }
      }
    }
  }
}
