/**
 * The playable game view: board, move list, status and controls.
 *
 * Supports local hotseat play and play against the AI engine (which runs in a
 * Web Worker). The engine `Game` object is mutable and lives in a ref; a
 * version counter forces re-renders after each mutation.
 */
import { type Game, MoveType, type MoveInfo, moveTypeHasProperty } from '@chessv/engine';
import { Chess } from '@chessv/variants';
import { useEffect, useReducer, useRef, useState } from 'react';
import { BoardView } from './BoardView.js';
import { pieceGlyph } from '../pieceGlyphs.js';
import { useAiEngine } from '../useAiEngine.js';

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
  if (move.moveType === MoveType.Castling) {
    return move.toSquare > move.fromSquare ? 'O-O' : 'O-O-O';
  }
  const glyph = move.pieceMoved !== null ? pieceGlyph(move.pieceMoved.pieceType.internalName) : '';
  const from = game.getSquareNotation(move.fromSquare);
  const to = game.getSquareNotation(move.toSquare);
  const capture = moveTypeHasProperty(move.moveType, MoveType.CaptureProperty) ? '×' : '–';
  let text = `${glyph}${from}${capture}${to}`;
  if (moveTypeHasProperty(move.moveType, MoveType.PromotionProperty)) {
    text += `=${game.getPieceType(move.promotionType).notation[0]}`;
  }
  return text;
}

interface PendingPromotion {
  fromSquare: number;
  toSquare: number;
  options: MoveInfo[];
}

/** AI opponent options: which side the engine plays. */
type AiSide = 'off' | 'white' | 'black';

const AI_DEPTHS = [
  { label: 'Easy', depth: 2 },
  { label: 'Medium', depth: 4 },
  { label: 'Hard', depth: 6 },
];

/** The main game container. */
export function GameView(): React.JSX.Element {
  const gameRef = useRef<Game>(newGame());
  const moveHashes = useRef<number[]>([]);
  const aiBusy = useRef(false);
  const [version, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [aiSide, setAiSide] = useState<AiSide>('off');
  const [aiDepth, setAiDepth] = useState(4);
  const [thinking, setThinking] = useState(false);

  const engine = useAiEngine('Chess');
  const game = gameRef.current;
  const moves = legalMoves(game);

  /** The player number the AI controls, or null for hotseat. */
  const aiPlayer = aiSide === 'white' ? 0 : aiSide === 'black' ? 1 : null;

  const applyMove = (move: MoveInfo): void => {
    setHistory((prev) => [...prev, describeMove(game, move)]);
    moveHashes.current.push(move.hash);
    game.makeMove(move, true);
    setSelectedSquare(null);
    setPendingPromotion(null);
    forceUpdate();
  };

  // Drive the AI: whenever it is the engine's turn, request a move.
  useEffect(() => {
    if (aiPlayer === null || !engine.ready || aiBusy.current) return;
    if (!game.result.isNone || game.currentSide !== aiPlayer) return;

    aiBusy.current = true;
    setThinking(true);
    const searchGame = game;
    engine.requestMove([...moveHashes.current], { maxDepth: aiDepth }, (moveHash) => {
      aiBusy.current = false;
      setThinking(false);
      if (gameRef.current !== searchGame || moveHash === 0) return;
      const chosen = legalMoves(searchGame).find((m) => m.hash === moveHash);
      if (chosen !== undefined) applyMove(chosen);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, aiPlayer, aiDepth, engine.ready]);

  const handleSquareClick = (square: number): void => {
    if (!game.result.isNone || pendingPromotion !== null) return;
    // The human cannot move for the side the AI controls.
    if (aiPlayer !== null && (game.currentSide === aiPlayer || thinking)) return;

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
    moveHashes.current = [];
    aiBusy.current = false;
    setSelectedSquare(null);
    setHistory([]);
    setPendingPromotion(null);
    setThinking(false);
    forceUpdate();
  };

  const handleUndo = (): void => {
    if (thinking || history.length === 0) return;
    const undoOne = (): void => {
      game.undoMove();
      moveHashes.current.pop();
      setHistory((prev) => prev.slice(0, -1));
    };
    undoOne();
    // When playing the AI, undo back to the human's own turn.
    if (aiPlayer !== null && moveHashes.current.length > 0 && game.currentSide === aiPlayer) {
      undoOne();
    }
    setSelectedSquare(null);
    setPendingPromotion(null);
    forceUpdate();
  };

  const legalTargets = new Set<number>(
    selectedSquare === null
      ? []
      : moves.filter((m) => m.fromSquare === selectedSquare).map((m) => m.toSquare),
  );

  const status = !game.result.isNone
    ? game.result.isDraw
      ? 'Game drawn'
      : `${game.result.winner === 0 ? 'White' : 'Black'} wins`
    : thinking
      ? 'Engine thinking…'
      : `${game.currentSide === 0 ? 'White' : 'Black'} to move`;

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
            <div className="promotion-choices">
              {pendingPromotion.options.map((option) => (
                <button key={option.promotionType} type="button" onClick={() => applyMove(option)}>
                  {pieceGlyph(game.getPieceType(option.promotionType).internalName)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="game-panel">
        <p className="status">{status}</p>

        <div className="controls">
          <button type="button" onClick={handleNewGame}>
            New game
          </button>
          <button type="button" onClick={handleUndo} disabled={history.length === 0 || thinking}>
            Undo
          </button>
        </div>

        <div className="ai-controls">
          <label>
            Computer
            <select value={aiSide} onChange={(event) => setAiSide(event.target.value as AiSide)}>
              <option value="off">Off (hotseat)</option>
              <option value="white">Plays White</option>
              <option value="black">Plays Black</option>
            </select>
          </label>
          <label>
            Strength
            <select value={aiDepth} onChange={(event) => setAiDepth(Number(event.target.value))}>
              {AI_DEPTHS.map((level) => (
                <option key={level.depth} value={level.depth}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {engine.info !== null && (
          <p className="engine-info">
            depth {engine.info.depth} · {game.formatScoreForDisplay(engine.info.score)} ·{' '}
            {engine.info.nodes.toLocaleString()} nodes
          </p>
        )}

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
