/**
 * Asset-conversion pipeline.
 *
 * Converts ChessV's BMP piece sets into web-ready PNGs and emits a per-set
 * manifest mapping piece-type internal names to image paths.
 *
 * For each input BMP we strip the background (mapping pixels reachable from
 * the edges in the chroma-key colour to alpha=0) so the BoardView can
 * composite the piece directly over the square.
 *
 * Sets come in two flavours:
 *  - `shared`: one BMP per piece (e.g. Standard, Abstract, Small). The
 *    BoardView renders the dark side by inverting the same image.
 *  - `per-side`: two BMPs per piece, prefixed `W` and `B` (e.g. Motif,
 *    Eurasian, Runes). Each side gets its own image; no inversion.
 *
 * Run with `pnpm convert-assets`.
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import sharp from 'sharp';

const SOURCE_ROOT = join(homedir(), 'Downloads', 'ChessV2.2-Source');
const PIECE_SETS_DIR = join(SOURCE_ROOT, 'Graphics', 'Piece Sets');
const TEXTURES_DIR = join(SOURCE_ROOT, 'Graphics', 'Textures');
const OUT_ROOT = join(process.cwd(), 'packages', 'ui', 'public', 'assets', 'pieces');
const TEXTURE_OUT_ROOT = join(process.cwd(), 'packages', 'ui', 'public', 'assets', 'textures');
const MANIFEST_ROOT = join(process.cwd(), 'packages', 'ui', 'src', 'assets');

/** A piece's source file stem → engine `PieceType.internalName`. */
type PieceMap = Record<string, string>;

interface SetConfig {
  name: string;
  /** Whether the set ships one image per piece or one per (piece, side). */
  mode: 'shared' | 'per-side';
  /**
   * For `shared`: file stem (e.g. `King`) → internal name.
   * For `per-side`: bare stem with the W/B prefix stripped → internal name.
   */
  pieceMap: PieceMap;
}

/** Standard's mapping covers the broadest range of fairy pieces ChessV ships. */
const STANDARD_MAP: PieceMap = {
  King: 'King',
  Queen: 'Queen',
  Rook: 'Rook',
  Bishop: 'Bishop',
  Knight: 'Knight',
  Pawn: 'Pawn',
  Wazir: 'Wazir',
  Ferz: 'Ferz',
  Elephant: 'Elephant',
  Dabbabah: 'Dabbabah',
  Camel: 'Camel',
  Zebra: 'Zebra',
  Archbishop: 'Archbishop',
  Chancellor: 'Chancellor',
  Amazon: 'Amazon',
  Wildebeest: 'Wildebeest',
  Centaur: 'Centaur',
  Champion: 'Champion',
  DragonKing: 'Dragon King',
  DragonHorse: 'Dragon Horse',
  Lion: 'Lion',
  Unicorn: 'Unicorn',
  SilverGeneral: 'Silver General',
  GoldGeneral: 'Gold General',
  Cannon: 'Cannon',
};

const SETS: SetConfig[] = [
  { name: 'Standard', mode: 'shared', pieceMap: STANDARD_MAP },
  {
    name: 'Abstract',
    mode: 'shared',
    pieceMap: {
      Amazon: 'Amazon',
      Archbishop: 'Archbishop',
      Bishop: 'Bishop',
      Cannon: 'Cannon',
      Champion: 'Champion',
      Chancellor: 'Chancellor',
      Elephant: 'Elephant',
      Ferz: 'Ferz',
      King: 'King',
      Knight: 'Knight',
      Lion: 'Lion',
      Pawn: 'Pawn',
      Queen: 'Queen',
      Rook: 'Rook',
      Unicorn: 'Unicorn',
      Vao: 'Vao',
      Wizard: 'Wizard',
    },
  },
  {
    name: 'Small',
    mode: 'shared',
    pieceMap: {
      Archbishop: 'Archbishop',
      Bishop: 'Bishop',
      Camel: 'Camel',
      Chancellor: 'Chancellor',
      King: 'King',
      Knight: 'Knight',
      Lion: 'Lion',
      Pawn: 'Pawn',
      Queen: 'Queen',
      Rook: 'Rook',
      Wizard: 'Wizard',
    },
  },
  {
    name: 'Motif',
    mode: 'per-side',
    pieceMap: {
      Amazon: 'Amazon',
      Archbishop: 'Archbishop',
      Bishop: 'Bishop',
      Cannon: 'Cannon',
      Chancellor: 'Chancellor',
      King: 'King',
      Knight: 'Knight',
      Nightrider: 'Nightrider',
      Pawn: 'Pawn',
      Queen: 'Queen',
      Rook: 'Rook',
    },
  },
  {
    name: 'Eurasian',
    mode: 'per-side',
    pieceMap: {
      Bishop: 'Bishop',
      Cannon: 'Cannon',
      King: 'King',
      Knight: 'Knight',
      Pawn: 'Pawn',
      Queen: 'Queen',
      Rook: 'Rook',
      Vao: 'Vao',
    },
  },
  {
    name: 'Runes',
    mode: 'per-side',
    pieceMap: {
      Bishop: 'Bishop',
      King: 'King',
      Knight: 'Knight',
      Pawn: 'Pawn',
      Queen: 'Queen',
      Rook: 'Rook',
    },
  },
];

/**
 * Decode one BMP and re-encode as a PNG with the outside background made
 * transparent. sharp cannot read 4-bit Windows BMPs, so macOS's `sips`
 * converts BMP → PNG first; we then flood-fill the chroma-key pixels
 * reachable from the image edges to alpha 0, leaving the piece intact.
 */
async function convertBmp(input: string, output: string): Promise<number> {
  const opaque = join(tmpdir(), `chessv-${basename(input, '.bmp')}-${process.pid}.png`);
  try {
    execFileSync('sips', ['-s', 'format', 'png', input, '--out', opaque], { stdio: 'ignore' });
    const raw = await sharp(opaque).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { data, info } = raw;
    const w = info.width;
    const h = info.height;
    // ChessV's BMPs use a chroma-key colour for the transparent background —
    // most often a bright green or magenta, occasionally white. Sample the
    // top-left pixel and treat anything close to it as background.
    const bgR = data[0]!;
    const bgG = data[1]!;
    const bgB = data[2]!;
    const TOLERANCE = 24;
    const isBackground = (idx: number): boolean => {
      const i = idx * 4;
      return (
        Math.abs(data[i]! - bgR) <= TOLERANCE &&
        Math.abs(data[i + 1]! - bgG) <= TOLERANCE &&
        Math.abs(data[i + 2]! - bgB) <= TOLERANCE
      );
    };
    const visited = new Uint8Array(w * h);
    const stack: number[] = [];
    const push = (x: number, y: number): void => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = y * w + x;
      if (visited[idx] === 1) return;
      if (!isBackground(idx)) return;
      visited[idx] = 1;
      stack.push(idx);
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    while (stack.length > 0) {
      const idx = stack.pop()!;
      const x = idx % w;
      const y = Math.floor(idx / w);
      push(x - 1, y);
      push(x + 1, y);
      push(x, y - 1);
      push(x, y + 1);
    }
    for (let i = 0; i < w * h; i++) {
      if (visited[i] === 1) data[i * 4 + 3] = 0;
    }
    await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toFile(output);
    return w;
  } finally {
    rmSync(opaque, { force: true });
  }
}

interface PieceImageEntry {
  light: string;
  dark?: string;
}

interface Manifest {
  set: string;
  imageSize: number;
  mode: 'shared' | 'per-side';
  pieces: Record<string, PieceImageEntry>;
}

async function convertSet(config: SetConfig): Promise<Manifest | null> {
  const inputDir = join(PIECE_SETS_DIR, config.name);
  if (!existsSync(inputDir)) {
    console.warn(`Skipping ${config.name}: source not found at ${inputDir}`);
    return null;
  }
  const outputDir = join(OUT_ROOT, config.name);
  mkdirSync(outputDir, { recursive: true });

  const available = new Set(
    readdirSync(inputDir)
      .filter((name) => name.toLowerCase().endsWith('.bmp'))
      .map((name) => basename(name, '.bmp')),
  );

  const pieces: Record<string, PieceImageEntry> = {};
  let imageSize = 0;

  for (const [stem, pieceName] of Object.entries(config.pieceMap)) {
    if (config.mode === 'shared') {
      if (!available.has(stem)) continue;
      const outPath = join(outputDir, `${stem}.png`);
      const w = await convertBmp(join(inputDir, `${stem}.bmp`), outPath);
      if (imageSize === 0) imageSize = w;
      pieces[pieceName] = { light: `/assets/pieces/${config.name}/${stem}.png` };
    } else {
      const wStem = `W${stem}`;
      const bStem = `B${stem}`;
      if (!available.has(wStem) || !available.has(bStem)) continue;
      const wOut = join(outputDir, `${wStem}.png`);
      const bOut = join(outputDir, `${bStem}.png`);
      const wSize = await convertBmp(join(inputDir, `${wStem}.bmp`), wOut);
      await convertBmp(join(inputDir, `${bStem}.bmp`), bOut);
      if (imageSize === 0) imageSize = wSize;
      pieces[pieceName] = {
        light: `/assets/pieces/${config.name}/${wStem}.png`,
        dark: `/assets/pieces/${config.name}/${bStem}.png`,
      };
    }
  }

  console.log(`${config.name}: converted ${Object.keys(pieces).length} pieces (${config.mode})`);
  return { set: config.name, imageSize, mode: config.mode, pieces };
}

/** Manifest entry for one board-square texture. */
interface TextureManifest {
  name: string;
  /** Hex `#rrggbb` colour to use when the texture image fails to load. */
  substituteColor: string;
  /** URL of the 64×64 tile rendered as the square's pattern. */
  imageUrl: string;
}

/**
 * `Color=@FFRRGGBB` or `@RRGGBB` → `#rrggbb`. The leading alpha (if any) is
 * dropped — the board pattern is always opaque.
 */
function parseTextureColor(propertiesText: string): string {
  const match = /Color=@\s*([0-9A-Fa-f]+)/.exec(propertiesText);
  if (match === null) throw new Error('Texture properties.txt has no Color= line');
  let hex = match[1]!;
  if (hex.length === 8) hex = hex.slice(2); // strip alpha
  if (hex.length !== 6) throw new Error(`Unexpected colour length in texture: ${hex}`);
  return '#' + hex.toLowerCase();
}

async function convertTextures(): Promise<TextureManifest[] | null> {
  if (!existsSync(TEXTURES_DIR)) {
    console.warn(`Textures source not found at ${TEXTURES_DIR}`);
    return null;
  }
  mkdirSync(TEXTURE_OUT_ROOT, { recursive: true });
  const folders = readdirSync(TEXTURES_DIR).sort();
  const manifest: TextureManifest[] = [];
  for (const folder of folders) {
    const dir = join(TEXTURES_DIR, folder);
    const propsPath = join(dir, 'properties.txt');
    const imagePath = join(dir, 'image1.png');
    if (!existsSync(propsPath) || !existsSync(imagePath)) continue;
    const substituteColor = parseTextureColor(readFileSync(propsPath, 'utf8'));
    // Slugify the folder name for the filename / URL.
    const slug = folder.replace(/[^A-Za-z0-9]+/g, '');
    const outPath = join(TEXTURE_OUT_ROOT, `${slug}.png`);
    copyFileSync(imagePath, outPath);
    manifest.push({
      name: folder,
      substituteColor,
      imageUrl: `/assets/textures/${slug}.png`,
    });
  }
  console.log(`Converted ${manifest.length} textures`);
  return manifest;
}

async function main(): Promise<void> {
  if (!existsSync(PIECE_SETS_DIR)) {
    console.error(`Source not found: ${PIECE_SETS_DIR}`);
    process.exit(1);
  }
  mkdirSync(MANIFEST_ROOT, { recursive: true });

  for (const set of SETS) {
    const manifest = await convertSet(set);
    if (manifest === null) continue;
    const manifestPath = join(MANIFEST_ROOT, `pieceSet-${set.name}.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Wrote manifest: ${manifestPath}`);
  }

  const textures = await convertTextures();
  if (textures !== null) {
    const path = join(MANIFEST_ROOT, 'textures.json');
    writeFileSync(path, JSON.stringify(textures, null, 2) + '\n');
    console.log(`Wrote manifest: ${path}`);
  }
}

void main();
