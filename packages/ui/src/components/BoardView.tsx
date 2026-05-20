/**
 * SVG board renderer.
 *
 * A custom SVG component (rather than a fixed 8×8 library) so it can later
 * scale to ChessV's non-8×8 boards, multi-board layouts and drop pockets. For
 * Phase 1 it renders a rectangular board with click-to-move interaction.
 */
import type { Game } from '@chessv/engine';
import { type ColorScheme, DEFAULT_SCHEME } from '../colorSchemes.js';
import { pieceGlyph } from '../pieceGlyphs.js';

const SQUARE_SIZE = 64;

interface BoardViewProps {
  game: Game;
  /** Currently selected square, or null. */
  selectedSquare: number | null;
  /** Squares the selected piece may legally move to. */
  legalTargets: ReadonlySet<number>;
  /** The from/to squares of the last move, for highlighting. */
  lastMove: readonly number[] | null;
  /** Called when the user clicks a board square. */
  onSquareClick: (square: number) => void;
  /** Colour scheme; defaults to Classic Wood. */
  colorScheme?: ColorScheme;
}

/** Renders the board, pieces and move highlights as scalable SVG. */
export function BoardView({
  game,
  selectedSquare,
  legalTargets,
  lastMove,
  onSquareClick,
  colorScheme = DEFAULT_SCHEME,
}: BoardViewProps): React.JSX.Element {
  const { light: LIGHT, dark: DARK, selected: SELECTED, target: TARGET, lastMove: LAST_MOVE } =
    colorScheme;
  const board = game.board;
  const { numFiles, numRanks } = board;
  const width = numFiles * SQUARE_SIZE;
  const height = numRanks * SQUARE_SIZE;
  const lastMoveSquares = new Set(lastMove ?? []);

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

      cells.push(
        <g key={square} onClick={() => onSquareClick(square)} style={{ cursor: 'pointer' }}>
          <rect x={x} y={y} width={SQUARE_SIZE} height={SQUARE_SIZE} fill={isLight ? LIGHT : DARK} />
          {overlay !== null && (
            <rect x={x} y={y} width={SQUARE_SIZE} height={SQUARE_SIZE} fill={overlay} />
          )}
          {piece !== null && (
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
          )}
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
        </g>,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="grid"
      aria-label="Chess board"
    >
      {cells}
    </svg>
  );
}
