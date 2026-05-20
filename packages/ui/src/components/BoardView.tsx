/**
 * SVG board renderer.
 *
 * A custom SVG component (rather than a fixed 8×8 library) so it can scale to
 * ChessV's non-rectangular layouts:
 *  - rectangular boards (the default);
 *  - two-board layouts (Alice Chess) — rendered as two sub-boards with a gap;
 *  - boards with pockets (Pocket Knight) — pocket squares appear above and
 *    below the main board and are clickable like ordinary squares.
 *
 * Keyboard: roving `tabindex`, arrow / Home / End to navigate, Enter or Space
 * to activate. ARIA labels announce each square's contents.
 */
import {
  BoardWithPockets,
  type Game,
  TwoBoards,
} from '@chessv/engine';
import { useEffect, useRef, useState } from 'react';
import { type ColorScheme, DEFAULT_SCHEME } from '../colorSchemes.js';
import { pieceGlyph } from '../pieceGlyphs.js';
import type { PieceSetManifest } from '../pieceSets.js';

const SQUARE_SIZE = 64;
/** Visual gap between the two halves of an Alice-style layout, in pixels. */
const SUBBOARD_GAP = 32;
/** Visual gap between the main board and the pocket reservoir. */
const POCKET_GAP = 16;

interface BoardViewProps {
  game: Game;
  /** Currently selected square (board or pocket), or null. */
  selectedSquare: number | null;
  /** Squares the selected piece may legally move to. */
  legalTargets: ReadonlySet<number>;
  /** The from/to squares of the last move, for highlighting. */
  lastMove: readonly number[] | null;
  /** Called when the user clicks or activates a square (board or pocket). */
  onSquareClick: (square: number) => void;
  /** Colour scheme; defaults to Classic Wood. */
  colorScheme?: ColorScheme;
  /** Optional bitmap piece set; falls back to Unicode glyphs when unset. */
  pieceSet?: PieceSetManifest | null;
}

/** A human-readable description of a square, for ARIA labels. */
function describeSquare(game: Game, square: number): string {
  const notation = game.getSquareNotation(square);
  const piece = game.board.pieceAt(square);
  if (piece === null) return `${notation}, empty`;
  const side = piece.player === 0 ? 'white' : 'black';
  return `${notation}, ${side} ${piece.pieceType.name.toLowerCase()}`;
}

/** Pixel offset for a file, accounting for the sub-board gap if any. */
function fileToX(file: number, subBoardFiles: number | null): number {
  if (subBoardFiles === null || file < subBoardFiles) return file * SQUARE_SIZE;
  return file * SQUARE_SIZE + SUBBOARD_GAP;
}

interface CellSpec {
  /** Engine square index. */
  square: number;
  /** Top-left x in SVG coordinates. */
  x: number;
  /** Top-left y in SVG coordinates. */
  y: number;
  /** Whether the square is on a light-coloured cell. */
  isLight: boolean;
}

/** Renders the board, pieces and move highlights as scalable SVG. */
export function BoardView({
  game,
  selectedSquare,
  legalTargets,
  lastMove,
  onSquareClick,
  colorScheme = DEFAULT_SCHEME,
  pieceSet = null,
}: BoardViewProps): React.JSX.Element {
  const { light: LIGHT, dark: DARK, selected: SELECTED, target: TARGET, lastMove: LAST_MOVE } =
    colorScheme;
  const board = game.board;
  const { numFiles, numRanks } = board;
  const lastMoveSquares = new Set(lastMove ?? []);

  // Geometry detection.
  const twoBoard = board instanceof TwoBoards ? board : null;
  const pocketBoard = board instanceof BoardWithPockets ? board : null;
  const subBoardFiles = twoBoard?.boardFiles ?? null;

  // Total board width includes the sub-board gap when applicable.
  const boardWidth =
    subBoardFiles === null ? numFiles * SQUARE_SIZE : numFiles * SQUARE_SIZE + SUBBOARD_GAP;
  const boardHeight = numRanks * SQUARE_SIZE;

  // Pockets sit above (black's) and below (white's) the main board.
  const pocketRowHeight = pocketBoard !== null ? SQUARE_SIZE + POCKET_GAP : 0;
  const totalWidth = boardWidth;
  const totalHeight = boardHeight + pocketRowHeight * 2;
  // Vertical offset of the main board (when pockets are present).
  const boardTop = pocketRowHeight;

  // Roving tabindex: exactly one cell is in the tab order.
  const a1 = board.rankFileToSquare(0, 0);
  const [focusedSquare, setFocusedSquare] = useState<number>(selectedSquare ?? a1);
  const cellRefs = useRef(new Map<number, SVGGElement>());

  useEffect(() => {
    if (selectedSquare !== null) setFocusedSquare(selectedSquare);
  }, [selectedSquare]);

  const moveFocus = (square: number, df: number, dr: number): void => {
    // Pocket squares fall back to the main board's a1 if you try to navigate
    // off them — keep the keyboard model simple.
    if (square >= board.numSquares) {
      setFocusedSquare(a1);
      requestAnimationFrame(() => cellRefs.current.get(a1)?.focus());
      return;
    }
    const rank = board.getRank(square);
    const file = board.getFile(square);
    const nf = Math.min(numFiles - 1, Math.max(0, file + df));
    const nr = Math.min(numRanks - 1, Math.max(0, rank + dr));
    const next = board.rankFileToSquare(nr, nf);
    if (next === square) return;
    setFocusedSquare(next);
    requestAnimationFrame(() => cellRefs.current.get(next)?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>, square: number): void => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSquareClick(square);
        return;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(square, -1, 0);
        return;
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(square, 1, 0);
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(square, 0, 1);
        return;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(square, 0, -1);
        return;
      case 'Home':
        event.preventDefault();
        moveFocus(square, -numFiles, 0);
        return;
      case 'End':
        event.preventDefault();
        moveFocus(square, numFiles, 0);
        return;
      default:
    }
  };

  /** Render one cell (used for both board squares and pocket squares). */
  const renderCell = (spec: CellSpec): React.JSX.Element => {
    const { square, x, y, isLight } = spec;
    const piece = board.pieceAt(square);
    let overlay: string | null = null;
    if (square === selectedSquare) overlay = SELECTED;
    else if (lastMoveSquares.has(square)) overlay = LAST_MOVE;

    const isFocusable = square === focusedSquare;
    const ariaLabel = describeSquare(game, square);
    const ariaSelected = square === selectedSquare;

    return (
      <g
        key={square}
        ref={(node) => {
          if (node === null) cellRefs.current.delete(square);
          else cellRefs.current.set(square, node);
        }}
        tabIndex={isFocusable ? 0 : -1}
        role="gridcell"
        aria-label={ariaLabel}
        aria-selected={ariaSelected}
        onClick={() => onSquareClick(square)}
        onFocus={() => setFocusedSquare(square)}
        onKeyDown={(event) => handleKeyDown(event, square)}
        style={{ cursor: 'pointer', outline: 'none' }}
      >
        <rect x={x} y={y} width={SQUARE_SIZE} height={SQUARE_SIZE} fill={isLight ? LIGHT : DARK} />
        {overlay !== null && (
          <rect x={x} y={y} width={SQUARE_SIZE} height={SQUARE_SIZE} fill={overlay} />
        )}
        {piece !== null &&
          (() => {
            const entry = pieceSet?.pieces[piece.pieceType.internalName];
            if (entry !== undefined) {
              const isDark = piece.player === 1;
              const href = isDark && entry.dark !== undefined ? entry.dark : entry.light;
              const shouldInvert = isDark && entry.dark === undefined;
              return (
                <image
                  href={href}
                  x={x + SQUARE_SIZE * 0.05}
                  y={y + SQUARE_SIZE * 0.05}
                  width={SQUARE_SIZE * 0.9}
                  height={SQUARE_SIZE * 0.9}
                  style={{ pointerEvents: 'none' }}
                  filter={shouldInvert ? 'url(#chessv-invert)' : undefined}
                />
              );
            }
            return (
              <text
                x={x + SQUARE_SIZE / 2}
                y={y + SQUARE_SIZE / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={SQUARE_SIZE * 0.74}
                fill={piece.player === 0 ? '#fdfdfd' : '#1c1c1c'}
                stroke={piece.player === 0 ? '#1c1c1c' : '#000000'}
                strokeWidth={1.2}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {pieceGlyph(piece.pieceType.internalName)}
              </text>
            );
          })()}
        {legalTargets.has(square) && (
          <circle
            cx={x + SQUARE_SIZE / 2}
            cy={y + SQUARE_SIZE / 2}
            r={piece !== null ? SQUARE_SIZE * 0.46 : SQUARE_SIZE * 0.16}
            fill={piece !== null ? 'none' : TARGET}
            stroke={piece !== null ? TARGET : 'none'}
            strokeWidth={6}
            style={{ pointerEvents: 'none' }}
          />
        )}
        {isFocusable && (
          <rect
            x={x + 2}
            y={y + 2}
            width={SQUARE_SIZE - 4}
            height={SQUARE_SIZE - 4}
            fill="none"
            stroke={colorScheme.target}
            strokeWidth={3}
            strokeDasharray="4 3"
            style={{ pointerEvents: 'none', opacity: 0 }}
            className="board-focus-ring"
          />
        )}
      </g>
    );
  };

  // *** BOARD CELLS *** //
  const cells: React.JSX.Element[] = [];
  // Display row 0 is the top; white (player 0) sits at the bottom.
  for (let row = 0; row < numRanks; row++) {
    const rank = numRanks - 1 - row;
    for (let file = 0; file < numFiles; file++) {
      const square = board.rankFileToSquare(rank, file);
      const x = fileToX(file, subBoardFiles);
      const y = boardTop + row * SQUARE_SIZE;
      const isLight = (file + rank) % 2 === 1;
      cells.push(renderCell({ square, x, y, isLight }));
    }
  }

  // *** POCKET CELLS *** //
  if (pocketBoard !== null) {
    // Black's pocket (player 1) at the top; white's at the bottom.
    for (let player = 0; player < game.numPlayers; player++) {
      const square = pocketBoard.pocketSquareFor(player);
      const y =
        player === 1
          ? (pocketRowHeight - SQUARE_SIZE) / 2
          : boardTop + boardHeight + (pocketRowHeight - SQUARE_SIZE) / 2;
      // Centre the pocket reservoir over the main board.
      const x = (boardWidth - SQUARE_SIZE) / 2;
      cells.push(renderCell({ square, x, y, isLight: player === 0 }));
    }
  }

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width="100%"
      height="auto"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: totalWidth, maxHeight: '80vh' }}
      role="grid"
      aria-label={`Chess board, ${numFiles} by ${numRanks}. Use arrow keys to navigate, Enter or Space to select.`}
      aria-rowcount={numRanks}
      aria-colcount={numFiles}
    >
      <defs>
        {/*
         * Inverts an image's RGB while preserving alpha — used to render the
         * dark side's piece from the same chroma-keyed bitmap as the light
         * side. CSS `filter: invert(1)` is unreliable on SVG <image> across
         * browsers; the explicit feColorMatrix works everywhere.
         */}
        <filter id="chessv-invert">
          <feColorMatrix
            type="matrix"
            values="-1 0 0 0 1
                     0 -1 0 0 1
                     0 0 -1 0 1
                     0 0 0 1 0"
          />
        </filter>
      </defs>
      {cells}
    </svg>
  );
}
