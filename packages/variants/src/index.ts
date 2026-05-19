/**
 * @chessv/variants — the chess-variant definitions.
 *
 * Ports ChessV.Games: the Abstract/Generic* base classes and the variant
 * classes. The C# `[Game]` attribute is replaced by `registerVariant`, which
 * the UI catalog reads.
 *
 * Phase 1 ships the standard-chess line; the remaining ~159 variants follow
 * in Phase 3.
 */

import { Chess } from './v8x8/chess.js';
import { registerVariant } from './registry.js';

export { GenericChess } from './abstract/genericChess.js';
export { Generic__x8 } from './abstract/generic__x8.js';
export { Generic8x8 } from './abstract/generic8x8.js';
export { Chess } from './v8x8/chess.js';
export {
  type VariantMeta,
  createVariant,
  getVariant,
  listVariants,
  registerVariant,
  variantsByTag,
} from './registry.js';

registerVariant({
  name: 'Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Historic', 'Regional', 'Popular'],
  invented: 'circa 8th century',
  inventedBy: 'Unknown',
  description: 'The classic game of chess.',
  colorScheme: 'Luna Decorabat',
  create: () => new Chess(),
});
