/**
 * Unicode chess glyphs for rendering pieces.
 *
 * Phase 1 uses Unicode symbols so Standard Chess is playable without an asset
 * pipeline; the bitmap/SVG piece sets arrive with the theme system in Phase 4.
 * The filled (solid) glyphs are used for both colours and tinted via SVG fill.
 */

/** Filled chess glyph for each standard piece type, keyed by `internalName`. */
const PIECE_GLYPHS: Record<string, string> = {
  King: '♚',
  Queen: '♛',
  Rook: '♜',
  Bishop: '♝',
  Knight: '♞',
  Pawn: '♟',
};

/** The glyph for a piece type, or a generic placeholder if unknown. */
export function pieceGlyph(internalName: string): string {
  return PIECE_GLYPHS[internalName] ?? '●';
}
