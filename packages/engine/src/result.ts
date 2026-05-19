/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/GameResult.cs (originally derived from Cute Chess
 *  by Ilari Pihlajisto and Arto Jonsson).
 ***************************************************************************/

/** How a game ended (or that it has not ended yet). */
export enum ResultType {
  /** Win by any means. */
  Win,
  /** Draw by any means. */
  Draw,
  /** The loser resigned. */
  Resignation,
  /** A player's time flag fell. */
  Timeout,
  /** Adjudicated by the interface. */
  Adjudication,
  /** The loser tried to make an illegal move. */
  IllegalMove,
  /** The loser disconnected or terminated. */
  Disconnection,
  /** The loser's connection stalled. */
  StalledConnection,
  /** Both players agreed to a result. */
  Agreement,
  /** No result yet — the game is still in progress. */
  NoResult,
  /** Result error, caused by an invalid result string. */
  ResultError,
}

/**
 * The outcome of a game: a {@link ResultType} plus the winning player number
 * (-1 when there is no winner).
 */
export class Result {
  readonly type: ResultType;
  /** The winning player number, or -1 if there is no winner. */
  readonly winner: number;
  private readonly description: string | null;

  constructor(type: ResultType = ResultType.NoResult, winner = -1, description: string | null = null) {
    this.type = type;
    this.winner = winner;
    this.description = description;
  }

  /** True when the game is still in progress. */
  get isNone(): boolean {
    return this.type === ResultType.NoResult;
  }

  /** True when the game ended in a draw. */
  get isDraw(): boolean {
    return (
      this.winner === -1 &&
      this.type !== ResultType.NoResult &&
      this.type !== ResultType.ResultError
    );
  }

  /** The losing player number, or -1 if there is no loser. */
  get loser(): number {
    return this.winner === -1 ? -1 : this.winner ^ 1;
  }

  /** Value equality: same type and winner. */
  equals(other: Result | null): boolean {
    return other !== null && this.type === other.type && this.winner === other.winner;
  }

  /** Compact representation: `1-0`, `0-1`, `1/2-1/2`, or `*`. */
  get shortString(): string {
    if (this.type === ResultType.NoResult || this.type === ResultType.ResultError) return '*';
    if (this.winner === 0) return '1-0';
    if (this.winner === 1) return '0-1';
    return '1/2-1/2';
  }

  /** Verbose representation: `result {description}`. */
  get verboseString(): string {
    return `${this.shortString} {${this.description ?? ''}}`;
  }
}
