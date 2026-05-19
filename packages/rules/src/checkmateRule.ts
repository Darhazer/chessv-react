/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/CheckmateRule.cs
 ***************************************************************************/

import {
  type FEN,
  type Game,
  MoveEventResponse,
  type MoveInfo,
  ONEPLY,
  type Piece,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * The rule that makes a piece type "royal": a move leaving one's own royal
 * piece attacked is illegal, and having no legal move is checkmate (loss) or
 * stalemate (by default a draw).
 *
 * In C# this rule was attached automatically by the `[Royal]` piece-type
 * attribute; the web port has variants add it explicitly (see GenericChess).
 */
export class CheckmateRule extends Rule {
  /** Result when the side to move has no moves but is not in check. */
  stalemateResult: MoveEventResponse = MoveEventResponse.GameDrawn;
  /** The piece type made royal by this rule. */
  readonly royalPieceType: PieceType;

  private royalPieces: (Piece | null)[] = [];

  constructor(royalPieceType: PieceType) {
    super();
    this.royalPieceType = royalPieceType;
  }

  override initialize(game: Game): void {
    this.royalPieces = new Array<Piece | null>(game.numPlayers).fill(null);
    super.initialize(game);
  }

  override positionLoaded(_fen: FEN): void {
    const game = this.game!;
    for (let player = 0; player < game.numPlayers; player++) {
      for (const piece of game.getPieceList()) {
        if (piece.player === player && piece.pieceType === this.royalPieceType) {
          this.royalPieces[player] = piece;
        }
      }
    }
  }

  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    if (
      move.pieceCaptured != null &&
      (move.pieceCaptured === this.royalPieces[0] || move.pieceCaptured === this.royalPieces[1])
    ) {
      throw new Error('Fatal error in CheckmateRule - Royal piece captured');
    }
    const royalPiece = this.royalPieces[move.player];
    if (royalPiece != null && this.game!.isSquareAttacked(royalPiece.square, move.player ^ 1)) {
      return MoveEventResponse.IllegalMove;
    }
    return MoveEventResponse.NotHandled;
  }

  override noMovesResult(currentPlayer: number, _ply: number): MoveEventResponse {
    const royalPiece = this.royalPieces[currentPlayer]!;
    if (this.game!.isSquareAttacked(royalPiece.square, currentPlayer ^ 1)) {
      return MoveEventResponse.GameLost;
    }
    return this.stalemateResult;
  }

  override positionalSearchExtension(currentPlayer: number, _ply: number): number {
    const royalPiece = this.royalPieces[currentPlayer]!;
    return this.game!.isSquareAttacked(royalPiece.square, currentPlayer ^ 1) ? ONEPLY : 0;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.royalPieceType) notes.push('royal');
  }
}
