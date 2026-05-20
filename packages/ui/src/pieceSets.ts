/**
 * Bitmap piece-set manifests. Each manifest maps a `PieceType.internalName` to
 * the URL of a transparent PNG; the BoardView renders that image instead of
 * the Unicode glyph, inverting for the dark side.
 */

import standardSet from './assets/pieceSet-Standard.json' with { type: 'json' };

/** The shape of the JSON written by `tools/convert-assets.ts`. */
export interface PieceSetManifest {
  set: string;
  imageSize: number;
  pieces: Record<string, string>;
}

/**
 * `null` means use Unicode glyphs (the always-present fallback). Bitmap sets
 * are added as the asset pipeline ports them — Phase 4 ships Standard; the
 * other ChessV sets (Motif, Runes, Eurasian, Abstract, Small) follow once
 * `pnpm convert-assets` is extended to walk those folders.
 */
export const PIECE_SETS: Record<string, PieceSetManifest | null> = {
  Unicode: null,
  Standard: standardSet as PieceSetManifest,
};

export const DEFAULT_PIECE_SET = 'Unicode';
