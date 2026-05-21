/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Games/Pieces/OdinsRune/*.cs
 *
 *  These four pieces drive Odin's Rune Chess via the engine's
 *  `customMoveGenerator` hook. The handlers expect the host game to
 *  expose `valkyrie`, `forestOx`, `rook`, `bishop`, `pawn` fields so the
 *  OdinKing can adopt the moves of adjacent friendlies.
 ***************************************************************************/

import {
  type CustomMoveGenerationHandler,
  Direction,
  MoveCapability,
  type MoveList,
  MovePathInfo,
  MoveType,
  type Piece,
  PieceType,
} from '@chessv/engine';
import { Bishop, Knight, Queen, Rook } from './chess.js';
import { Ferz } from './movementAtoms.js';

/** Minimal accessor interface the OdinKing handler needs from its host game. */
interface OdinsRuneGame {
  valkyrie: PieceType;
  forestOx: PieceType;
  rook: PieceType;
  bishop: PieceType;
  pawn: PieceType;
}

/** Direction numbers for the 8 unit-step neighbours, in PredefinedDirections order. */
const ORTHO_AND_DIAG: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const odinKingHandler: CustomMoveGenerationHandler = (
  _pieceType: PieceType,
  piece: Piece,
  moveList: MoveList,
  capturesOnly: boolean,
): boolean => {
  const game = piece.game as unknown as OdinsRuneGame;
  const board = piece.board;
  let foundValkyrie = false;
  let foundForestOx = false;
  let foundRook = false;
  let foundBishop = false;
  let foundPawn = false;
  for (let dir = 0; dir < 8; dir++) {
    const sq = board.nextSquare(dir, piece.square);
    if (sq < 0) continue;
    const occupant = board.pieceAt(sq);
    if (occupant === null || occupant.player !== piece.player) continue;
    const t = occupant.pieceType;
    if (t === game.valkyrie) foundValkyrie = true;
    else if (t === game.forestOx) foundForestOx = true;
    else if (t === game.rook) foundRook = true;
    else if (t === game.bishop) foundBishop = true;
    else if (t === game.pawn) foundPawn = true;
  }
  if (foundValkyrie) {
    piece.generateMovesAs(game.valkyrie, moveList, capturesOnly);
  } else {
    if (foundRook) piece.generateMovesAs(game.rook, moveList, capturesOnly);
    if (foundBishop) piece.generateMovesAs(game.bishop, moveList, capturesOnly);
  }
  if (foundForestOx) piece.generateMovesAs(game.forestOx, moveList, capturesOnly);
  // The pawn move-set the OdinKing inherits adds at most the
  // pawn-style two-square advance (with the multi-path through one of the
  // forward diagonals empty). The other pawn moves are subsumed by
  // bishop / valkyrie when those are also adjacent.
  if (foundPawn) {
    if (!foundBishop && !foundValkyrie) {
      piece.generateMovesAs(game.pawn, moveList, capturesOnly);
    } else {
      // Only emit the unique 2-square forward move, with both diagonals
      // checked for clearance (so we don't duplicate Valkyrie / Bishop
      // moves we already generated).
      const playerNorth = piece.game.playerDirection(piece.player, 0); // direction 0 = (1,0) by convention
      // The C# code uses PredefinedDirections.N + player. We rely on the
      // helper playerDirection here for symmetry.
      const oneAhead = board.nextSquare(playerNorth, piece.square);
      if (oneAhead < 0) return false;
      const blockingPiece = board.pieceAt(oneAhead);
      // The C# logic emits the move only when the single-step-ahead is
      // blocked (i.e. you can't do a Valkyrie straight move) — otherwise
      // it would be redundant.
      if (foundValkyrie && blockingPiece === null) return false;
      const twoAhead = board.nextSquare(playerNorth, oneAhead);
      if (twoAhead < 0) return false;
      const occupant = board.pieceAt(twoAhead);
      if (!((occupant === null && !capturesOnly) || (occupant !== null && occupant.player !== piece.player))) {
        return false;
      }
      // At least one forward-diagonal neighbour must be empty.
      const playerNE = piece.game.playerDirection(piece.player, 4); // (1,1)
      const playerNW = piece.game.playerDirection(piece.player, 6); // (1,-1)
      const neSquare = board.nextSquare(playerNE, piece.square);
      const nwSquare = board.nextSquare(playerNW, piece.square);
      const neClear = neSquare >= 0 && board.pieceAt(neSquare) === null;
      const nwClear = nwSquare >= 0 && board.pieceAt(nwSquare) === null;
      if (neClear || nwClear) {
        if (occupant === null) moveList.addMove(piece.square, twoAhead, true);
        else moveList.addCapture(piece.square, twoAhead, true);
      }
    }
  }
  return false; // false = don't suppress standard generation; OdinKing has no base moves
};

/** Odin's King — adopts the move-set of adjacent friendly pieces. */
export class OdinKing extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Odin King', name, notation, midgameValue, endgameValue, preferredImageName);
    this.isSliced = false;
    this.customMoveGenerator = odinKingHandler;
  }
}

/** Odin Pawn — Ferz moves plus a multi-path 2-square forward jump. */
export class OdinPawn extends PieceType {
  constructor(name: string, notation: string, midgameValue: number, endgameValue: number) {
    super('Odin Pawn', name, notation, midgameValue, endgameValue);
    OdinPawn.addMoves(this);
  }

  static addMoves(type: PieceType): void {
    Ferz.addMoves(type);
    const move = MoveCapability.step(new Direction(2, 0));
    const path = new MovePathInfo();
    path.addPath([new Direction(1, 1), new Direction(1, -1)]);
    path.addPath([new Direction(1, -1), new Direction(1, 1)]);
    move.pathInfo = path;
    type.addMoveCapability(move);
  }
}

const valkyrieHandler: CustomMoveGenerationHandler = (
  pieceType: PieceType,
  piece: Piece,
  moveList: MoveList,
  capturesOnly: boolean,
): boolean => {
  const board = piece.board;
  const moves = pieceType.moveCapabilities;
  const count = pieceType.nMoveCapabilities;
  for (let m = 0; m < count; m++) {
    const move = moves[m]!;
    let step = 1;
    let nextSquare = board.nextSquareForPlayer(piece.player, move.nDirection, piece.square);
    while (nextSquare >= 0 && step <= move.maxSteps) {
      const occupant = board.pieceAt(nextSquare);
      if (occupant !== null) {
        if (step >= move.minSteps && move.canCapture && occupant.player !== piece.player) {
          moveList.addCapture(piece.square, nextSquare);
        } else if (
          step >= move.minSteps &&
          occupant.player === piece.player &&
          piece.pieceType !== occupant.pieceType
        ) {
          // Self-capture / displacement: the Valkyrie slides through
          // friendly pieces, dragging the helper to her trailing square.
          let currentSquare = piece.square;
          while (currentSquare !== nextSquare) {
            moveList.beginMoveAdd(MoveType.MoveRelay, piece.square, nextSquare, currentSquare);
            moveList.addPickup(piece.square);
            moveList.addPickup(nextSquare);
            moveList.addDrop(piece, nextSquare, null);
            moveList.addDrop(occupant, currentSquare, null);
            moveList.endMoveAdd(
              piece.pieceType.getMidgamePST(nextSquare) -
                piece.pieceType.getMidgamePST(piece.square) +
                occupant.pieceType.getMidgamePST(currentSquare) -
                occupant.pieceType.getMidgamePST(nextSquare),
            );
            currentSquare = board.nextSquareForPlayer(piece.player, move.nDirection, currentSquare);
            if (currentSquare < 0) break;
          }
        }
        nextSquare = -1;
      } else {
        if (step >= move.minSteps && !move.mustCapture && !capturesOnly) {
          moveList.addMove(piece.square, nextSquare);
        }
        nextSquare = board.nextSquareForPlayer(piece.player, move.nDirection, nextSquare);
        step++;
      }
    }
  }
  return true; // we've generated all the moves
};

/** Valkyrie — Queen with self-displacement of friendly pieces along the slide. */
export class Valkyrie extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Valkyrie', name, notation, midgameValue, endgameValue, preferredImageName);
    Queen.addMoves(this);
    this.customMoveGenerator = valkyrieHandler;
  }
}

const forestOxHandler: CustomMoveGenerationHandler = (
  pieceType: PieceType,
  piece: Piece,
  moveList: MoveList,
  capturesOnly: boolean,
): boolean => {
  const board = piece.board;
  const moves = pieceType.moveCapabilities;
  const count = pieceType.nMoveCapabilities;
  for (let m = 0; m < count; m++) {
    const move = moves[m]!;
    let step = 1;
    let nextSquare = board.nextSquareForPlayer(piece.player, move.nDirection, piece.square);
    while (nextSquare >= 0 && step <= move.maxSteps) {
      const occupant = board.pieceAt(nextSquare);
      if (occupant !== null) {
        if (step >= move.minSteps && move.canCapture && occupant.player !== piece.player) {
          moveList.addCapture(piece.square, nextSquare);
          // Extra adjacent enemy captures from the landing square.
          for (let dir = 0; dir < 8; dir++) {
            const target = board.nextSquare(dir, nextSquare);
            if (target < 0) continue;
            const t = board.pieceAt(target);
            if (t === null || t.player === piece.player) continue;
            moveList.beginMoveAdd(MoveType.ExtraCapture, piece.square, nextSquare, target);
            moveList.addPickup(piece.square);
            moveList.addPickup(nextSquare);
            moveList.addPickup(target);
            moveList.addDrop(piece, nextSquare, null);
            moveList.endMoveAdd(4000 + occupant.pieceType.midgameValue + t.pieceType.midgameValue);
          }
        }
        nextSquare = -1;
      } else {
        if (step >= move.minSteps && !move.mustCapture) {
          if (!capturesOnly) moveList.addMove(piece.square, nextSquare);
          // Extra adjacent enemy captures from an empty landing square.
          for (let dir = 0; dir < 8; dir++) {
            const target = board.nextSquare(dir, nextSquare);
            if (target < 0) continue;
            const t = board.pieceAt(target);
            if (t === null || t.player === piece.player) continue;
            moveList.beginMoveAdd(MoveType.ExtraCapture, piece.square, nextSquare, target);
            moveList.addPickup(piece.square);
            moveList.addPickup(target);
            moveList.addDrop(piece, nextSquare, null);
            moveList.endMoveAdd(3000 + t.pieceType.midgameValue);
          }
        }
        nextSquare = board.nextSquareForPlayer(piece.player, move.nDirection, nextSquare);
        step++;
      }
    }
  }
  return true;
};

/** Forest Ox — Knight with a bonus capture of any enemy adjacent to its destination. */
export class ForestOx extends PieceType {
  constructor(
    name: string,
    notation: string,
    midgameValue: number,
    endgameValue: number,
    preferredImageName: string | null = null,
  ) {
    super('Forest Ox', name, notation, midgameValue, endgameValue, preferredImageName);
    Knight.addMoves(this);
    this.customMoveGenerator = forestOxHandler;
  }
}

// Suppress import-warning for Bishop — it's referenced indirectly through
// the host game's bishop piece type.
void Bishop;
void Rook;
