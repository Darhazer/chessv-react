/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic__x12.cs
 ***************************************************************************/

import { ChoiceVariable, Direction, MoveCapability, type Symmetry } from '@chessv/engine';
import { GenericChess } from './genericChess.js';

/**
 * Base class for chess variants on a board with 12 ranks. Adds optional
 * support for a number of different initial pawn multiple-move rules (en
 * passant comes from GenericChess).
 *
 * The pawn-rule keys ("@2(2)", "@3(2,3)", ...) match the C# source so derived
 * variants can use the same strings.
 */
export abstract class Generic__x12 extends GenericChess {
  pawnMultipleMove!: ChoiceVariable;

  constructor(numFiles: number, symmetry: Symmetry) {
    super(numFiles, 12, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.pawnMultipleMove = new ChoiceVariable();
    this.pawnMultipleMove.addChoice('None', 'Pawns can never move more than a single space');
    this.pawnMultipleMove.addChoice(
      '@2(2)',
      'Pawns can move two spaces when on the second rank',
    );
    this.pawnMultipleMove.addChoice(
      '@2(2,3)',
      'Pawns can move two or three spaces when on the second rank',
    );
    this.pawnMultipleMove.addChoice(
      '@2(2,3,4)',
      'Pawns can move up to four spaces when on the second rank',
    );
    this.pawnMultipleMove.addChoice(
      '@3(2)',
      'Pawns can move two spaces when on the third rank',
    );
    this.pawnMultipleMove.addChoice(
      '@3(2,3)',
      'Pawns can move two or three spaces when on the third rank',
    );
    this.pawnMultipleMove.addChoice('@4(2)', 'Pawns can move two spaces when on the fourth rank');
    this.pawnMultipleMove.addChoice('Fast Pawn', 'Pawns can move two spaces from any location');
    this.pawnMultipleMove.addChoice(
      'Custom',
      'Indicates a custom rule implemented by derived class',
    );
    this.pawnMultipleMove.value = 'None';
  }

  protected override addRules(): void {
    super.addRules();
    if (!this.pawn.enabled) return;

    const value = this.pawnMultipleMove.value;

    const addRankMove = (minSteps: number, maxSteps: number, rank: number): void => {
      const move = new MoveCapability();
      move.minSteps = minSteps;
      move.maxSteps = maxSteps;
      move.mustCapture = false;
      move.canCapture = false;
      move.direction = new Direction(1, 0);
      move.condition = (location) => location.rank === rank;
      this.pawn.addMoveCapability(move);
    };

    // The "@N(K[,L,...])" rules read the last numeric character as the maximum
    // number of steps and the second-to-last digit (the "N") as the rank.
    if (value === '@2(2)' || value === '@2(2,3)' || value === '@2(2,3,4)') {
      const maxSteps = Number(value.charAt(value.length - 2));
      addRankMove(2, maxSteps, 1);
    } else if (value === '@3(2)' || value === '@3(2,3)') {
      const maxSteps = Number(value.charAt(value.length - 2));
      addRankMove(2, maxSteps, 2);
    } else if (value === '@4(2)') {
      addRankMove(2, 2, 3);
    } else if (value === 'Fast Pawn') {
      // Find the pawn's forward move capability and extend it to two spaces.
      const { moves, count } = this.pawn.getMoveCapabilities();
      for (let i = 0; i < count; i++) {
        const move = moves[i]!;
        if (
          move.direction.rankOffset === 1 &&
          move.direction.fileOffset === 0 &&
          move.maxSteps === 1 &&
          !move.canCapture
        ) {
          move.maxSteps = 2;
          break;
        }
      }
    }
  }
}
