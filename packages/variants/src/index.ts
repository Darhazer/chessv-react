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

import { BerolinaChess } from './v8x8/berolinaChess.js';
import { Chess } from './v8x8/chess.js';
import { Chess256 } from './v8x8/chess256.js';
import { ChessWithDifferentArmies } from './v8x8/chessWithDifferentArmies.js';
import { CorridorChess } from './v8x8/corridorChess.js';
import { DiamondChess } from './v8x8/diamondChess.js';
import { ExtinctionChess, KingletChess } from './v8x8/extinctionChess.js';
import { FileSharingChess } from './v8x8/fileSharingChess.js';
import { Knightmate } from './v8x8/knightmate.js';
import { Makruk } from './v8x8/makruk.js';
import { RelativeRoyaltyChess } from './v8x8/relativeRoyaltyChess.js';
import { RevisedChess } from './v8x8/revisedChess.js';
import { ModernShatranj, Shatranj } from './v8x8/shatranj.js';
import { ShatranjKamil64 } from './v8x8/shatranjKamil64.js';
import { WildCastle } from './v8x8/wildCastle.js';
import { registerVariant } from './registry.js';

export { GenericChess } from './abstract/genericChess.js';
export { Generic__x8 } from './abstract/generic__x8.js';
export { Generic8x8 } from './abstract/generic8x8.js';
export { BerolinaChess } from './v8x8/berolinaChess.js';
export { Chess } from './v8x8/chess.js';
export { Chess256 } from './v8x8/chess256.js';
export { ChessWithDifferentArmies } from './v8x8/chessWithDifferentArmies.js';
export { CorridorChess } from './v8x8/corridorChess.js';
export { DiamondChess } from './v8x8/diamondChess.js';
export { ExtinctionChess, KingletChess } from './v8x8/extinctionChess.js';
export { FileSharingChess } from './v8x8/fileSharingChess.js';
export { Knightmate } from './v8x8/knightmate.js';
export { Makruk } from './v8x8/makruk.js';
export { RelativeRoyaltyChess } from './v8x8/relativeRoyaltyChess.js';
export { RevisedChess } from './v8x8/revisedChess.js';
export { ModernShatranj, Shatranj } from './v8x8/shatranj.js';
export { ShatranjKamil64 } from './v8x8/shatranjKamil64.js';
export { WildCastle } from './v8x8/wildCastle.js';
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

registerVariant({
  name: 'Berolina Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Historic', 'Popular'],
  invented: '1926',
  inventedBy: 'Edmund Hebermann',
  description: 'Standard chess but with the pawn moves switched.',
  create: () => new BerolinaChess(),
});

registerVariant({
  name: 'Chess256',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Random Array'],
  invented: '2006',
  inventedBy: 'Mats Winther',
  description: 'A Chess derivative where the opening pawn formation is randomized.',
  create: () => new Chess256(),
});

registerVariant({
  name: 'Chess with Different Armies',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Popular', 'Different Armies'],
  invented: '1996',
  inventedBy: 'Ralph Betza',
  description: 'Each side may field one of four different but equal armies.',
  colorScheme: 'Orchid',
  create: () => new ChessWithDifferentArmies(),
});

registerVariant({
  name: 'Corridor Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1980',
  inventedBy: 'Tony Paletta',
  description: 'Standard Chess with a different setup and no castling.',
  create: () => new CorridorChess(),
});

registerVariant({
  name: 'Diamond Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Historic'],
  invented: '1886',
  inventedBy: 'J. A. Porterfield Rynd',
  description: 'Chess with the board rotated 45 degrees and a different opening position.',
  create: () => new DiamondChess(),
});

registerVariant({
  name: 'Extinction Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Popular'],
  invented: '1985',
  inventedBy: 'R. Wayne Schmittberger',
  description: 'Win by capturing all the pieces of any one type.',
  create: () => new ExtinctionChess(),
});

registerVariant({
  name: 'Kinglet Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1953',
  inventedBy: 'V. R. Parton',
  description: "Win by capturing all of a player's pawns.",
  create: () => new KingletChess(),
});

registerVariant({
  name: 'File Sharing Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2016',
  inventedBy: 'Jeffrey T. Kubach',
  description: 'Directly opposed pawns may swap, reducing draws and opening positions.',
  create: () => new FileSharingChess(),
});

registerVariant({
  name: 'Relative Royalty Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2017',
  inventedBy: 'various',
  description: 'Each side has two kings; the one nearer its back rank is royal.',
  create: () => new RelativeRoyaltyChess(),
});

registerVariant({
  name: 'Revised Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2009',
  inventedBy: 'Mats Winther',
  description: 'The pawn gains the ability to capture forward on the 7th rank.',
  create: () => new RevisedChess(),
});

registerVariant({
  name: 'Shatranj Kamil (64)',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2005',
  inventedBy: 'David Paulowich',
  description: 'A 2005 expansion of Shatranj with a stronger Elephant and a Silver General.',
  colorScheme: 'Lemon Cappuccino',
  create: () => new ShatranjKamil64(),
});

registerVariant({
  name: 'Wild Castle',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Random Array'],
  inventedBy: 'Unknown',
  description: 'A Chess derivative with randomized setup but normal castling.',
  create: () => new WildCastle(),
});
