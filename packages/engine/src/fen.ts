/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/FEN.cs
 ***************************************************************************/

/**
 * A flexible FEN container.
 *
 * Variants extend standard FEN with extra space-separated fields, so the
 * format is described by a template string of `{name}` parts (e.g.
 * `"{array} {turn} {castling} {ep} {halfmove} {fullmove}"`). A parsed FEN maps
 * each part name to its string value.
 */
export class FEN {
  private readonly fenFormatParts: string[];
  private fenParts: Map<string, string> | null = null;

  constructor(fenFormat: string, fen?: string) {
    this.fenFormatParts = FEN.parseFormat(fenFormat);
    if (fen !== undefined) this.load(fen);
  }

  /** The format template rendered back as a `{a} {b} ...` string. */
  get formatString(): string {
    return this.fenFormatParts.map((part) => `{${part}}`).join(' ');
  }

  /** The ordered list of part names this FEN expects. */
  get parts(): readonly string[] {
    return this.fenFormatParts;
  }

  /** Parse a concrete FEN string into its named parts. */
  load(fen: string): void {
    const split = fen.split(' ');
    if (split.length !== this.fenFormatParts.length) {
      throw new Error('Invalid FEN specified - incorrect number of parts');
    }
    this.fenParts = new Map<string, string>();
    for (let x = 0; x < split.length; x++) {
      this.fenParts.set(this.fenFormatParts[x]!, split[x]!);
    }
  }

  /** Read a named part (throws if the FEN is not loaded or lacks the part). */
  get(part: string): string {
    if (this.fenParts === null) throw new Error('FEN not initialized');
    const value = this.fenParts.get(part);
    if (value === undefined) throw new Error(`FEN error: does not contain element '${part}'`);
    return value;
  }

  /** Write a named part. */
  set(part: string, value: string): void {
    if (this.fenParts === null) throw new Error('FEN not initialized');
    this.fenParts.set(part, value);
  }

  /** Replace any part still set to the `#default` placeholder with `-`. */
  setUninitializedDefaults(): void {
    if (this.fenParts === null) throw new Error('FEN not initialized');
    for (const [key, value] of this.fenParts) {
      if (value === '#default') this.fenParts.set(key, '-');
    }
  }

  /** Render the FEN back to its canonical space-separated string. */
  toString(): string {
    if (this.fenParts === null) throw new Error('FEN not initialized');
    return this.fenFormatParts.map((part) => this.fenParts!.get(part) ?? '').join(' ');
  }

  /** Extract the ordered `{name}` part names from a format template. */
  private static parseFormat(fenFormat: string): string[] {
    const parts: string[] = [];
    let cursor = 0;
    while (cursor < fenFormat.length) {
      while (cursor < fenFormat.length && /\s/.test(fenFormat[cursor]!)) cursor++;
      if (cursor >= fenFormat.length) break;
      if (fenFormat[cursor++] !== '{') throw new Error('Invalid FEN format specifier');
      const start = cursor;
      if (cursor >= fenFormat.length || !/[a-zA-Z0-9]/.test(fenFormat[cursor]!)) {
        throw new Error('Invalid FEN format specifier');
      }
      while (cursor < fenFormat.length && fenFormat[cursor] !== '}') cursor++;
      if (cursor >= fenFormat.length) {
        throw new Error("Invalid FEN format specifier - end-of-line when expecting '}'");
      }
      parts.push(fenFormat.substring(start, cursor));
      cursor++; // consume '}'
    }
    return parts;
  }
}
