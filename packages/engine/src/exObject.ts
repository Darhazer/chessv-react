/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/ExObject.cs
 ***************************************************************************/

/**
 * Base class for objects that carry an open-ended bag of named custom
 * properties (used by games and piece types for variant-specific data).
 *
 * The C# original also stored a list of .NET reflection `Attribute`s consumed
 * by the variant DSL compiler and the WinForms option editor. The web port
 * skips the DSL compiler, so that machinery is omitted; only the custom
 * property store is retained.
 */
export class ExObject {
  private readonly customProperties = new Map<string, unknown>();

  getCustomProperty(name: string): unknown {
    return this.customProperties.get(name);
  }

  setCustomProperty(name: string, value: unknown): void {
    this.customProperties.set(name, value);
  }

  hasCustomProperty(name: string): boolean {
    return this.customProperties.has(name);
  }
}
