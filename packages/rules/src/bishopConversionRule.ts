/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Symmetric/BishopConversionRule.cs
 ***************************************************************************/

import {
  type FEN,
  type Game,
  HashKeys,
  MAX_GAME_LENGTH,
  MAX_PLY,
  type MoveInfo,
  type MoveList,
  MoveEventResponse,
  MoveType,
  Rule,
} from '@chessv/engine';

/**
 * Symmetric Chess's bishop-conversion rule. Each side starts with two
 * bishops on the same-coloured squares (c1+g1, c8+g8) so the bishops
 * would naturally cover only one colour. The first time a bishop moves,
 * it may instead "convert" by taking a single orthogonal step (N/S/E/W)
 * to land on the opposite colour. Once one bishop has converted (or
 * moved diagonally, declining), the other bishop *must* convert on its
 * first move.
 *
 * Privileges are tracked as a 4-pair (can, must) per bishop, packed into
 * an 8-bit bitmask, persisted in the FEN's `bishop-conversion` field.
 */

// Bit layout: each bishop has 2 bits — `can` and `must` — for a total of 8.
const BIT = {
  p0_b0_can: 1,
  p0_b0_must: 2,
  p0_b1_can: 4,
  p0_b1_must: 8,
  p1_b0_can: 16,
  p1_b0_must: 32,
  p1_b1_can: 64,
  p1_b1_must: 128,
} as const;
const P0_ALL = BIT.p0_b0_can | BIT.p0_b0_must | BIT.p0_b1_can | BIT.p0_b1_must;
const P1_ALL = BIT.p1_b0_can | BIT.p1_b0_must | BIT.p1_b1_can | BIT.p1_b1_must;

interface PerPlayer {
  canBit0: number;
  mustBit0: number;
  canBit1: number;
  mustBit1: number;
  allBits: number;
}
const PLAYER_BITS: [PerPlayer, PerPlayer] = [
  { canBit0: BIT.p0_b0_can, mustBit0: BIT.p0_b0_must, canBit1: BIT.p0_b1_can, mustBit1: BIT.p0_b1_must, allBits: P0_ALL },
  { canBit0: BIT.p1_b0_can, mustBit0: BIT.p1_b0_must, canBit1: BIT.p1_b1_can, mustBit1: BIT.p1_b1_must, allBits: P1_ALL },
];

export class BishopConversionRule extends Rule {
  private readonly bishopSquares: string[];
  private hashKeyIndex = 0;
  private privs = new Int32Array(0);
  private gameHistory = new Int32Array(0);
  private p0sq0 = -1;
  private p0sq1 = -1;
  private p1sq0 = -1;
  private p1sq1 = -1;
  private allPrivString = '';

  constructor(bishopSquares: string[]) {
    super();
    if (bishopSquares.length !== 4) {
      throw new Error('BishopConversionRule expects exactly 4 bishop squares');
    }
    this.bishopSquares = bishopSquares;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.hashKeyIndex = game.hashKeys.takeKeys(256);
    this.privs = new Int32Array(MAX_PLY);
    this.gameHistory = new Int32Array(MAX_GAME_LENGTH);
    this.p0sq0 = game.notationToSquare(this.bishopSquares[0]!);
    this.p0sq1 = game.notationToSquare(this.bishopSquares[1]!);
    this.p1sq0 = game.notationToSquare(this.bishopSquares[2]!);
    this.p1sq1 = game.notationToSquare(this.bishopSquares[3]!);
    this.allPrivString =
      this.bishopSquares[0]![0]!.toUpperCase() +
      this.bishopSquares[1]![0]!.toUpperCase() +
      this.bishopSquares[2]![0]! +
      this.bishopSquares[3]![0]!;
    game.moveBeingPlayedHandlers.push(() => {
      this.gameHistory[game.gameMoveNumber] = this.privs[1]!;
      this.privs[0] = this.privs[1]!;
    });
  }

  override clearGameState(): void {
    this.privs.fill(0);
    this.gameHistory.fill(0);
  }

  override getPositionHashCode(ply: number): bigint {
    const priv = ply === 1 ? this.gameHistory[this.game!.gameMoveNumber]! : this.privs[ply - 1]!;
    return HashKeys.Keys[this.hashKeyIndex + priv]!;
  }

  override setDefaultsInFEN(fen: FEN): void {
    if (fen.get('bishop-conversion') === '#default') {
      fen.set('bishop-conversion', this.allPrivString);
    }
  }

  override positionLoaded(fen: FEN): void {
    const text = fen.get('bishop-conversion');
    this.privs[0] = 0;
    if (text === '-') {
      this.gameHistory[this.game!.gameMoveNumber] = 0;
      return;
    }
    const game = this.game!;
    const file = (sq: number): string => game.getSquareNotation(sq)[0]!;
    let cursor = 0;
    while (cursor < text.length) {
      const ch = text[cursor]!;
      const isUpper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
      const player: 0 | 1 = isUpper ? 0 : 1;
      const sq0 = player === 0 ? this.p0sq0 : this.p1sq0;
      const sq1 = player === 0 ? this.p0sq1 : this.p1sq1;
      const lower = ch.toLowerCase();
      const bits = PLAYER_BITS[player];
      if (lower === file(sq0).toLowerCase()) {
        this.privs[0]! |= bits.canBit0;
        if (cursor + 1 < text.length && text[cursor + 1] === '+') {
          this.privs[0]! |= bits.mustBit0;
          cursor++;
        }
      } else if (lower === file(sq1).toLowerCase()) {
        this.privs[0]! |= bits.canBit1;
        if (cursor + 1 < text.length && text[cursor + 1] === '+') {
          this.privs[0]! |= bits.mustBit1;
          cursor++;
        }
      } else {
        throw new Error(`BishopConversionRule: unexpected character '${ch}' in FEN`);
      }
      cursor++;
    }
    this.gameHistory[game.gameMoveNumber] = this.privs[0]!;
  }

  override savePositionToFEN(fen: FEN): void {
    const priv = this.gameHistory[this.game!.gameMoveNumber]!;
    const game = this.game!;
    const fileOf = (sq: number): string => game.getSquareNotation(sq)[0]!;
    let text = '';
    // Player 0.
    if (priv & BIT.p0_b0_must) text += fileOf(this.p0sq0).toUpperCase() + '+';
    else if (priv & BIT.p0_b1_must) text += fileOf(this.p0sq1).toUpperCase() + '+';
    else if (priv & BIT.p0_b0_can) text += fileOf(this.p0sq0).toUpperCase();
    else if (priv & BIT.p0_b1_can) text += fileOf(this.p0sq1).toUpperCase();
    // Player 1.
    if (priv & BIT.p1_b0_must) text += fileOf(this.p1sq0) + '+';
    else if (priv & BIT.p1_b1_must) text += fileOf(this.p1sq1) + '+';
    else if (priv & BIT.p1_b0_can) text += fileOf(this.p1sq0);
    else if (priv & BIT.p1_b1_can) text += fileOf(this.p1sq1);
    fen.set('bishop-conversion', text === '' ? '-' : text);
  }

  override moveBeingMade(move: MoveInfo, ply: number): MoveEventResponse {
    const board = this.board!;
    let cur =
      ply === 1 ? this.gameHistory[this.game!.gameMoveNumber]! : this.privs[ply - 1]!;
    let next = cur;
    if (cur !== 0) {
      const fromSq = move.fromSquare;
      const toSq = move.toSquare;
      const isOrthogonalStep = (from: number, to: number): boolean => {
        const dx = Math.abs(board.getFile(from) - board.getFile(to));
        const dy = Math.abs(board.getRank(from) - board.getRank(to));
        return (dx === 0 && dy === 1) || (dx === 1 && dy === 0);
      };
      // Helper to handle "this bishop is leaving its starting square".
      const handleLeave = (
        player: 0 | 1,
        bit: 'b0' | 'b1',
        otherBit: 'b0' | 'b1',
      ): boolean => {
        const bits = PLAYER_BITS[player];
        const canBit = bit === 'b0' ? bits.canBit0 : bits.canBit1;
        const mustBit = bit === 'b0' ? bits.mustBit0 : bits.mustBit1;
        const otherCanBit = otherBit === 'b0' ? bits.canBit0 : bits.canBit1;
        if (cur & mustBit) {
          if (!isOrthogonalStep(fromSq, toSq)) return false; // illegal
          next &= ~bits.allBits;
        } else if (cur & canBit) {
          if (isOrthogonalStep(fromSq, toSq)) {
            // Conversion move — consumes all of this player's privs.
            next &= ~bits.allBits;
          } else {
            // Declined conversion — strip this bishop's `can`, promote the
            // other bishop's `can` (if any) to `must`.
            next &= ~canBit;
            if (cur & otherCanBit) {
              next = (next & ~bits.allBits) | (otherBit === 'b0' ? bits.mustBit0 : bits.mustBit1);
            }
          }
        }
        return true;
      };
      const handleCapture = (
        victimPlayer: 0 | 1,
        bit: 'b0' | 'b1',
        otherBit: 'b0' | 'b1',
      ): void => {
        const bits = PLAYER_BITS[victimPlayer];
        const canBit = bit === 'b0' ? bits.canBit0 : bits.canBit1;
        const mustBit = bit === 'b0' ? bits.mustBit0 : bits.mustBit1;
        const otherCanBit = otherBit === 'b0' ? bits.canBit0 : bits.canBit1;
        if (cur & canBit) {
          if (cur & otherCanBit) next = (next & ~bits.allBits) | otherCanBit;
          else next &= ~bits.allBits;
        } else if (cur & mustBit) {
          next &= ~bits.allBits;
        }
      };

      if (move.player === 0) {
        if (fromSq === this.p0sq0 && !handleLeave(0, 'b0', 'b1')) return MoveEventResponse.IllegalMove;
        else if (fromSq === this.p0sq1 && !handleLeave(0, 'b1', 'b0')) return MoveEventResponse.IllegalMove;
        if (toSq === this.p1sq0) handleCapture(1, 'b0', 'b1');
        else if (toSq === this.p1sq1) handleCapture(1, 'b1', 'b0');
      } else {
        if (fromSq === this.p1sq0 && !handleLeave(1, 'b0', 'b1')) return MoveEventResponse.IllegalMove;
        else if (fromSq === this.p1sq1 && !handleLeave(1, 'b1', 'b0')) return MoveEventResponse.IllegalMove;
        if (toSq === this.p0sq0) handleCapture(0, 'b0', 'b1');
        else if (toSq === this.p0sq1) handleCapture(0, 'b1', 'b0');
      }
    }
    this.privs[ply] = next;
    if (ply === 1) this.gameHistory[this.game!.gameMoveNumber + 1] = next;
    return MoveEventResponse.MoveOk;
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const priv = ply === 1 ? this.gameHistory[game.gameMoveNumber]! : this.privs[ply - 1]!;
    const emit = (fromSq: number): void => {
      // Each of the four orthogonal unit steps becomes a non-promotion move.
      for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const toFile = board.getFile(fromSq) + df;
        const toRank = board.getRank(fromSq) + dr;
        if (toFile < 0 || toFile >= board.numFiles || toRank < 0 || toRank >= board.numRanks) continue;
        const toSq = board.rankFileToSquare(toRank, toFile);
        const target = board.pieceAt(toSq);
        if (target === null) {
          if (!capturesOnly) list.addMove(fromSq, toSq, true);
        } else if (target.player !== game.currentSide) {
          list.addCapture(fromSq, toSq, true);
        }
      }
    };
    if (game.currentSide === 0) {
      if (priv & (BIT.p0_b0_can | BIT.p0_b0_must)) emit(this.p0sq0);
      if (priv & (BIT.p0_b1_can | BIT.p0_b1_must)) emit(this.p0sq1);
    } else {
      if (priv & (BIT.p1_b0_can | BIT.p1_b0_must)) emit(this.p1sq0);
      if (priv & (BIT.p1_b1_can | BIT.p1_b1_must)) emit(this.p1sq1);
    }
  }

  override moveBeingGenerated(
    _moves: MoveList,
    _from: number,
    _to: number,
    _type: MoveType,
  ): MoveEventResponse {
    return MoveEventResponse.NotHandled;
  }
}
