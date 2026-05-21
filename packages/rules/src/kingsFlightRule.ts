/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/KingsCourt/KingsFlightRule.cs
 ***************************************************************************/

import {
  type Game,
  type MoveList,
  MoveType,
  type PieceType,
  Rule,
} from '@chessv/engine';

/**
 * King's-flight rule (King's Court): when the opposing chasing piece is
 * lined up with the king and within its attack range, the king may flee
 * two squares in any direction in one move (instead of the usual one),
 * provided the intermediate square is empty.
 */
export class KingsFlightRule extends Rule {
  private readonly kingType: PieceType;
  private readonly chasingType: PieceType;
  private kingTypeNumber = -1;
  private chasingTypeNumber = -1;

  constructor(kingType: PieceType, chasingType: PieceType) {
    super();
    this.kingType = kingType;
    this.chasingType = chasingType;
  }

  override postInitialize(): void {
    super.postInitialize();
    const game = this.game as Game;
    this.kingTypeNumber = game.getPieceTypeNumber(this.kingType);
    this.chasingTypeNumber = game.getPieceTypeNumber(this.chasingType);
  }

  override generateSpecialMoves(list: MoveList, capturesOnly: boolean, _ply: number): void {
    if (capturesOnly) return;
    const game = this.game!;
    const board = this.board!;
    const kingSquare = board.getPieceTypeBitboard(game.currentSide, this.kingTypeNumber).lsb;
    if (kingSquare < 0) return;

    const attackers = board.getPieceTypeBitboard(game.currentSide ^ 1, this.chasingTypeNumber);
    let threatened = false;
    for (const sq of attackers) {
      const direction = board.directionFromTo(sq, kingSquare);
      if (direction < 0) continue;
      const range = this.chasingType.attackRangePerDirection[direction] ?? 0;
      if (range >= board.getDistance(sq, kingSquare)) {
        threatened = true;
        break;
      }
    }
    if (!threatened) return;

    for (let dir = 0; dir < 8; dir++) {
      const intermediate = board.nextSquare(dir, kingSquare);
      if (intermediate < 0 || board.pieceAt(intermediate) !== null) continue;
      const target = board.nextSquare(dir, intermediate);
      if (target < 0) continue;
      const occupant = board.pieceAt(target);
      if (occupant === null) {
        list.beginMoveAdd(MoveType.StandardMove, kingSquare, target);
        const king = list.addPickup(kingSquare);
        list.addDrop(king, target, null);
        list.endMoveAdd(150);
      } else if (occupant.player !== game.currentSide) {
        list.beginMoveAdd(MoveType.StandardCapture, kingSquare, target);
        const king = list.addPickup(kingSquare);
        list.addPickup(target);
        list.addDrop(king, target, null);
        list.endMoveAdd(3000 + occupant.pieceType.midgameValue);
      }
    }
  }
}
