/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  This file is part of the ChessV web port.  ChessV is free software; you
 *  can redistribute it and/or modify it under the terms of the GNU General
 *  Public License as published by the Free Software Foundation, either
 *  version 3 of the License, or (at your option) any later version.
 *
 *  Ported from ChessV.Base/Basics.cs
 ***************************************************************************/

/**
 * Response returned by rule hooks and move handlers, signalling how the
 * engine should proceed when a move is being generated or made.
 */
export enum MoveEventResponse {
  MoveOk = 1,
  Handled = 2,
  NotHandled = 3,
  IllegalMove = 4,
  GameWon = 5,
  GameLost = 6,
  GameDrawn = 7,
}

/** Notation styles for rendering a move as text. */
export enum MoveNotation {
  XBoard,
  StandardAlgebraic,
  Descriptive,
  MoveSelectionText,
}

/**
 * Type of a move, encoded as a set of bit-flags. The low bits identify
 * properties (capture, promotion, ...) while named members combine them
 * into concrete move types. Mirrors ChessV's `MoveType` enum exactly.
 */
export enum MoveType {
  Invalid = 0,

  // Property bits.
  CaptureProperty = 2,
  MultiMoveProperty = 4,
  ReplacementCaptureProperty = 8,
  BaroqueCaptureProperty = 16,
  PromotionProperty = 32,
  DropOrReplaceProperty = 64,

  // Concrete move types.
  StandardMove = 1,
  StandardCapture = CaptureProperty | ReplacementCaptureProperty,
  MoveWithPromotion = StandardMove | PromotionProperty,
  CaptureWithPromotion = StandardCapture | PromotionProperty,
  MoveReplace = StandardMove | DropOrReplaceProperty | PromotionProperty,
  CaptureReplace = StandardCapture | DropOrReplaceProperty | PromotionProperty,
  BaroqueCapture = CaptureProperty | BaroqueCaptureProperty,
  ExtraCapture = CaptureProperty | ReplacementCaptureProperty | BaroqueCaptureProperty,
  Castling = MultiMoveProperty | 1,
  EnPassant = BaroqueCapture | 1,
  Drop = DropOrReplaceProperty,
  Replace = DropOrReplaceProperty | 1,
  MoveRelay = MultiMoveProperty,
  Swap = MultiMoveProperty,
  NullMove = ReplacementCaptureProperty | BaroqueCaptureProperty,
  Pass = ReplacementCaptureProperty | BaroqueCaptureProperty | 1,
  CustomMove = ReplacementCaptureProperty | BaroqueCaptureProperty | MultiMoveProperty,
}

/** True if the given move type carries the requested property bit(s). */
export function moveTypeHasProperty(type: MoveType, property: MoveType): boolean {
  return (type & property) === property;
}

/**
 * A board coordinate as a (rank, file) pair. Ports the C# `Location` struct;
 * a rank below zero denotes the null location.
 */
export class Location {
  constructor(
    public rank: number,
    public file: number,
  ) {}

  get isNull(): boolean {
    return this.rank < 0;
  }

  equals(other: Location): boolean {
    return this.rank === other.rank && this.file === other.file;
  }

  /** Sentinel "no location" value (rank and file both -1). */
  static readonly nullLocation = new Location(-1, -1);
}

/** A movement offset as a (rank, file) delta. Ports the C# `Direction` struct. */
export class Direction {
  constructor(
    public rankOffset: number,
    public fileOffset: number,
  ) {}

  equals(other: Direction): boolean {
    return this.rankOffset === other.rankOffset && this.fileOffset === other.fileOffset;
  }
}

/** Indices of the eight standard directions within a board's direction set. */
export const PredefinedDirections = {
  N: 0,
  S: 1,
  E: 2,
  W: 3,
  NE: 4,
  SW: 5,
  NW: 6,
  SE: 7,
} as const;

/** Special non-standard attack modes (cannon-style, rifle-style capture). */
export enum SpecialAttacks {
  None = 0,
  CannonCapture = 1,
  RifleCapture = 2,
}

/**
 * A piece removed from a square while making a move. Ports the `Pickup` struct.
 * `piece` is null until the pickup is actually performed.
 */
export interface Pickup {
  piece: Piece | null;
  square: number;
}

/** A piece placed on a square while making a move. Ports the `Drop` struct. */
export interface Drop {
  piece: Piece;
  square: number;
  /** Non-null when the piece changes type on landing (e.g. promotion). */
  newType: PieceType | null;
}

/** Aggregated counts produced by a perft (move-generation) traversal. */
export class PerftResults {
  nodes = 0;
  captures = 0;
  enPassants = 0;
  castles = 0;
  promotions = 0;
}

// Forward type-only references; concrete classes live in their own modules.
import type { Piece } from './piece.js';
import type { PieceType } from './pieceType.js';
