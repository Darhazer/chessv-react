/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Abstract/GenericChess.cs
 *
 *  Phase 1 note: the C# `AddEvaluations` (pawn-structure, development, ...) is
 *  evaluation-only and deferred to Phase 2, so it is not overridden here.
 ***************************************************************************/

import {
  ChoiceVariable,
  type ConditionalLocationDelegate,
  Direction,
  Game,
  type Location,
  MoveEventResponse,
  type PieceType,
  type Symmetry,
} from '@chessv/engine';
import { King, Pawn } from '@chessv/pieces';
import {
  BasicPromotionRule,
  CastlingRule,
  CheckmateRule,
  EnPassantRule,
  Move50Rule,
  RepetitionDrawRule,
} from '@chessv/rules';

/**
 * Base class for chess-like variants: provides a royal King and standard
 * pawns, the fifty-move and draw-by-repetition rules, and the standard FEN
 * format. Other `Generic*` board classes extend this.
 */
export abstract class GenericChess extends Game {
  // *** PIECE TYPES *** //
  king!: PieceType;
  pawn!: PieceType;
  // Created by board-size subclasses, declared here for uniformity.
  queen!: PieceType;
  rook!: PieceType;
  bishop!: PieceType;
  knight!: PieceType;

  // *** GAME VARIABLES *** //
  stalemateResult!: ChoiceVariable;
  promotionRule!: ChoiceVariable;
  promotionTypes = '';
  bareKing = false;
  enPassant = false;
  promotingType: PieceType | null = null;
  castlingType: PieceType | null = null;

  protected castlingRule: CastlingRule | null = null;

  constructor(numFiles: number, numRanks: number, symmetry: Symmetry) {
    super(2, numFiles, numRanks, symmetry);
  }

  protected override setGameVariables(): void {
    super.setGameVariables();
    this.fenFormat = '{array} {current player} {castling} {en-passant} {half-move clock} {turn number}';
    this.fenStart = '#{Array} w #default #default 0 1';
    this.stalemateResult = new ChoiceVariable(['Draw', 'Win', 'Loss']);
    this.stalemateResult.value = 'Draw';
    this.promotionRule = new ChoiceVariable(['None', 'Standard', 'Replacement', 'Custom']);
    this.promotionRule.value = 'Standard';
    this.promotionTypes = '';
    this.bareKing = false;
  }

  protected override addPieceTypes(): void {
    this.addPieceType((this.king = new King('King', 'K', 0, 0)));
    this.addPieceType((this.pawn = new Pawn('Pawn', 'P', 100, 125)));
    this.castlingType = this.king;
  }

  protected override addRules(): void {
    // *** PROMOTION *** //
    if (this.promotionRule.value === 'Standard') {
      this.promotingType ??= this.pawn;
      const availablePromotionTypes = this.parseTypeListFromString(this.promotionTypes);
      this.addBasicPromotionRule(
        this.promotingType,
        availablePromotionTypes,
        (loc: Location) => loc.rank === this.board.numRanks - 1,
      );
    }
    // (The "Replacement" promotion rule is ported in a later phase.)

    // *** EN PASSANT *** //
    if (this.enPassant && this.pawn.enabled) {
      this.addEnPassantRule(this.pawn, new Direction(1, 0));
    }

    // (The "Bare King" rule is ported in a later phase.)

    // Base AddRules adds the move-completion rule. The C# `[Royal]` attribute
    // added the CheckmateRule here; the web port adds it explicitly.
    super.addRules();
    this.addRule(new CheckmateRule(this.king));

    // *** STALEMATE RESULT *** //
    const checkmateRule = this.findRule(CheckmateRule);
    if (checkmateRule != null) {
      if (this.stalemateResult.value === 'Loss') {
        checkmateRule.stalemateResult = MoveEventResponse.GameLost;
      } else if (this.stalemateResult.value === 'Win') {
        checkmateRule.stalemateResult = MoveEventResponse.GameWon;
      }
    }

    // *** FIFTY-MOVE & REPETITION *** //
    this.addRule(new Move50Rule(this.pawn));
    this.addRule(new RepetitionDrawRule());
  }

  protected override reorderRules(): void {
    super.reorderRules();
    // The repetition rule must run last so it sees the final position state.
    const index = this.rules.findIndex((rule) => rule instanceof RepetitionDrawRule);
    if (index >= 0) {
      const [rule] = this.rules.splice(index, 1);
      this.rules.push(rule!);
    }
  }

  // *** HELPERS *** //

  /** Add an en-passant rule for the given pawn type and forward direction. */
  protected addEnPassantRule(pawnType: PieceType, direction: Direction): void {
    this.addRule(new EnPassantRule(pawnType, this.getDirectionNumber(direction)));
  }

  /** Add a standard castling rule and remember it for {@link castlingMove}. */
  protected addCastlingRule(): void {
    this.castlingRule = new CastlingRule();
    this.addRule(this.castlingRule);
  }

  /** Register one castling move, using square notation. */
  protected castlingMove(
    player: number,
    kingFrom: string,
    kingTo: string,
    otherFrom: string,
    otherTo: string,
    privChar: string,
  ): void {
    this.castlingRule!.addCastlingMove(
      player,
      this.notationToSquare(kingFrom),
      this.notationToSquare(kingTo),
      this.notationToSquare(otherFrom),
      this.notationToSquare(otherTo),
      privChar,
    );
  }

  /** Add a standard promotion rule. */
  protected addBasicPromotionRule(
    promotingType: PieceType,
    availablePromotionTypes: PieceType[],
    destinationCondition: ConditionalLocationDelegate,
    originCondition: ConditionalLocationDelegate | null = null,
  ): void {
    this.promotingType ??= promotingType;
    this.addRule(
      new BasicPromotionRule(
        promotingType,
        availablePromotionTypes,
        destinationCondition,
        originCondition,
      ),
    );
  }
}
