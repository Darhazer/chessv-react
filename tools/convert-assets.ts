/**
 * Asset-conversion pipeline.
 *
 * Converts ChessV's monochrome BMP piece sets into web-ready PNGs and emits a
 * per-set manifest mapping piece-type internal names to image paths.
 *
 * For each input BMP we strip the white background (mapping near-white pixels
 * to alpha=0) so the BoardView can composite the piece directly over the
 * square. Black pieces are rendered by inverting the same image in the
 * browser (CSS `filter: invert(1)`), so we only need one PNG per piece type.
 *
 * Run with `pnpm convert-assets`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import sharp from 'sharp';

const SOURCE_ROOT = join(homedir(), 'Downloads', 'ChessV2.2-Source');
const PIECE_SETS_DIR = join(SOURCE_ROOT, 'Graphics', 'Piece Sets');
const OUT_ROOT = join(process.cwd(), 'packages', 'ui', 'public', 'assets', 'pieces');
const MANIFEST_ROOT = join(process.cwd(), 'packages', 'ui', 'src', 'assets');

/** Sets we have piece-name mappings for; expand as more are added. */
const SUPPORTED_SETS = ['Standard'] as const;

/** Map a BMP's bare name (without extension) to the engine's PieceType.internalName. */
const FILE_TO_PIECE: Record<string, string> = {
  // Standard chess pieces.
  King: 'King',
  Queen: 'Queen',
  Rook: 'Rook',
  Bishop: 'Bishop',
  Knight: 'Knight',
  Pawn: 'Pawn',
  // Movement atoms.
  Wazir: 'Wazir',
  Ferz: 'Ferz',
  Elephant: 'Elephant',
  Dabbabah: 'Dabbabah',
  Camel: 'Camel',
  Zebra: 'Zebra',
  // Fairy compounds carried by many variants.
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
  // Shogi-derived.
  SilverGeneral: 'Silver General',
  GoldGeneral: 'Gold General',
  // Xiangqi.
  Cannon: 'Cannon',
};

/**
 * Decode one BMP and re-encode as a PNG with the outside background made
 * transparent. sharp cannot read 4-bit Windows BMPs, so macOS's `sips`
 * converts BMP → PNG first; we then flood-fill the white pixels reachable
 * from the image edges to alpha 0, leaving the piece's interior white intact.
 */
async function convertBmp(input: string, output: string): Promise<void> {
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
  } finally {
    rmSync(opaque, { force: true });
  }
}

interface Manifest {
  set: string;
  /** Image size in source pixels; the UI scales as needed. */
  imageSize: number;
  /** Engine `PieceType.internalName` → relative URL of the piece image. */
  pieces: Record<string, string>;
}

async function convertSet(setName: string): Promise<Manifest | null> {
  const inputDir = join(PIECE_SETS_DIR, setName);
  if (!existsSync(inputDir)) {
    console.warn(`Skipping ${setName}: source not found at ${inputDir}`);
    return null;
  }
  const outputDir = join(OUT_ROOT, setName);
  mkdirSync(outputDir, { recursive: true });

  const files = readdirSync(inputDir).filter((name) => name.toLowerCase().endsWith('.bmp'));
  const pieces: Record<string, string> = {};
  let imageSize = 0;

  for (const file of files) {
    const stem = basename(file, '.bmp');
    const pieceName = FILE_TO_PIECE[stem];
    if (pieceName === undefined) continue; // not yet wired up

    const outPath = join(outputDir, `${stem}.png`);
    await convertBmp(join(inputDir, file), outPath);
    pieces[pieceName] = `/assets/pieces/${setName}/${stem}.png`;

    if (imageSize === 0) {
      const meta = await sharp(outPath).metadata();
      imageSize = meta.width ?? 0;
    }
  }

  console.log(`${setName}: converted ${Object.keys(pieces).length} pieces`);
  return { set: setName, imageSize, pieces };
}

async function main(): Promise<void> {
  if (!existsSync(PIECE_SETS_DIR)) {
    console.error(`Source not found: ${PIECE_SETS_DIR}`);
    process.exit(1);
  }
  mkdirSync(MANIFEST_ROOT, { recursive: true });

  for (const setName of SUPPORTED_SETS) {
    const manifest = await convertSet(setName);
    if (manifest === null) continue;
    const manifestPath = join(MANIFEST_ROOT, `pieceSet-${setName}.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Wrote manifest: ${manifestPath}`);
  }
}

void main();
