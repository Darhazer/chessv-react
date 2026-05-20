/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Part of the ChessV web port — distributed under the GNU General Public
 *  License, version 3 or later.
 *
 *  PGN-style import / export. The move text uses simple coordinate notation
 *  (`e2-e4`, `e2xe5`, `e7-e8=Q`, `O-O`) rather than strict SAN: it avoids the
 *  disambiguation rules and reads correctly for every ChessV variant.
 ***************************************************************************/

import { MoveType, moveTypeHasProperty } from './basics.js';
import type { Game } from './game.js';
import type { MoveInfo } from './moveInfo.js';

/** PGN tag pairs preserved on import/export. */
export interface PgnTags {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  Variant?: string;
  FEN?: string;
  /** Any other tags encountered or supplied. */
  [tag: string]: string | undefined;
}

/** A parsed PGN: the tag pairs plus the raw move strings (no numbering). */
export interface ParsedPgn {
  tags: PgnTags;
  moves: string[];
}

const DATE_FALLBACK = '????.??.??';
const RESULT_TOKENS = new Set(['1-0', '0-1', '1/2-1/2', '*']);

/** Today's date in PGN's `YYYY.MM.DD` format. */
export function pgnDateToday(): string {
  const d = new Date();
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

/** Render one move in the export format. */
function moveToken(game: Game, move: MoveInfo): string {
  if (move.moveType === MoveType.Castling) {
    return move.toSquare > move.fromSquare ? 'O-O' : 'O-O-O';
  }
  const from = game.getSquareNotation(move.fromSquare);
  const to = game.getSquareNotation(move.toSquare);
  const separator = moveTypeHasProperty(move.moveType, MoveType.CaptureProperty) ? 'x' : '-';
  let text = `${from}${separator}${to}`;
  if (moveTypeHasProperty(move.moveType, MoveType.PromotionProperty)) {
    const promoType = game.getPieceType(move.promotionType);
    // Notation may carry a leading underscore for disambiguation — strip it.
    text += `=${promoType.notationClean[0]!}`;
  }
  return text;
}

/** Build a PGN string from a game record. */
export function exportPgn(game: Game, moves: readonly MoveInfo[], extra: Partial<PgnTags> = {}): string {
  const tags: Required<Pick<PgnTags, 'Event' | 'Site' | 'Date' | 'Round' | 'White' | 'Black' | 'Result'>> & PgnTags = {
    Event: extra.Event ?? 'Casual game',
    Site: extra.Site ?? 'ChessV Web',
    Date: extra.Date ?? pgnDateToday(),
    Round: extra.Round ?? '-',
    White: extra.White ?? 'White',
    Black: extra.Black ?? 'Black',
    Result: extra.Result ?? game.result.shortString,
    Variant: extra.Variant ?? game.name ?? undefined,
    ...extra,
  };

  const lines: string[] = [];
  const order = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result', 'Variant', 'FEN'];
  for (const key of order) {
    const value = tags[key];
    if (value !== undefined) lines.push(`[${key} "${value.replace(/"/g, '\\"')}"]`);
  }
  for (const [key, value] of Object.entries(tags)) {
    if (order.includes(key) || value === undefined) continue;
    lines.push(`[${key} "${value.replace(/"/g, '\\"')}"]`);
  }
  lines.push('');

  // Move text: number every white move; wrap conservatively at ~80 chars.
  let line = '';
  let turn = 1;
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]!;
    const tokens: string[] = [];
    if (move.player === 0) tokens.push(`${turn}.`);
    tokens.push(moveToken(game, move));
    if (move.player === 1) turn++;
    const piece = tokens.join(' ');
    if (line.length + 1 + piece.length > 80) {
      lines.push(line);
      line = piece;
    } else {
      line = line === '' ? piece : `${line} ${piece}`;
    }
  }
  if (line !== '') {
    if (line.length + 1 + tags.Result.length > 80) {
      lines.push(line);
      line = '';
    }
  }
  lines.push(line === '' ? tags.Result : `${line} ${tags.Result}`);
  return lines.join('\n');
}

/** Parse a PGN string into its tag pairs and move tokens. */
export function importPgn(text: string): ParsedPgn {
  const tags: PgnTags = {};
  const moves: string[] = [];
  const tagLine = /^\s*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/;

  // Split into tag-pair section and movetext section at the first blank line
  // after a tag line.
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const m = tagLine.exec(lines[i]!);
    if (m === null) break;
    tags[m[1]!] = m[2]!.replace(/\\"/g, '"');
    i++;
  }
  // Skip blank lines between tags and movetext.
  while (i < lines.length && lines[i]!.trim() === '') i++;

  // Concatenate the rest, strip comments/variations, tokenise.
  let body = lines.slice(i).join(' ');
  body = body.replace(/\{[^}]*\}/g, ' '); // {comments}
  body = body.replace(/\([^)]*\)/g, ' '); // (variations)
  body = body.replace(/\$\d+/g, ' '); // NAGs
  for (const raw of body.split(/\s+/)) {
    if (raw === '') continue;
    if (RESULT_TOKENS.has(raw)) {
      tags.Result = raw;
      continue;
    }
    // Strip leading move numbers like "1." or "1..."
    const stripped = raw.replace(/^\d+\.+/, '');
    if (stripped === '') continue;
    moves.push(stripped);
  }
  return { tags, moves };
}

/**
 * Apply a single move token (from {@link importPgn}) to the game. Returns the
 * MoveInfo that was played. Throws if the token doesn't match any legal move.
 */
export function applyMoveToken(game: Game, token: string): MoveInfo {
  const { moves, count } = game.getRootMoves();
  const legal = moves.slice(0, count);

  // Castling.
  if (token === 'O-O' || token === 'O-O-O') {
    const kingside = token === 'O-O';
    for (const move of legal) {
      if (
        move.moveType === MoveType.Castling &&
        (kingside ? move.toSquare > move.fromSquare : move.toSquare < move.fromSquare)
      ) {
        game.makeMove(move, false);
        return move;
      }
    }
    throw new Error(`No legal castling move matches "${token}"`);
  }

  // <from>[-/x]<to>[=P]
  const match = /^([a-zA-Z][^-x=]*)([-x])([a-zA-Z][^-x=]*)(?:=(.+))?$/.exec(token);
  if (match === null) throw new Error(`Cannot parse move token: "${token}"`);
  const [, fromText, , toText, promoText] = match;
  const fromSquare = game.notationToSquare(fromText!);
  const toSquare = game.notationToSquare(toText!);

  for (const move of legal) {
    if (move.fromSquare !== fromSquare || move.toSquare !== toSquare) continue;
    if (promoText !== undefined) {
      if (!moveTypeHasProperty(move.moveType, MoveType.PromotionProperty)) continue;
      const promoType = game.getPieceType(move.promotionType);
      if (promoType.notationClean[0] !== promoText) continue;
    } else if (moveTypeHasProperty(move.moveType, MoveType.PromotionProperty)) {
      continue; // need an explicit promotion choice
    }
    game.makeMove(move, false);
    return move;
  }
  throw new Error(`No legal move matches "${token}"`);
}
