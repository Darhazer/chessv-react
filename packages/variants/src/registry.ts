/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Part of the ChessV web port — distributed under the GNU General Public
 *  License, version 3 or later.
 ***************************************************************************/

import type { Game } from '@chessv/engine';

/**
 * Catalog metadata for a variant, replacing the C# `[Game]` / `[Appearance]`
 * attributes. The UI catalog browser reads variants from this registry.
 */
export interface VariantMeta {
  /** Display name, unique within the registry. */
  name: string;
  /** Board dimensions. */
  files: number;
  ranks: number;
  /** Catalog tags (category, popularity, ...). */
  tags: string[];
  /** When and by whom the variant was invented. */
  invented?: string;
  inventedBy?: string;
  /** Short description lines. */
  description?: string;
  /** Default colour-scheme name. */
  colorScheme?: string;
  /** Factory that constructs a fresh, uninitialized game instance. */
  create: () => Game;
}

const registry = new Map<string, VariantMeta>();

/** Register a variant so it appears in the catalog. */
export function registerVariant(meta: VariantMeta): void {
  registry.set(meta.name, meta);
}

/** Look up a variant by name. */
export function getVariant(name: string): VariantMeta | undefined {
  return registry.get(name);
}

/** Construct a fresh game instance for a registered variant. */
export function createVariant(name: string): Game {
  const meta = registry.get(name);
  if (meta === undefined) throw new Error(`Unknown variant: ${name}`);
  return meta.create();
}

/** Every registered variant, in registration order. */
export function listVariants(): VariantMeta[] {
  return [...registry.values()];
}

/** Registered variants carrying the given tag. */
export function variantsByTag(tag: string): VariantMeta[] {
  return [...registry.values()].filter((meta) => meta.tags.includes(tag));
}
