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
  Amazon,
  Archbishop,
  BerolinaPawn,
  CamelGeneral,
  Centaur,
  ChainedPadwar,
  Champion,
  Chancellor,
  ChargingKnight,
  ChargingRook,
  Cleric,
  Colonel,
  DiamondPawn,
  DragonHorse,
  DragonKing,
  FreePadwar,
  General,
  GoldGeneral,
  HighPriestess,
  JumpingGeneral,
  LightningWarmachine,
  Lion,
  Minister,
  NarrowKnight,
  Oliphant,
  Phoenix,
  Scout,
  ShortRook,
  SideMoverGeneral,
  Squirrel,
  SquirrelGeneral,
  Tower,
  Unicorn,
  VerticalMoverGeneral,
  WarElephant,
  Wildebeest,
  Wizard,
} from './fairy.js';
export { BentHero, BentShaman, Falcon, SlidingGeneral } from './multiPath.js';
export { Cannon, Vao } from './xiangqi.js';
