/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Rules/Extinction/ExtinctionRule.cs
 ***************************************************************************/

import { MoveEventResponse, type PieceType, Rule } from '@chessv/engine';

/**
 * The victory condition of Extinction Chess (and Kinglet): a player loses as
 * soon as the last piece of any of the listed types is captured.
 *
 * Constructed with a string of the notations of the relevant types.
 */
export class ExtinctionRule extends Rule {
  private readonly extinctionTypesNotation: string;
  private extinctionTypeNumbers: number[] = [];

  constructor(types: string) {
    super();
    this.extinctionTypesNotation = types;
  }

  override postInitialize(): void {
    super.postInitialize();
    const types = this.game!.parseTypeListFromString(this.extinctionTypesNotation);
    this.extinctionTypeNumbers = types.map((type) => this.game!.getPieceTypeNumber(type));
  }

  override testForWinLossDraw(currentPlayer: number, _ply: number): MoveEventResponse {
    const board = this.board!;
    for (const typeNumber of this.extinctionTypeNumbers) {
      if (board.getPieceTypeBitboard(currentPlayer, typeNumber).bitCount === 0) {
        return MoveEventResponse.GameLost;
      }
      if (board.getPieceTypeBitboard(currentPlayer ^ 1, typeNumber).bitCount === 0) {
        return MoveEventResponse.GameWon;
      }
    }
    return MoveEventResponse.NotHandled;
  }

  override getNotesForPieceType(type: PieceType, notes: string[]): void {
    if (this.extinctionTypeNumbers.includes(this.game!.getPieceTypeNumber(type))) {
      notes.push('extinction loses');
    }
  }
}
