/**
 * @chessv/engine — core game model.
 *
 * Ports ChessV.Base: the board, pieces, piece types, moves, rules, FEN parsing
 * and zobrist hashing. Contains no DOM or React dependencies so it runs unchanged
 * inside the AI Web Worker.
 */

export const ENGINE_VERSION = '0.0.0';

// *** BASICS *** //
export {
  Direction,
  Location,
  MoveEventResponse,
  MoveNotation,
  MoveType,
  PerftResults,
  PredefinedDirections,
  SpecialAttacks,
  moveTypeHasProperty,
} from './basics.js';
export type { Drop, Pickup } from './basics.js';

// *** CONSTANTS *** //
export {
  INFINITY,
  MAX_DIRECTIONS,
  MAX_GAME_LENGTH,
  MAX_PIECE_TYPES,
  MAX_PIECES,
  MAX_PLY,
  ONEPLY,
} from './constants.js';

// *** CORE MODEL *** //
export { Board, MAX_FILES, MAX_RANKS, MAX_SQUARES, NOT_CONNECTED } from './board.js';
export { BoardWithPockets } from './boardWithPockets.js';
export { TwoBoards } from './twoBoards.js';
export { BitBoard } from './bitBoard.js';
export { BoardMoveStack } from './boardMoveStack.js';
export { ChoiceVariable } from './choiceVariable.js';
export { applyMoveToken, exportPgn, importPgn, pgnDateToday } from './pgn.js';
export type { ParsedPgn, PgnTags } from './pgn.js';
export { ExObject } from './exObject.js';
export { FEN } from './fen.js';
export { Game, NodeType } from './game.js';
export type { SearchInfo } from './game.js';
export { Evaluation } from './evaluation.js';
export { Hashtable } from './hashtable.js';
export { HashType, TTHashEntry } from './ttHashEntry.js';
export { Statistics } from './statistics.js';
export { TimeControl } from './timeControl.js';
export { GenericPiece } from './genericPiece.js';
export { HashKeys } from './hashKeys.js';
export { MoveCapability } from './moveCapability.js';
export type { ConditionalLocationDelegate } from './moveCapability.js';
export { MoveCompletionDefaultRule, MoveCompletionRule } from './moveCompletionRule.js';
export { MoveInfo } from './moveInfo.js';
export { MoveList, MAX_MOVES } from './moveList.js';
export type { Counter3D } from './moveList.js';
export { Movement } from './movement.js';
export { MovePathInfo } from './movePathInfo.js';
export { Piece } from './piece.js';
export { PieceType, setPstRandom } from './pieceType.js';
export type { CustomMoveGenerationHandler } from './pieceType.js';
export { Result, ResultType } from './result.js';
export { PromotionRule, Rule } from './rule.js';
export { PV, SearchStack, createSearchStack } from './searchTypes.js';
export { MirrorSymmetry, NoSymmetry, RotationalSymmetry, Symmetry } from './symmetry.js';
