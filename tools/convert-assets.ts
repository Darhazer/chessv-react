/**
 * Asset-conversion pipeline.
 *
 * Converts ChessV's Windows bitmap piece sets and PNG board textures from the
 * .NET source tree into web-ready assets under `packages/ui/public/assets`, and
 * emits per-set manifest JSON.
 *
 * Source layout (read-only):
 *   <SOURCE>/Graphics/Piece Sets/<set>/<PieceName>.bmp
 *   <SOURCE>/Graphics/Textures/<theme>/...
 *
 * Run with: pnpm convert-assets
 *
 * Phase 0 ships this skeleton with the directory walk; image conversion (via
 * `sharp`) is wired up in Phase 4 alongside the full theme system.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SOURCE_ROOT = join(homedir(), 'Downloads', 'ChessV2.2-Source');
const PIECE_SETS_DIR = join(SOURCE_ROOT, 'Graphics', 'Piece Sets');

function listPieceSets(): string[] {
  if (!existsSync(PIECE_SETS_DIR)) {
    console.warn(`Source not found: ${PIECE_SETS_DIR}`);
    return [];
  }
  return readdirSync(PIECE_SETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function main(): void {
  const sets = listPieceSets();
  console.log(`Found ${sets.length} piece set(s): ${sets.join(', ') || '(none)'}`);
  // TODO(Phase 4): convert .bmp -> .png with `sharp`, write manifests and themes.
}

main();
