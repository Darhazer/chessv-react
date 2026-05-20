/**
 * SVG board renderer.
 *
 * A custom SVG component (rather than a fixed 8×8 library) so it can later
 * scale to ChessV's non-8×8 boards, multi-board layouts and drop pockets. For
 * Phase 1 it renders a rectangular board with click-to-move interaction.
 *
 * Phase-4 polish: keyboard navigation with a roving `tabindex`, ARIA labels
 * announcing each square's contents, and Enter/Space to activate.
 */
import type { Game } from '@chessv/engine';
import { useEffect, useRef, useState } from 'react';
import { type ColorScheme, DEFAULT_SCHEME } from '../colorSchemes.js';
import { pieceGlyph } from '../pieceGlyphs.js';
import type { PieceSetManifest } from '../pieceSets.js';

const SQUARE_SIZE = 64;

interface BoardViewProps {
  game: Game;
  /** Currently selected square, or null. */
  selectedSquare: number | null;
  /** Squares the selected piece may legally move to. */
  legalTargets: ReadonlySet<number>;
  /** The from/to squares of the last move, for highlighting. */
  lastMove: readonly number[] | null;
  /** Called when the user clicks or activates a board square. */
  onSquareClick: (square: number) => void;
  /** Colour scheme; defaults to Classic Wood. */
  colorScheme?: ColorScheme;
  /** Optional bitmap piece set; falls back to Unicode glyphs when unset or when
   *  a particular piece type isn't in the manifest. */
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
  const width = numFiles * SQUARE_SIZE;
  const height = numRanks * SQUARE_SIZE;
  const lastMoveSquares = new Set(lastMove ?? []);

  // Roving tabindex: exactly one cell is in the tab order. The keyboard user
  // tabs into the board and then moves with arrow keys. The default landing
  // square follows the selection (if any) or starts at a1.
  const a1 = board.rankFileToSquare(0, 0);
  const [focusedSquare, setFocusedSquare] = useState<number>(selectedSquare ?? a1);
  const cellRefs = useRef(new Map<number, SVGGElement>());

  // When the selection changes (e.g. after a move) make sure the focus stays
  // somewhere visible on the board.
  useEffect(() => {
    if (selectedSquare !== null) setFocusedSquare(selectedSquare);
  }, [selectedSquare]);

  const moveFocus = (square: number, df: number, dr: number): void => {
    const rank = board.getRank(square);
    const file = board.getFile(square);
    const nf = Math.min(numFiles - 1, Math.max(0, file + df));
    const nr = Math.min(numRanks - 1, Math.max(0, rank + dr));
    const next = board.rankFileToSquare(nr, nf);
    if (next === square) return;
    setFocusedSquare(next);
    // Defer to the next tick so the new tabIndex has rendered.
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

  const cells: React.JSX.Element[] = [];
  // Display row 0 is the top; white (player 0) sits at the bottom.
  for (let row = 0; row < numRanks; row++) {
    const rank = numRanks - 1 - row;
    for (let file = 0; file < numFiles; file++) {
      const square = board.rankFileToSquare(rank, file);
      const x = file * SQUARE_SIZE;
      const y = row * SQUARE_SIZE;
      const isLight = (file + rank) % 2 === 1;
      const piece = board.pieceAt(square);

      let overlay: string | null = null;
      if (square === selectedSquare) overlay = SELECTED;
      else if (lastMoveSquares.has(square)) overlay = LAST_MOVE;

      const isFocusable = square === focusedSquare;
      const ariaLabel = describeSquare(game, square);
      const ariaSelected = square === selectedSquare;

      cells.push(
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
                // For `per-side` sets we have a separate image for each side;
                // for `shared` sets we invert the single image to render the
                // dark side via the SVG filter defined in <defs>.
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
            // Keyboard focus indicator — only rendered on the currently
            // tab-focused cell so it doesn't visually compete with the
            // selection overlay.
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
        </g>,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="auto"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: width, maxHeight: '80vh' }}
      role="grid"
      aria-label={`Chess board, ${numFiles} by ${numRanks}. Use arrow keys to navigate, Enter or Space to select.`}
      aria-rowcount={numRanks}
      aria-colcount={numFiles}
    >
      <defs>
        {/*
         * Inverts an image's RGB while preserving alpha — used to render the
         * dark side's piece from the same chroma-keyed bitmap as the light
         * side. CSS `filter: invert(1)` works in browsers but inconsistently
         * on SVG <image>; the explicit feColorMatrix is reliable everywhere.
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
