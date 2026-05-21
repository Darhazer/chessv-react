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
import { ChessWithPockets } from './v8x8/chessWithPockets.js';
import { CylindricalChess } from './v8x8/cylindricalChess.js';
import { DuplexChess } from './v8x8/duplexChess.js';
import { LemurianShatranj } from './v8x8/lemurianShatranj.js';
import { MecklenbeckChess } from './v8x8/mecklenbeckChess.js';
import { Chess480, FischerRandomChess } from './v8x8/fischerRandomChess.js';
import { DoublemoveChess, MarseillaisChess } from './v8x8/multiMoveChess.js';
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
  CarrerasChess,
  EmbassyChess,
  GothicChess,
  GrotesqueChess,
  LadoreanChess,
  ModernCarrerasChess,
  OptiChess,
  SchoolbookChess,
  UniversChess,
  VictorianChess,
} from './v10x8/capablancaChess.js';
import { CapablancaShatranj } from './v10x8/capablancaShatranj.js';
import { GreatShatranj, GreatShatranjR } from './v10x8/greatShatranj.js';
import { FalconChess } from './v10x8/falconChess.js';
import { JanusChess } from './v10x8/janusChess.js';
import { LionsAndUnicornsChess } from './v10x8/lionsAndUnicornsChess.js';
import { NewChancellorChess } from './v10x8/newChancellorChess.js';
import { ChancellorChess } from './v9x9/chancellorChess.js';
import { MinistersChess } from './v9x9/ministersChess.js';
import { Warochess } from './v9x9/warochess.js';
import { MainzerSchach } from './v11x8/mainzerSchach.js';
import { WildebeestChess } from './v11x10/wildebeestChess.js';
import { YangQi } from './v9x10/yangQi.js';
import { ArchCourierChess } from './v12x8/archCourierChess.js';
import { CagliostrosChess } from './v12x8/cagliostrosChess.js';
import { CourierChess } from './v12x8/courierChess.js';
import { CourierChessModerno } from './v12x8/courierChessModerno.js';
import { KingsCourt } from './v12x8/kingsCourt.js';
import { JanusKamilChess } from './v12x10/janusKamilChess.js';
import { ChessAndAHalf } from './v12x12/chessAndAHalf.js';
import { ChessOnA12x12Board } from './v12x12/chessOnA12x12Board.js';
import { GrossChess } from './v12x12/grossChess.js';
import { DoubleChess16x8 } from './v16x8/doubleChess16x8.js';
import { AliceChess } from './vMiscellaneous/aliceChess.js';
import { VikingChess } from './vMiscellaneous/vikingChess.js';
import { Archchess } from './v10x10/archchess.js';
import { Brouhaha } from './v10x10/brouhaha.js';
import { Colossus } from './v10x10/colossus.js';
import { EurasianChess } from './v10x10/eurasianChess.js';
import {
  EmperorsGame,
  GrandChess,
  OpulentChess,
  TenCubedChess,
  UnicornGrandChess,
} from './v10x10/grandChess.js';
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
export { ChessWithPockets } from './v8x8/chessWithPockets.js';
export { CylindricalChess } from './v8x8/cylindricalChess.js';
export { DuplexChess } from './v8x8/duplexChess.js';
export { LemurianShatranj } from './v8x8/lemurianShatranj.js';
export { MecklenbeckChess } from './v8x8/mecklenbeckChess.js';
export { Chess480, FischerRandomChess, chess960BackRank } from './v8x8/fischerRandomChess.js';
export { DoublemoveChess, MarseillaisChess } from './v8x8/multiMoveChess.js';
export { WildCastle } from './v8x8/wildCastle.js';
export {
  BirdsChess,
  CapablancaChess,
  CarrerasChess,
  EmbassyChess,
  GothicChess,
  GrotesqueChess,
  LadoreanChess,
  ModernCarrerasChess,
  OptiChess,
  SchoolbookChess,
  UniversChess,
  VictorianChess,
} from './v10x8/capablancaChess.js';
export { CapablancaShatranj } from './v10x8/capablancaShatranj.js';
export { GreatShatranj, GreatShatranjR } from './v10x8/greatShatranj.js';
export { FalconChess } from './v10x8/falconChess.js';
export { JanusChess } from './v10x8/janusChess.js';
export { LionsAndUnicornsChess } from './v10x8/lionsAndUnicornsChess.js';
export { NewChancellorChess } from './v10x8/newChancellorChess.js';
export { ChancellorChess } from './v9x9/chancellorChess.js';
export { MinistersChess } from './v9x9/ministersChess.js';
export { Warochess } from './v9x9/warochess.js';
export { MainzerSchach } from './v11x8/mainzerSchach.js';
export { WildebeestChess } from './v11x10/wildebeestChess.js';
export { YangQi } from './v9x10/yangQi.js';
export { CagliostrosChess } from './v12x8/cagliostrosChess.js';
export { ArchCourierChess } from './v12x8/archCourierChess.js';
export { CourierChess } from './v12x8/courierChess.js';
export { CourierChessModerno } from './v12x8/courierChessModerno.js';
export { KingsCourt } from './v12x8/kingsCourt.js';
export { JanusKamilChess } from './v12x10/janusKamilChess.js';
export { ChessAndAHalf } from './v12x12/chessAndAHalf.js';
export { ChessOnA12x12Board } from './v12x12/chessOnA12x12Board.js';
export { GrossChess } from './v12x12/grossChess.js';
export { DoubleChess16x8 } from './v16x8/doubleChess16x8.js';
export { AliceChess } from './vMiscellaneous/aliceChess.js';
export { VikingChess } from './vMiscellaneous/vikingChess.js';
export { Archchess } from './v10x10/archchess.js';
export { Brouhaha } from './v10x10/brouhaha.js';
export { Colossus } from './v10x10/colossus.js';
export { EurasianChess } from './v10x10/eurasianChess.js';
export {
  EmperorsGame,
  GrandChess,
  OpulentChess,
  TenCubedChess,
  UnicornGrandChess,
} from './v10x10/grandChess.js';
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
  name: 'Fischer Random Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Popular', 'Random Array'],
  invented: '1996',
  inventedBy: 'Bobby Fischer',
  description:
    "Bobby Fischer's randomised opening: the back rank is shuffled to one of " +
    '960 starting positions, eliminating opening memorisation.',
  create: () => new FischerRandomChess(),
});

registerVariant({
  name: 'Chess480',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Random Array'],
  invented: '2005',
  inventedBy: 'John Kipling Lewis',
  description:
    'A Fischer Random variant where the king always slides two squares (or one ' +
    "from the b/g file) toward the nearest rook for castling.",
  create: () => new Chess480(),
});

registerVariant({
  name: 'Marseillais Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Popular', 'Historic', 'Multi-Move'],
  invented: 'circa 1920',
  inventedBy: 'Unknown',
  description:
    'After white opens with a single move, each side plays two moves per turn. ' +
    'Giving check on the first move ends the turn — the second move is forfeited.',
  create: () => new MarseillaisChess(),
});

registerVariant({
  name: 'Doublemove Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Multi-Move'],
  invented: '1957',
  inventedBy: 'Fred Galvin',
  description:
    'Both sides play two moves per turn (white opens with one). The king is a ' +
    'normal piece — there is no check; you win by capturing it.',
  create: () => new DoublemoveChess(),
});

registerVariant({
  name: 'Duplex Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Multi-Move'],
  invented: '2018',
  inventedBy: 'Greg Strong',
  description:
    'A modest 8 x 8 double-move variant with short-range pieces only. Three ' +
    'victory conditions: capture the king, capture the last pawn, or move a ' +
    'king to the back rank.',
  create: () => new DuplexChess(),
});

registerVariant({
  name: 'Cylindrical Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Historic', 'Popular'],
  invented: 'circa 10th century',
  inventedBy: 'Unknown',
  description:
    "Standard chess but the board's left and right edges are connected — pieces " +
    'wrap around as if the board were rolled into a cylinder.',
  create: () => new CylindricalChess(),
});

registerVariant({
  name: 'Mecklenbeck Chess',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Historic'],
  invented: '1973',
  inventedBy: 'Bernd Eickenscheidt; B. Schwarzkopf',
  description:
    'Standard chess with an extended promotion zone: pawns may promote on the ' +
    '6th or 7th rank, and must promote on the 8th.',
  create: () => new MecklenbeckChess(),
});

registerVariant({
  name: 'Lemurian Shatranj',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Joe Joyce',
  description:
    'A Shatranj-themed 8 x 8 variant with four multi-path pieces (Sliding ' +
    'General, Bent Shaman, Bent Hero, War Elephant); pawns must promote by ' +
    'replacement into a captured piece type, subject to colour-binding constraints.',
  create: () => new LemurianShatranj(),
});

registerVariant({
  name: 'Pocket Knight',
  files: 8,
  ranks: 8,
  tags: ['Chess Variant', 'Popular'],
  invented: 'circa 1900',
  inventedBy: 'Unknown',
  description:
    'Standard chess plus a Knight in each side’s pocket. On any turn a player ' +
    'may, in lieu of a move, drop their pocket Knight onto any empty board square.',
  colorScheme: 'Sahara',
  create: () => new ChessWithPockets(),
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
  name: 'Grand Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant', 'Popular'],
  invented: '1984',
  inventedBy: 'Christian Freeling',
  description:
    "Christian Freeling's popular 10 x 10 variant with the missing compound pieces " +
    'and promote-by-replacement on the 8th-10th ranks.',
  create: () => new GrandChess(),
});

registerVariant({
  name: 'Opulent Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2005',
  inventedBy: 'Greg Strong',
  description: 'Expanded Grand Chess with ten distinct piece types — Wizards and Lions join the line-up.',
  create: () => new OpulentChess(),
});

registerVariant({
  name: 'TenCubed Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2005',
  inventedBy: 'David Paolowich',
  description: 'A 10 x 10 variant with Wizards and Champions on a recessed third rank.',
  create: () => new TenCubedChess(),
});

registerVariant({
  name: 'Unicorn Grand Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'David Paulowich; Greg Strong',
  description: 'A Grand-Chess descendant swapping the Cardinal for a Unicorn and adding a Lion.',
  colorScheme: 'Lesotho',
  create: () => new UnicornGrandChess(),
});

registerVariant({
  name: "Emperor's Game",
  files: 10,
  ranks: 10,
  tags: ['Chess Variant', 'Historic'],
  invented: '1840',
  inventedBy: 'L. Tressan',
  description: 'A historic 10 x 10 variant from 19th-century Germany with a leaping General and Adjutant.',
  create: () => new EmperorsGame(),
});

registerVariant({
  name: 'Archchess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant', 'Historic'],
  invented: '1683',
  inventedBy: 'Francesco Piacenza',
  description:
    'A 17th-century 10 x 10 variant with a Decurion (Ferz), Centurion (Squirrel), ' +
    'and the historic "king\'s leap" — once per game each king may jump two squares orthogonally.',
  colorScheme: 'Grayscale',
  create: () => new Archchess(),
});

registerVariant({
  name: 'Eurasian Chess',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2003',
  inventedBy: 'Fergus Duniho',
  description:
    'A synthesis of European and Asian chess: the Grand Chess board plus the ' +
    'Cannon and Vao from Chinese Chess. Kings can\'t cross the river or face ' +
    'each other on an open line.',
  colorScheme: 'Buckingham Green',
  create: () => new EurasianChess(),
});

registerVariant({
  name: 'Brouhaha',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Greg Strong',
  description:
    'Standard chess framed by extra Clerics and Scouts on the border. Once a ' +
    'border piece moves off, nothing else may step onto its square — the game ' +
    'collapses to ordinary 8 x 8 chess as development progresses.',
  colorScheme: 'Buckingham Green',
  create: () => new Brouhaha(),
});

registerVariant({
  name: 'Colossus',
  files: 10,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2010',
  inventedBy: 'Charles Daniel',
  description:
    'A 10 x 10 variant with the standard pieces but twice as many rooks, knights ' +
    'and bishops, plus a bespoke 1-3 / 1-4 flexible castling style.',
  create: () => new Colossus(),
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
  name: "Carrera's Chess",
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant', 'Historic'],
  invented: '1617',
  inventedBy: 'Pietro Carrera',
  description: "Pietro Carrera's 1617 10 x 8 variant — the earliest of the Capablanca family.",
  create: () => new CarrerasChess(),
});

registerVariant({
  name: 'Schoolbook Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2006',
  inventedBy: 'Sam Trenholme',
  description: 'A Capablanca arrangement with flexible castling.',
  colorScheme: 'Sahara',
  create: () => new SchoolbookChess(),
});

registerVariant({
  name: 'Grotesque Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2004',
  inventedBy: 'Fergus Duniho',
  description: 'A Capablanca arrangement by Fergus Duniho using flexible castling.',
  colorScheme: 'Cinnamon',
  create: () => new GrotesqueChess(),
});

registerVariant({
  name: 'Ladorean Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2005',
  inventedBy: 'Bernhard U. Hermes',
  description: "Hermes's 2005 Capablanca arrangement using flexible castling.",
  create: () => new LadoreanChess(),
});

registerVariant({
  name: 'Univers Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant', 'Capablanca Variant'],
  invented: '2006',
  inventedBy: 'Fergus Duniho; Bruno Violet',
  description: 'A Capablanca arrangement by Duniho and Violet using flexible castling.',
  create: () => new UniversChess(),
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
  name: 'Falcon Chess',
  files: 10,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1992',
  inventedBy: 'George Duke',
  description:
    'A 10 x 8 variant adding the Falcon — a multi-path leaper that completes a ' +
    'three-step "knight-plus" jump if at least one of the three unit-step paths is clear.',
  colorScheme: 'Surrealistic Summer',
  create: () => new FalconChess(),
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

// *** 9x10 VARIANTS *** //

registerVariant({
  name: 'Yáng Qí',
  files: 9,
  ranks: 10,
  tags: ['Chess Variant'],
  invented: '2001',
  inventedBy: 'Fergus Duniho',
  description:
    'A 9 x 10 East-meets-West hybrid: orthodox pieces plus Chinese-style Cannons and Vaos ("Arrows"). ' +
    'The king has the swap ability with adjacent friendly pieces (not pawns); pawns promote by replacement.',
  colorScheme: 'Surrealistic Summer',
  create: () => new YangQi(),
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

registerVariant({
  name: 'Courier Chess Moderno',
  files: 12,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2008',
  inventedBy: 'Jose Carrillo',
  description:
    'A modernised version of historic Courier Chess. Adds the Mann, Schleich and ' +
    'Elephant (with 2-square leaps from its starting square). Win by capturing the ' +
    'last non-king piece (bare king).',
  create: () => new CourierChessModerno(),
});

registerVariant({
  name: 'ArchCourier Chess',
  files: 12,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '2006',
  inventedBy: 'Eric V. Greenwood',
  description:
    'A 12 x 8 variant packing the back rank with five fairy pieces (Crowned Rook, ' +
    'ArchCourier, Squirrel, Duke, Guard) plus the standard set. Replacement promotion.',
  create: () => new ArchCourierChess(),
});

registerVariant({
  name: "King's Court",
  files: 12,
  ranks: 8,
  tags: ['Chess Variant'],
  invented: '1997',
  inventedBy: 'Sidney LeVasseur',
  description:
    'A 12 x 8 variant with Jesters and short-range Chancellors. When a Chancellor ' +
    'lines up with the king, the king may flee two squares in any direction.',
  colorScheme: 'Golden Goose Egg',
  create: () => new KingsCourt(),
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

registerVariant({
  name: 'Gross Chess',
  files: 12,
  ranks: 12,
  tags: ['Chess Variant'],
  invented: '2009',
  inventedBy: 'Fergus Duniho',
  description:
    'A 12 x 12 super-variant with two ranks of pieces per side (Marshall, ' +
    'Archbishop, Vao, Wizard, Cannon, Champion plus the standard set). ' +
    'Pawns get a triple-step from rank 3 and the promotion zone restricts ' +
    'the strongest pieces to the very back rank.',
  colorScheme: 'Surrealistic Summer',
  create: () => new GrossChess(),
});

registerVariant({
  name: 'Chess and a Half',
  files: 12,
  ranks: 12,
  tags: ['Chess Variant'],
  invented: '2017',
  inventedBy: 'Nicolino Will',
  description:
    'A 12 x 12 variant with Guards, Cats (capture-by-overtake), Star Cats, ' +
    'Speedy Knights and Eques Rex; pawns can step sideways past the half-way line.',
  create: () => new ChessAndAHalf(),
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

registerVariant({
  name: 'Alice Chess',
  files: 16,
  ranks: 8,
  tags: ['Chess Variant', 'Multiple Boards', 'Historic', 'Popular'],
  invented: '1953',
  inventedBy: 'V. R. Parton',
  description:
    'Standard chess on two parallel boards: every move teleports the piece to ' +
    'the corresponding square on the other board, provided that square is empty.',
  colorScheme: 'Sublimation',
  create: () => new AliceChess(),
});
