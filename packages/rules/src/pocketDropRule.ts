/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Pocket/PocketDropRule.cs
 ***************************************************************************/

import {
  type FEN,
  type Game,
  Location,
  type MoveList,
  MoveType,
  Piece,
  Rule,
} from '@chessv/engine';

/**
 * Pocket drops: each player has one off-board "pocket" square that may hold
 * a piece in reserve; on their turn they can drop that piece onto any empty
 * board square in lieu of a normal move.
 *
 * Used by Pocket Knight (Chess With Pockets). Future variants in the Shogi
 * family will add a per-side hand of multiple pieces; this rule covers the
 * single-pocket case and the Shogi rule will subclass / extend it.
 */
export class PocketDropRule extends Rule {
  private pocketSquares: number[] = [];

  override initialize(game: Game): void {
    super.initialize(game);
    this.pocketSquares = [];
    for (let player = 0; player < game.numPlayers; player++) {
      this.pocketSquares[player] = game.board.locationToSquare(new Location(player, -1));
    }
  }

  override positionLoaded(fen: FEN): void {
    const game = this.requireGame();
    const piecesInHand = fen.get('pieces in hand');
    for (const c of piecesInHand) {
      if (c === '-' || c === '@') continue;
      const type = game.getTypeByNotation(c);
      if (type === null) {
        throw new Error(`PocketDropRule: unknown piece notation '${c}' in pieces-in-hand`);
      }
      const player = c.toUpperCase() === c ? 0 : 1;
      const pocketSquare = this.pocketSquares[player]!;
      const piece = new Piece(game, player, type, pocketSquare);
      game.addPiece(piece);
    }
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, _ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const pocketSquare = this.pocketSquares[game.currentSide]!;
    const pieceInPocket = board.pieceAt(pocketSquare);
    if (pieceInPocket === null) return;

    for (let square = 0; square < board.numSquares; square++) {
      if (board.pieceAt(square) !== null) continue;
      list.beginMoveAdd(MoveType.Drop, pocketSquare, square);
      const piece = list.addPickup(pocketSquare);
      // Re-drop with the piece's existing type — the pocket holds a single
      // type at a time, so no morph; pass the same type to set newType for
      // the pickup/drop machinery's promotion bookkeeping.
      list.addDrop(piece, square, pieceInPocket.pieceType);
      list.endMoveAdd(pieceInPocket.pieceType.getMidgamePST(square) - 10);
    }
  }

  private requireGame(): Game {
    if (this.game === null) throw new Error('PocketDropRule used before initialization');
    return this.game;
  }
}
