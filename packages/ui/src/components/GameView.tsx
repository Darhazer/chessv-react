/**
 * The playable game view: board, move list, status and controls.
 *
 * Phase 1 supports local hotseat play (human vs human) of Standard Chess.
 * The engine `Game` object is mutable and lives in a ref; a version counter
 * forces re-renders after each mutation.
 */
import { type Game, MoveType, type MoveInfo, moveTypeHasProperty } from '@chessv/engine';
import { Chess } from '@chessv/variants';
import { useReducer, useRef, useState } from 'react';
import { BoardView } from './BoardView.js';
import { pieceGlyph } from '../pieceGlyphs.js';

/** Build a fresh, initialized Standard Chess game. */
function newGame(): Game {
  const game = new Chess();
  game.initialize();
  return game;
}

/** The legal moves for the current position. */
function legalMoves(game: Game): MoveInfo[] {
  const { moves, count } = game.getRootMoves();
  return moves.slice(0, count);
}

/** A short human-readable description of a move (computed before it is made). */
function describeMove(game: Game, move: MoveInfo): string {
  const glyph = move.pieceMoved !== null ? pieceGlyph(move.pieceMoved.pieceType.internalName) : '';
  const from = game.getSquareNotation(move.fromSquare);
  const to = game.getSquareNotation(move.toSquare);
  const capture = moveTypeHasProperty(move.moveType, MoveType.CaptureProperty) ? '×' : '–';
  let text = `${glyph}${from}${capture}${to}`;
  if (moveTypeHasProperty(move.moveType, MoveType.PromotionProperty)) {
    text += `=${game.getPieceType(move.promotionType).notation[0]}`;
  }
  if (move.moveType === MoveType.Castling) text = move.toSquare > move.fromSquare ? 'O-O' : 'O-O-O';
  return text;
}

interface PendingPromotion {
  fromSquare: number;
  toSquare: number;
  options: MoveInfo[];
}

/** The main game container. */
export function GameView(): React.JSX.Element {
  const gameRef = useRef<Game>(newGame());
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const game = gameRef.current;
  const moves = legalMoves(game);

  const applyMove = (move: MoveInfo): void => {
    setHistory((prev) => [...prev, describeMove(game, move)]);
    game.makeMove(move, true);
    setSelectedSquare(null);
    setPendingPromotion(null);
    forceUpdate();
  };

  const handleSquareClick = (square: number): void => {
    if (!game.result.isNone || pendingPromotion !== null) return;

    if (selectedSquare !== null) {
      const matches = moves.filter(
        (m) => m.fromSquare === selectedSquare && m.toSquare === square,
      );
      if (matches.length === 1) {
        applyMove(matches[0]!);
        return;
      }
      if (matches.length > 1) {
        setPendingPromotion({ fromSquare: selectedSquare, toSquare: square, options: matches });
        return;
      }
    }

    // Select a piece of the side to move that has at least one legal move.
    const piece = game.board.pieceAt(square);
    if (
      piece !== null &&
      piece.player === game.currentSide &&
      moves.some((m) => m.fromSquare === square)
    ) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const handleNewGame = (): void => {
    gameRef.current = newGame();
    setSelectedSquare(null);
    setHistory([]);
    setPendingPromotion(null);
    forceUpdate();
  };

  const handleUndo = (): void => {
    if (history.length === 0) return;
    game.undoMove();
    setHistory((prev) => prev.slice(0, -1));
    setSelectedSquare(null);
    setPendingPromotion(null);
    forceUpdate();
  };

  const legalTargets = new Set<number>(
    selectedSquare === null
      ? []
      : moves.filter((m) => m.fromSquare === selectedSquare).map((m) => m.toSquare),
  );

  const status = game.result.isNone
    ? `${game.currentSide === 0 ? 'White' : 'Black'} to move`
    : game.result.isDraw
      ? 'Game drawn'
      : `${game.result.winner === 0 ? 'White' : 'Black'} wins`;

  return (
    <div className="game-view">
      <div className="board-wrap">
        <BoardView
          game={game}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={game.highlightSquares}
          onSquareClick={handleSquareClick}
        />
        {pendingPromotion !== null && (
          <div className="promotion-overlay">
            <span>Promote to:</span>
            {pendingPromotion.options.map((option) => (
              <button key={option.promotionType} type="button" onClick={() => applyMove(option)}>
                {pieceGlyph(game.getPieceType(option.promotionType).internalName)}
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="game-panel">
        <p className="status">{status}</p>
        <div className="controls">
          <button type="button" onClick={handleNewGame}>
            New game
          </button>
          <button type="button" onClick={handleUndo} disabled={history.length === 0}>
            Undo
          </button>
        </div>
        <ol className="move-list">
          {history.map((text, index) => (
            // The move list is append-only; index is a stable key here.
            // eslint-disable-next-line react/no-array-index-key
            <li key={index}>{text}</li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
