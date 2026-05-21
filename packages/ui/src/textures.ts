/**
 * Texture manifest — board-square tile images ported from ChessV's
 * `Graphics/Textures/` folders. Each texture is rendered in `BoardView` via
 * an SVG `<pattern>`; the `substituteColor` is a flat fallback used when
 * the image can't be loaded.
 */

import data from './assets/textures.json' with { type: 'json' };

export interface Texture {
  name: string;
  /** Hex `#rrggbb` fallback when the image fails to load. */
  substituteColor: string;
  /** Relative URL of a tileable 64×64 PNG. */
  imageUrl: string;
}

const list = data as readonly Texture[];

/** Look up a texture by display name. Returns `undefined` if not found. */
export function getTexture(name: string): Texture | undefined {
  return list.find((tex) => tex.name === name);
}

/** Every available texture, in registration order. */
export const TEXTURES: readonly Texture[] = list;
