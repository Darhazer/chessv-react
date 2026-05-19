/**
 * @chessv/variants — the chess-variant definitions.
 *
 * Ports ChessV.Games: the Abstract/Generic* base classes and the variant
 * classes. The C# `[Game]` attribute is replaced by `registerVariant`, which
 * the UI catalog reads.
 *
 * Phase 3 ports the variants in batches; the registrations below grow as more
 * are added.
 */

import { Chess } from './v8x8/chess.js';
import { Knightmate } from './v8x8/knightmate.js';
import { Makruk } from './v8x8/makruk.js';
import { ModernShatranj, Shatranj } from './v8x8/shatranj.js';
import { registerVariant } from './registry.js';

export { GenericChess } from './abstract/genericChess.js';
export { Generic__x8 } from './abstract/generic__x8.js';
export { Generic8x8 } from './abstract/generic8x8.js';
export { Chess } from './v8x8/chess.js';
export { Knightmate } from './v8x8/knightmate.js';
export { Makruk } from './v8x8/makruk.js';
export { ModernShatranj, Shatranj } from './v8x8/shatranj.js';
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

registerVariant({
  name: 'Shatranj',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Historic', 'Popular'],
  invented: 'circa 7th century',
  inventedBy: 'Unknown',
  description: 'The medieval Persian ancestor of chess.',
  create: () => new Shatranj(),
});

registerVariant({
  name: 'Modern Shatranj',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2005',
  inventedBy: 'Joe Joyce',
  description: 'A modernization of Shatranj with stronger Elephants and Generals.',
  create: () => new ModernShatranj(),
});

registerVariant({
  name: 'Makruk',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Regional', 'Historic'],
  inventedBy: 'Unknown',
  description: 'The traditional chess of Thailand.',
  create: () => new Makruk(),
});

registerVariant({
  name: 'Knightmate',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Popular'],
  invented: '1972',
  inventedBy: 'Bruce Zimov',
  description: 'Two kings flank a royal Knight — checkmate the Knight to win.',
  colorScheme: 'Cinnamon',
  create: () => new Knightmate(),
});
