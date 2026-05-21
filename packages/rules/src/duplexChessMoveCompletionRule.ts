/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/MultiMove/DuplexChessMoveCompletionRule.cs
 ***************************************************************************/

import {
  type FEN,
  type Game,
  HashKeys,
  MAX_GAME_LENGTH,
  MAX_PLY,
  MoveCompletionRule,
  MoveEventResponse,
  type MoveInfo,
  type MoveList,
  MoveType,
  type Piece,
  type PieceType,
} from '@chessv/engine';

/**
 * State machine for Duplex Chess. Eight states cover the four setup
 * drops (ws/bs/bg/wg: silver-general + gold-general drops for each
 * side) followed by the cyclic w2/w/b2/b double-move sequence.
 *
 * sidePerState[i] = which player is on the move in state i.
 */
const STATE_NOTATIONS = ['w2', 'w', 'b2', 'b', 'ws', 'bs', 'bg', 'wg'] as const;
const SIDE_PER_STATE = [0, 0, 1, 1, 0, 1, 1, 0];

export class DuplexChessMoveCompletionRule extends MoveCompletionRule {
  private readonly kingType: PieceType;
  private readonly pawnType: PieceType;
  private readonly generals: Piece[];

  private currentState = 1;
  private turnNumberValue = 0;
  private hashKeyIndex = 0;
  private pieceLastMoved: (Piece | null)[] = [];
  private searchStateHistory = new Int32Array(0);
  private searchStateHistoryIndex = 0;

  constructor(kingType: PieceType, pawnType: PieceType, generals: Piece[]) {
    super();
    this.kingType = kingType;
    this.pawnType = pawnType;
    this.generals = generals;
  }

  override initialize(game: Game): void {
    super.initialize(game);
    this.hashKeyIndex = game.hashKeys.takeKeys(STATE_NOTATIONS.length);
    this.pieceLastMoved = new Array<Piece | null>(MAX_GAME_LENGTH + MAX_PLY).fill(null);
    this.searchStateHistory = new Int32Array(MAX_GAME_LENGTH + MAX_PLY);
    this.searchStateHistoryIndex = 0;
  }

  override get turnNumber(): number {
    return this.turnNumberValue;
  }

  override positionLoaded(fen: FEN): void {
    const game = this.game!;
    const turn = Number.parseInt(fen.get('turn number'), 10);
    if (!Number.isInteger(turn)) {
      throw new Error(`FEN parse error - invalid turn number: '${fen.get('turn number')}'`);
    }
    this.turnNumberValue = turn;
    const notation = fen.get('current player');
    const idx = STATE_NOTATIONS.indexOf(notation as (typeof STATE_NOTATIONS)[number]);
    if (idx < 0) throw new Error(`FEN parse error - invalid current player: '${notation}'`);
    this.currentState = idx;
    game.currentSide = SIDE_PER_STATE[idx]!;
    this.searchStateHistory[this.searchStateHistoryIndex++] = idx;
  }

  override savePositionToFEN(fen: FEN): void {
    fen.set('turn number', String(this.turnNumberValue));
    fen.set('current player', STATE_NOTATIONS[this.currentState]!);
  }

  override getPositionHashCode(_ply: number): bigint {
    return HashKeys.Keys[this.hashKeyIndex + this.currentState]!;
  }

  override getNextSide(): number {
    if (this.currentState >= 4) return Math.floor((7 - this.currentState) / 2);
    return Math.floor(((this.currentState + 1) % 4) / 2);
  }

  override completeMove(move: MoveInfo, _ply: number): void {
    const game = this.game!;
    this.pieceLastMoved[this.searchStateHistoryIndex] = move.pieceMoved;
    this.searchStateHistory[this.searchStateHistoryIndex++] = this.currentState;
    if (this.currentState >= 4) {
      this.currentState = this.currentState === 7 ? 1 : this.currentState + 1;
    } else {
      this.currentState = (this.currentState + 1) % 4;
    }
    if (this.currentState === 0 || this.currentState === 7) this.turnNumberValue++;
    game.currentSide = SIDE_PER_STATE[this.currentState]!;
  }

  override undoingMove(): void {
    const game = this.game!;
    this.currentState = this.searchStateHistory[--this.searchStateHistoryIndex]!;
    if (this.currentState === 3 || this.currentState === 6) this.turnNumberValue--;
    game.currentSide = SIDE_PER_STATE[this.currentState]!;
  }

  override moveBeingGenerated(
    moves: MoveList,
    from: number,
    to: number,
    _type: MoveType,
  ): MoveEventResponse {
    const game = this.game!;
    const board = this.board!;
    if (this.currentState >= 4) {
      // Setup drops: a pawn moves and one of the prepared generals slots
      // into the pawn's vacated starting square.
      const piece = board.pieceAt(from);
      if (piece === null || piece.pieceType !== this.pawnType) return MoveEventResponse.IllegalMove;
      if (game.startingPieceSquares[piece.player]![from] !== 1) return MoveEventResponse.IllegalMove;
      moves.beginMoveAdd(MoveType.StandardMove, from, to);
      const pawn = moves.addPickup(from);
      moves.addDrop(pawn, to, null);
      moves.addDrop(this.generals[this.currentState - 4]!, from, null);
      moves.endMoveAdd(this.pawnType.getMidgamePST(board.playerSquare(piece.player, to)));
      return MoveEventResponse.Handled;
    }
    // Normal double-move state: forbid repeating the just-moved piece
    // unless it's a king.
    const piece = board.pieceAt(from);
    if (
      piece !== null &&
      piece === this.pieceLastMoved[this.searchStateHistoryIndex - 1] &&
      piece.pieceType !== this.kingType
    ) {
      return MoveEventResponse.IllegalMove;
    }
    return MoveEventResponse.NotHandled;
  }
}
