/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/MultiKing/RelativeRoyaltyCheckmateRule.cs
 ***************************************************************************/

import {
  type Game,
  MoveEventResponse,
  type MoveInfo,
  ONEPLY,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * A checkmate rule for variants with two kings: of a player's royal pieces,
 * the one nearest that player's own back rank is the one that must not be
 * left in check. Used by Relative Royalty Chess.
 */
export class RelativeRoyaltyCheckmateRule extends Rule {
  stalemateResult: MoveEventResponse = MoveEventResponse.GameDrawn;
  readonly royalPieceType: PieceType;

  constructor(royalPieceType: PieceType) {
    super();
    this.royalPieceType = royalPieceType;
  }

  override moveBeingMade(move: MoveInfo, _ply: number): MoveEventResponse {
    const royalSquare = this.findRoyalPieceSquare(move.player);
    if (this.game!.isSquareAttacked(royalSquare, move.player ^ 1)) {
      return MoveEventResponse.IllegalMove;
    }
    return MoveEventResponse.NotHandled;
  }

  override noMovesResult(currentPlayer: number, _ply: number): MoveEventResponse {
    const royalSquare = this.findRoyalPieceSquare(currentPlayer);
    if (this.game!.isSquareAttacked(royalSquare, currentPlayer ^ 1)) {
      return MoveEventResponse.GameLost;
    }
    return this.stalemateResult;
  }

  override positionalSearchExtension(currentPlayer: number, _ply: number): number {
    const royalSquare = this.findRoyalPieceSquare(currentPlayer);
    return this.game!.isSquareAttacked(royalSquare, currentPlayer ^ 1) ? ONEPLY : 0;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.royalPieceType) notes.push('multiple royalty (relative position)');
  }

  /** The square of the royal piece nearest the player's own back rank. */
  private findRoyalPieceSquare(player: number): number {
    const board = this.board!;
    const kings = board
      .getPieceTypeBitboard(player, (this.game as Game).getPieceTypeNumber(this.royalPieceType))
      .clone();
    let royalSquare = kings.extractLSB();
    let royalSquareRelative = board.playerSquare(player, royalSquare);
    for (;;) {
      const square = kings.extractLSB();
      if (square < 0) break;
      const relative = board.playerSquare(player, square);
      if (relative < royalSquareRelative) {
        royalSquare = square;
        royalSquareRelative = relative;
      }
    }
    return royalSquare;
  }
}
