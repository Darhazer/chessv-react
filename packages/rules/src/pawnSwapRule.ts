/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/FileSharing/PawnSwapRule.cs
 ***************************************************************************/

import {
  type MoveList,
  MoveType,
  type PieceType,
  PredefinedDirections,
  Rule,
} from '@chessv/engine';

/**
 * The File Sharing Chess rule: a pawn that stands directly in front of an
 * enemy pawn may swap places with it, provided that enemy pawn is not
 * currently attacking any of the moving player's pieces.
 */
export class PawnSwapRule extends Rule {
  readonly pawnType: PieceType;

  constructor(pawnType: PieceType) {
    super();
    this.pawnType = pawnType;
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, _ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const pawnTypeNumber = game.getPieceTypeNumber(this.pawnType);
    const pawns = board.getPieceTypeBitboard(game.currentSide, pawnTypeNumber).clone();
    for (;;) {
      const pawnSquare = pawns.extractLSB();
      if (pawnSquare < 0) break;
      const nextSquare = board.nextSquare(
        PredefinedDirections.N + game.currentSide,
        pawnSquare,
      );
      if (nextSquare < 0) continue;
      const enemyPawn = board.pieceAt(nextSquare);
      if (
        enemyPawn == null ||
        game.getPieceTypeNumber(enemyPawn.pieceType) !== pawnTypeNumber ||
        enemyPawn.player === game.currentSide
      ) {
        continue;
      }
      // The swap is only legal if the enemy pawn does not currently attack
      // any of the moving player's pieces.
      const attackSquare1 = board.nextSquare(PredefinedDirections.E, pawnSquare);
      const attackSquare2 = board.nextSquare(PredefinedDirections.W, pawnSquare);
      const attacks1 = attackSquare1 >= 0 ? board.pieceAt(attackSquare1) : null;
      const attacks2 = attackSquare2 >= 0 ? board.pieceAt(attackSquare2) : null;
      if (
        (attacks1 == null || attacks1.player !== game.currentSide) &&
        (attacks2 == null || attacks2.player !== game.currentSide)
      ) {
        list.beginMoveAdd(MoveType.Swap, pawnSquare, nextSquare);
        const myPawn = list.addPickup(pawnSquare);
        const captured = list.addPickup(nextSquare);
        list.addDrop(myPawn, nextSquare);
        list.addDrop(captured, pawnSquare);
        list.endMoveAdd(25);
      }
    }
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (type === this.pawnType) notes.push('pawn swap ability');
  }
}
