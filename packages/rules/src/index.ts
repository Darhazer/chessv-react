/**
 * @chessv/rules — pluggable Rule subclasses.
 *
 * Ports ChessV.Games/Rules: castling, en passant, promotion, checkmate, the
 * fifty-move rule and draw by repetition. Each Rule overrides hooks on the
 * engine's Rule base class.
 */

export {
  AliceCastlingRule,
  AliceEnPassantRule,
  AliceFlexibleCastlingRule,
} from './aliceCastlingRules.js';
export { AliceRule } from './aliceRule.js';
export { BareKingRule } from './bareKingRule.js';
export { BasicPromotionRule } from './basicPromotionRule.js';
export { BerolinaEnPassantRule } from './berolinaEnPassantRule.js';
export { BrouhahaBorderRule } from './brouhahaBorderRule.js';
export { CastlingRule } from './castlingRule.js';
export { FlexibleCastlingRule } from './flexibleCastlingRule.js';
export { CheckmateRule } from './checkmateRule.js';
export { ColorboundPromotionRestrictionRule } from './colorboundPromotionRestrictionRule.js';
export {
  ComplexPromotionRule,
  type OptionalPromotionFromAndToLocationDelegate,
} from './complexPromotionRule.js';
export { DuplexChessMoveCompletionRule } from './duplexChessMoveCompletionRule.js';
export { EnPassantRule } from './enPassantRule.js';
export { ExtinctionRule } from './extinctionRule.js';
export { ExtraMovesForUnmovedPieceRule } from './extraMovesForUnmovedPieceRule.js';
export { GrossChessPromotionRule } from './grossChessPromotionRule.js';
export { KingFacingRule } from './kingFacingRule.js';
export { KingsFlightRule } from './kingsFlightRule.js';
export { KingsLeapRule } from './kingsLeapRule.js';
export { LocationVictoryConditionRule } from './locationVictoryConditionRule.js';
export { Move50Rule } from './move50Rule.js';
export { PieceLocationRestrictionRule } from './pieceLocationRestrictionRule.js';
export {
  DoubleMoveCompletionRule,
  MarseillaisMoveCompletionRule,
} from './multiMoveCompletionRules.js';
export { OptionalCaptureByOvertakeRule } from './optionalCaptureByOvertakeRule.js';
export { PawnSwapRule } from './pawnSwapRule.js';
export { PocketDropRule } from './pocketDropRule.js';
export {
  PromoteByReplacementRule,
  PromotionOption,
  type OptionalPromotionLocationDelegate,
} from './promoteByReplacementRule.js';
export { RelativeRoyaltyCheckmateRule } from './relativeRoyaltyCheckmateRule.js';
export { RepetitionDrawRule } from './repetitionDrawRule.js';
export { YangQiKingSwapRule } from './yangQiKingSwapRule.js';
