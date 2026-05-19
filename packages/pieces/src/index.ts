/**
 * @chessv/pieces — piece-type definitions.
 *
 * Ports ChessV.Games/Pieces: the data-driven move capabilities for chess,
 * shogi, xiangqi and fairy pieces. Each definition configures the engine's
 * PieceType with move atoms, slides, values and notation.
 */

export {
  Camel,
  Dabbabah,
  Elephant,
  Ferz,
  Nightrider,
  Tribbabah,
  Wazir,
  Zebra,
} from './movementAtoms.js';
export { Bishop, King, Knight, Pawn, Queen, Rook } from './chess.js';
export { SilverGeneral } from './shogi.js';
export {
  Archbishop,
  BerolinaPawn,
  Chancellor,
  ChargingKnight,
  ChargingRook,
  Cleric,
  Colonel,
  DiamondPawn,
  Lion,
  NarrowKnight,
  Phoenix,
  ShortRook,
  Tower,
  WarElephant,
} from './fairy.js';
