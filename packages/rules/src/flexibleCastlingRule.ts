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
import { CastlingRule } from './castlingRule.js';

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
      const inEmptinessRange = (file: number): boolean =>
        slideRight
          ? file <= kingToFile || file <= otherFromFile
          : file >= kingToFile || file >= otherFromFile;
      for (
        let file = kingFromFile + step;
        squaresEmpty && inEmptinessRange(file);
        file += step
      ) {
        const sq = file * board.numRanks + rank;
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
          const sq = file * board.numRanks + rank;
          if (game.isSquareAttacked(sq, game.currentSide ^ 1)) squaresAttacked = true;
          slideDistance++;
        }
      } else {
        // No checkmate rule — accumulate slide distance for the cap.
        slideDistance += Math.abs(kingToFile - kingFromFile) + 1;
      }
      if (squaresAttacked) continue;

      // 3. Emit the canonical king-slides-to-kingToSquare move, with the
      //    partner piece jumping to the king's other side.
      const otherDropFile1 = kingToFile - step;
      const otherDrop1 = otherDropFile1 * board.numRanks + rank;
      list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, cm.kingToSquare);
      {
        const king = list.addPickup(cm.kingFromSquare);
        const other = list.addPickup(cm.otherFromSquare);
        list.addDrop(king, cm.kingToSquare, null);
        list.addDrop(other, otherDrop1, null);
        list.endMoveAdd(1000);
      }

      // 4. Try farther king destinations. The king may continue toward the
      //    partner piece up to (but normally not onto) its square. The
      //    `otherTo` field carries an allow-onto-partner flag (0 or 1).
      const allowOntoPartner = cm.otherToSquare;
      const farLimit = otherFromFile + step * allowOntoPartner; // exclusive
      const inFarRange = (file: number): boolean =>
        slideRight ? file < farLimit : file > farLimit;
      for (
        let file = kingToFile + step;
        !squaresAttacked && inFarRange(file) && slideDistance <= this.maxSlideRange;
        file += step
      ) {
        const sq = file * board.numRanks + rank;
        if (this.hasCheckmateRule && game.isSquareAttacked(sq, game.currentSide ^ 1)) {
          squaresAttacked = true;
        }
        if (!squaresAttacked) {
          const otherDrop = (file - step) * board.numRanks + rank;
          list.beginMoveAdd(MoveType.Castling, cm.kingFromSquare, sq);
          const king = list.addPickup(cm.kingFromSquare);
          const other = list.addPickup(cm.otherFromSquare);
          list.addDrop(king, sq, null);
          list.addDrop(other, otherDrop, null);
          list.endMoveAdd(1000);
        }
        slideDistance++;
      }
    }
  }
}
