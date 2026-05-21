/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/FlexibleCastlingRule.cs
 ***************************************************************************/

import { type MoveList, MoveType } from '@chessv/engine';
import { type CastlingMove, CastlingRule } from './castlingRule.js';

/**
 * Flexible castling: the king slides two **or more** squares toward the
 * corner piece, and the corner piece jumps to the king's other side.
 *
 * Used in 10×8 variants (Carrera, Schoolbook, Grotesque, Ladorean, Univers)
 * and several 10×10 / 12×10 / 12×12 variants where the king has more files
 * to traverse than a classical board allows.
 *
 * The `allowOntoCastlingPiece` flag on each move (set by
 * `GenericChess.flexibleCastlingMove`) is stored in `CastlingMove.otherTo`
 * as 0 or 1 — see the C# original. The standard CastlingRule never inspects
 * `otherToSquare` other than as a destination; this subclass repurposes that
 * field as a one-square extension flag for the king's slide.
 */
export class FlexibleCastlingRule extends CastlingRule {
  /** Upper bound on the king's slide distance (in squares). Defaults to no limit. */
  maxSlideRange = 99;

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const castlingPriv =
      ply === 1
        ? this.gameHistoryPrivs[game.gameMoveNumber]!
        : this.searchStackPrivs[ply - 1]!;

    for (let x = 0; x < this.nCastlingMoves[game.currentSide]!; x++) {
      const cm = this.castlingMoves[game.currentSide]![x]!;
      if ((cm.requiredPriv & castlingPriv) === 0) continue;

      // The C# code mirrors itself for left- vs right-slides; we factor it.
      const slideRight = cm.kingFromSquare < cm.kingToSquare;
      const step = slideRight ? 1 : -1;
      const kingFromFile = board.getFile(cm.kingFromSquare);
      const kingToFile = board.getFile(cm.kingToSquare);
      const otherFromFile = board.getFile(cm.otherFromSquare);
      const rank = board.getRank(cm.kingFromSquare);

      // 1. The squares between the king and the corner piece must be empty
      //    (skipping the partner piece's own square).
      let squaresEmpty = true;
      for (
        let file = kingFromFile + step;
        squaresEmpty &&
        (slideRight
          ? file <= kingToFile || file <= otherFromFile
          : file >= kingToFile || file >= otherFromFile);
        file += step
      ) {
        const sq = board.rankFileToSquare(rank, file);
        if (sq !== cm.otherFromSquare && board.pieceAt(sq) != null) squaresEmpty = false;
      }
      if (!squaresEmpty) continue;

      // 2. The king may not pass through an attacked square on its way to
      //    its standard destination. Count slide distance for the cap below.
      let slideDistance = 1;
      let squaresAttacked = false;
      if (this.hasCheckmateRule) {
        for (
          let file = kingFromFile;
          !squaresAttacked && (slideRight ? file <= kingToFile : file >= kingToFile);
          file += step
        ) {
          const sq = board.rankFileToSquare(rank, file);
          if (game.isSquareAttacked(sq, game.currentSide ^ 1)) squaresAttacked = true;
          slideDistance++;
        }
      } else {
        slideDistance += Math.abs(kingToFile - kingFromFile) + 1;
      }
      if (squaresAttacked) continue;

      // 3. Emit the canonical king-slides-to-kingToSquare move, with the
      //    partner piece jumping to the king's other side. Subclasses can
      //    redirect destinations via {@link translateDestination} (Alice).
      this.tryEmitCastling(
        list,
        cm,
        cm.kingToSquare,
        board.rankFileToSquare(rank, kingToFile - step),
      );

      // 4. Try farther king destinations. The king may continue toward the
      //    partner piece up to (but normally not onto) its square. The
      //    `otherTo` field carries an allow-onto-partner flag (0 or 1).
      const allowOntoPartner = cm.otherToSquare;
      const farLimit = otherFromFile + step * allowOntoPartner; // exclusive
      for (
        let file = kingToFile + step;
        !squaresAttacked &&
        (slideRight ? file < farLimit : file > farLimit) &&
        slideDistance <= this.maxSlideRange;
        file += step
      ) {
        const sq = board.rankFileToSquare(rank, file);
        if (this.hasCheckmateRule && game.isSquareAttacked(sq, game.currentSide ^ 1)) {
          squaresAttacked = true;
        }
        if (!squaresAttacked) {
          this.tryEmitCastling(list, cm, sq, board.rankFileToSquare(rank, file - step));
        }
        slideDistance++;
      }
    }
  }

  /**
   * Emit one castling move after translating destinations (a no-op in the
   * base rule; Alice maps them to the mirror sub-board) and checking those
   * destinations are empty. The `from` square in the emitted move stays on
   * the originating board so the move is recognised by the move tables.
   */
  protected tryEmitCastling(
    list: MoveList,
    cm: CastlingMove,
    kingDest: number,
    otherDest: number,
  ): void {
    const board = this.board!;
    const kingTo = this.translateDestination(kingDest);
    const otherTo = this.translateDestination(otherDest);
    if (kingTo !== kingDest || otherTo !== otherDest) {
      if (board.pieceAt(kingTo) !== null || board.pieceAt(otherTo) !== null) return;
    }
    list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, kingTo);
    const king = list.addPickup(cm.kingFromSquare);
    const other = list.addPickup(cm.otherFromSquare);
    list.addDrop(king, kingTo, null);
    list.addDrop(other, otherTo, null);
    list.endMoveAdd(1000);
  }

  /** Map a destination square (identity in the base rule). */
  protected translateDestination(square: number): number {
    return square;
  }
}
