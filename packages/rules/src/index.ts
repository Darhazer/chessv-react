/**
 * @chessv/rules — pluggable Rule subclasses.
 *
 * Ports ChessV.Games/Rules: castling, en passant, promotion, checkmate, the
 * fifty-move rule and draw by repetition. Each Rule overrides hooks on the
 * engine's Rule base class.
 */

export { BareKingRule } from './bareKingRule.js';
export { BasicPromotionRule } from './basicPromotionRule.js';
export { CastlingRule } from './castlingRule.js';
export { CheckmateRule } from './checkmateRule.js';
export { EnPassantRule } from './enPassantRule.js';
export { Move50Rule } from './move50Rule.js';
export { RepetitionDrawRule } from './repetitionDrawRule.js';
