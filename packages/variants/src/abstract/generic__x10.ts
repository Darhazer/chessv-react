/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/Generic__x10.cs
 ***************************************************************************/

import { ChoiceVariable, Direction, MoveCapability, type Symmetry } from '@chessv/engine';
import { GenericChess } from './genericChess.js';

/**
 * Base class for chess variants on a board with 10 ranks. Adds optional
 * support for a number of different initial pawn multiple-move rules (en
 * passant comes from GenericChess).
 */
export abstract class Generic__x10 extends GenericChess {
  pawnMultipleMove!: ChoiceVariable;

  constructor(numFiles: number, symmetry: Symmetry) {
    super(numFiles, 10, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.pawnMultipleMove = new ChoiceVariable();
    this.pawnMultipleMove.addChoice('None', 'Pawns can never move more than a single space');
    this.pawnMultipleMove.addChoice('Double', 'Pawns on the second rank can move two spaces');
    this.pawnMultipleMove.addChoice(
      'Triple',
      'Pawns on the second rank can move up to three spaces',
    );
    this.pawnMultipleMove.addChoice(
      'Great',
      'Pawns on the second or third rank can move two spaces',
    );
    this.pawnMultipleMove.addChoice('Grand', 'Pawns on the third rank can move two spaces');
    this.pawnMultipleMove.addChoice(
      'Wildebeest',
      'Pawns on the second rank can move up to three spaces and pawns on the third rank can move two spaces',
    );
    this.pawnMultipleMove.addChoice(
      'Unicorn',
      'Pawns on the second rank can move two spaces as well as pawns on the third rank of the centermost file(s)',
    );
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

    const addDoubleMove = (minSteps: number, maxSteps: number, ranks: number[]): void => {
      const move = new MoveCapability();
      move.minSteps = minSteps;
      move.maxSteps = maxSteps;
      move.mustCapture = false;
      move.canCapture = false;
      move.direction = new Direction(1, 0);
      move.condition = (location) => ranks.includes(location.rank);
      this.pawn.addMoveCapability(move);
    };

    if (value === 'Double') {
      addDoubleMove(2, 2, [1]);
    } else if (value === 'Triple' || value === 'Wildebeest') {
      addDoubleMove(2, 3, [1]);
      if (value === 'Wildebeest') addDoubleMove(2, 2, [2]);
    } else if (value === 'Great') {
      addDoubleMove(2, 2, [1, 2]);
    } else if (value === 'Grand') {
      addDoubleMove(2, 2, [2]);
    } else if (value === 'Unicorn') {
      const numFiles = this.board.numFiles;
      const file1 = Math.floor(numFiles / 2);
      const file2 = Math.floor((numFiles - 1) / 2);
      const move = new MoveCapability();
      move.minSteps = 2;
      move.maxSteps = 2;
      move.mustCapture = false;
      move.canCapture = false;
      move.direction = new Direction(1, 0);
      move.condition = (location) =>
        location.rank === 1 ||
        (location.rank === 2 && (location.file === file1 || location.file === file2));
      this.pawn.addMoveCapability(move);
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
