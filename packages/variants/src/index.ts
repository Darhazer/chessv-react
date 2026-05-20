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
import {
  BirdsChess,
  CapablancaChess,
  EmbassyChess,
  GothicChess,
  ModernCarrerasChess,
  OptiChess,
  VictorianChess,
} from './v10x8/capablancaChess.js';
import { CapablancaShatranj } from './v10x8/capablancaShatranj.js';
import { GreatShatranj, GreatShatranjR } from './v10x8/greatShatranj.js';
import { JanusChess } from './v10x8/janusChess.js';
import { LionsAndUnicornsChess } from './v10x8/lionsAndUnicornsChess.js';
import { NewChancellorChess } from './v10x8/newChancellorChess.js';
import { ChancellorChess } from './v9x9/chancellorChess.js';
import { MinistersChess } from './v9x9/ministersChess.js';
import { Warochess } from './v9x9/warochess.js';
import { MainzerSchach } from './v11x8/mainzerSchach.js';
import { WildebeestChess } from './v11x10/wildebeestChess.js';
import { CagliostrosChess } from './v12x8/cagliostrosChess.js';
import { CourierChess } from './v12x8/courierChess.js';
import { JanusKamilChess } from './v12x10/janusKamilChess.js';
import { ChessOnA12x12Board } from './v12x12/chessOnA12x12Board.js';
import { DoubleChess16x8 } from './v16x8/doubleChess16x8.js';
import { VikingChess } from './vMiscellaneous/vikingChess.js';
import { GildedGrandShatranj, GrandShatranj } from './v10x10/grandShatranj.js';
import { GreatChess } from './v10x10/greatChess.js';
import { RomanChess } from './v10x10/romanChess.js';
import { SacChess } from './v10x10/sacChess.js';
import { Shako } from './v10x10/shako.js';
import { ShatranjKamilX } from './v10x10/shatranjKamilX.js';
import { UnicornGreatChess } from './v10x10/unicornGreatChess.js';
import { registerVariant } from './registry.js';

export { GenericChess } from './abstract/genericChess.js';
export { Generic__x8 } from './abstract/generic__x8.js';
export { Generic8x8 } from './abstract/generic8x8.js';
export { Generic10x8 } from './abstract/generic10x8.js';
export { Generic__x9 } from './abstract/generic__x9.js';
export { Generic9x9 } from './abstract/generic9x9.js';
export { Generic__x10 } from './abstract/generic__x10.js';
export { Generic10x10 } from './abstract/generic10x10.js';
export { Generic__x12 } from './abstract/generic__x12.js';
export { Generic11x8 } from './abstract/generic11x8.js';
export { Generic11x10 } from './abstract/generic11x10.js';
export { Generic12x8 } from './abstract/generic12x8.js';
export { Generic12x10 } from './abstract/generic12x10.js';
export { Generic12x12 } from './abstract/generic12x12.js';
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
  BirdsChess,
  CapablancaChess,
  EmbassyChess,
  GothicChess,
  ModernCarrerasChess,
  OptiChess,
  VictorianChess,
} from './v10x8/capablancaChess.js';
export { CapablancaShatranj } from './v10x8/capablancaShatranj.js';
export { GreatShatranj, GreatShatranjR } from './v10x8/greatShatranj.js';
export { JanusChess } from './v10x8/janusChess.js';
export { LionsAndUnicornsChess } from './v10x8/lionsAndUnicornsChess.js';
export { NewChancellorChess } from './v10x8/newChancellorChess.js';
export { ChancellorChess } from './v9x9/chancellorChess.js';
export { MinistersChess } from './v9x9/ministersChess.js';
export { Warochess } from './v9x9/warochess.js';
export { MainzerSchach } from './v11x8/mainzerSchach.js';
export { WildebeestChess } from './v11x10/wildebeestChess.js';
export { CagliostrosChess } from './v12x8/cagliostrosChess.js';
export { CourierChess } from './v12x8/courierChess.js';
export { JanusKamilChess } from './v12x10/janusKamilChess.js';
export { ChessOnA12x12Board } from './v12x12/chessOnA12x12Board.js';
export { DoubleChess16x8 } from './v16x8/doubleChess16x8.js';
export { VikingChess } from './vMiscellaneous/vikingChess.js';
export { GildedGrandShatranj, GrandShatranj } from './v10x10/grandShatranj.js';
export { GreatChess } from './v10x10/greatChess.js';
export { RomanChess } from './v10x10/romanChess.js';
export { SacChess } from './v10x10/sacChess.js';
export { Shako } from './v10x10/shako.js';
export { ShatranjKamilX } from './v10x10/shatranjKamilX.js';
export { UnicornGreatChess } from './v10x10/unicornGreatChess.js';
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

registerVariant({
  name: 'Great Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant', 'Historic'],
  invented: '1700s',
  inventedBy: 'Unknown',
  description: 'A historic 10 x 10 variant with the missing compounds and an Amazon.',
  create: () => new GreatChess(),
});

registerVariant({
  name: 'Roman Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '1999',
  inventedBy: 'Mark and Eric Woodall',
  description: 'A 10 x 10 variant adding a non-royal "Archer" general to each side.',
  create: () => new RomanChess(),
});

registerVariant({
  name: 'Shako',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '1997',
  inventedBy: 'Jean-Louis Cazaux',
  description: 'An East-meets-West game adding the Cannon from Xiangqi and a stronger Elephant.',
  create: () => new Shako(),
});

registerVariant({
  name: 'Unicorn Great Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2002',
  inventedBy: 'David Paulowich',
  description: 'A 10 x 10 variant adding the Lion and the Unicorn (Bishop + Nightrider).',
  colorScheme: 'Lesotho',
  create: () => new UnicornGreatChess(),
});

registerVariant({
  name: 'Shatranj Kamil X',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2007',
  inventedBy: 'David Paulowich',
  description: 'A 2007 10 x 10 expansion of the Shatranj Kamil family.',
  create: () => new ShatranjKamilX(),
});

registerVariant({
  name: 'Sac Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2015',
  inventedBy: 'Kevin Pacey',
  description: 'A piece-dense 10 x 10 variant with many powerful compound pieces.',
  create: () => new SacChess(),
});

registerVariant({
  name: 'Grand Shatranj D',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Joe Joyce',
  description: 'Joe Joyce\'s 10 x 10 variant of strong leaping pieces (Warmachine form).',
  create: () => new GrandShatranj('Grand Shatranj D'),
});

registerVariant({
  name: 'Grand Shatranj R',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Joe Joyce',
  description: 'Joe Joyce\'s 10 x 10 variant of strong leaping pieces (Rook form).',
  create: () => new GrandShatranj('Grand Shatranj R'),
});

registerVariant({
  name: 'Gilded Grand Shatranj',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Joe Joyce',
  description: 'The Grand Shatranj setup featuring both the Rook and the Lightning Warmachine.',
  create: () => new GildedGrandShatranj(),
});

// *** 10x8 VARIANTS *** //

registerVariant({
  name: 'Capablanca Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant', 'Historic', 'Popular'],
  invented: '1940',
  inventedBy: 'Jose Raul Capablanca',
  description: "Capablanca's 10 x 8 variant adding the Archbishop and Chancellor compounds.",
  create: () => new CapablancaChess(),
});

registerVariant({
  name: "Bird's Chess",
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant', 'Historic'],
  invented: '1874',
  inventedBy: 'Henry Bird',
  description: 'A Capablanca-family setup from 1874 by Henry Bird.',
  create: () => new BirdsChess(),
});

registerVariant({
  name: 'Embassy Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2005',
  inventedBy: 'Kevin Hill',
  description: 'A Capablanca-family setup from 2005 by Kevin Hill.',
  create: () => new EmbassyChess(),
});

registerVariant({
  name: 'Gothic Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2002',
  inventedBy: 'Ed Trice',
  description: 'A Capablanca-family setup from 2002 by Ed Trice.',
  create: () => new GothicChess(),
});

registerVariant({
  name: 'Victorian Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2005',
  inventedBy: 'David Paulowich; John Kipling Lewis',
  description: 'A Capablanca-family setup with close-rook castling.',
  create: () => new VictorianChess(),
});

registerVariant({
  name: 'Opti Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2006',
  inventedBy: 'Derek Nalls',
  description: 'A Capablanca-family setup from 2006 by Derek Nalls.',
  create: () => new OptiChess(),
});

registerVariant({
  name: "Modern Carrera's Chess",
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '1999',
  inventedBy: 'Fergus Duniho; Sam Trenholme',
  description: 'A modern arrangement of the historic Carrera 10 x 8 chess variant.',
  colorScheme: 'Buckingham Green',
  create: () => new ModernCarrerasChess(),
});

registerVariant({
  name: 'Capablanca Shatranj',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2006',
  inventedBy: 'Christine Bagley-Jones',
  description: 'A Capablanca-board variant with the leaping Minister and High Priestess.',
  create: () => new CapablancaShatranj(),
});

registerVariant({
  name: 'Janus Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Popular'],
  invented: '1978',
  inventedBy: 'Werner Schöndorf',
  description: 'A 10 x 8 variant with two Januses (Archbishops) and long castling.',
  create: () => new JanusChess(),
});

registerVariant({
  name: 'New Chancellor Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1997',
  inventedBy: 'David Paulowich',
  description: 'A 10 x 8 variant with the Chancellors in the corners.',
  create: () => new NewChancellorChess(),
});

registerVariant({
  name: 'Lions and Unicorns Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2005',
  inventedBy: 'David Paulowich',
  description: 'A 10 x 8 variant adding the Lion and the Unicorn (Bishop + Nightrider).',
  colorScheme: 'Lesotho',
  create: () => new LionsAndUnicornsChess(),
});

registerVariant({
  name: 'Great Shatranj D',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Joe Joyce',
  description: "Joe Joyce's 10 x 8 variant of strong leaping pieces (Dabbabah form).",
  create: () => new GreatShatranj('Great Shatranj D'),
});

registerVariant({
  name: 'Great Shatranj R',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Joe Joyce',
  description: "Joe Joyce's 10 x 8 variant of strong leaping pieces (Rook form).",
  create: () => new GreatShatranjR(),
});

// *** 9x9 VARIANTS *** //

registerVariant({
  name: 'Chancellor Chess',
  files: 9,
  ranks: 9,
  tags: ['Chess Variant', 'Historic'],
  invented: '1889',
  inventedBy: 'Ben Foster',
  description: 'An 1889 9 x 9 variant adding the Chancellor (Rook + Knight).',
  create: () => new ChancellorChess(),
});

registerVariant({
  name: 'Ministers Chess',
  files: 9,
  ranks: 9,
  tags: ['Chess Variant'],
  invented: '1975',
  inventedBy: 'Michael Corinthios',
  description: 'A 9 x 9 variant with the King flanked by two Ministers (Queens).',
  create: () => new MinistersChess(),
});

registerVariant({
  name: 'Warochess',
  files: 9,
  ranks: 9,
  tags: ['Chess Variant'],
  invented: '2010',
  inventedBy: 'Eric Warolus',
  description: 'A totally symmetric 9 x 9 variant adding a Queen, with no castling.',
  colorScheme: 'Luna Decorabat',
  create: () => new Warochess(),
});

// *** 11x8 VARIANTS *** //

registerVariant({
  name: 'Mainzer Schach',
  files: 11,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2004',
  inventedBy: 'Jörg Knappen',
  description: 'An 11 x 8 variant adding the Janus, Marshall and Amazon.',
  create: () => new MainzerSchach(),
});

// *** 11x10 VARIANTS *** //

registerVariant({
  name: 'Wildebeest Chess',
  files: 11,
  ranks: 10,
  tags: ['Chess Variant', 'Popular'],
  invented: '1987',
  inventedBy: 'R. Wayne Schmittberger',
  description:
    'An 11 x 10 variant balancing leaping pieces with the Camel and the Wildebeest (Knight + Camel).',
  colorScheme: 'Lemon Cappuccino',
  create: () => new WildebeestChess(),
});

// *** 12x8 VARIANTS *** //

registerVariant({
  name: "Cagliostro's Chess",
  files: 12,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1970s',
  inventedBy: 'Savio Cagliostro',
  description: 'A 12 x 8 variant adding the Archbishop, Chancellor and Amazon.',
  create: () => new CagliostrosChess(),
});

registerVariant({
  name: 'Courier Chess',
  files: 12,
  ranks: 8,
  tags: ['Chess Variant', 'Historic', 'Popular'],
  invented: '1200s',
  inventedBy: 'Unknown',
  description:
    'The medieval 12 x 8 game dating back to at least 1202 and played for six hundred years.',
  colorScheme: 'Sahara',
  create: () => new CourierChess(),
});

// *** 12x10 VARIANTS *** //

registerVariant({
  name: 'Janus Kamil Chess',
  files: 12,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2004',
  inventedBy: 'Jörg Knappen',
  description: 'A 12 x 10 variant adding the Janus and Camel with triple-step pawns.',
  create: () => new JanusKamilChess(),
});

// *** 12x12 VARIANTS *** //

registerVariant({
  name: 'Chess on a 12 by 12 Board',
  files: 12,
  ranks: 12,
  tags: ['Chess Variant'],
  invented: '2000',
  inventedBy: 'Doug Vogel',
  description: 'Standard chess pieces on a 12 x 12 board with a back rank on rank 3.',
  colorScheme: 'Baby Blues',
  create: () => new ChessOnA12x12Board(),
});

// *** 16x8 VARIANTS *** //

registerVariant({
  name: 'Double Chess (16 x 8)',
  files: 16,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1996',
  inventedBy: 'David Short',
  description: 'Chess played on a double-width board with two piece sets and three queens.',
  colorScheme: 'Golden Goose Egg',
  create: () => new DoubleChess16x8(),
});

// *** MISCELLANEOUS VARIANTS *** //

registerVariant({
  name: 'Viking Chess',
  files: 12,
  ranks: 7,
  tags: ['Chess Variant'],
  invented: '2002',
  inventedBy: 'Tomas Forsman',
  description:
    'A 12 x 7 variant by Tomas Forsman with both colors interleaved across the back ranks.',
  create: () => new VikingChess(),
});
