/**
 * The playable game view: board, move list, status and controls.
 *
 * Supports local hotseat play and play against the AI engine (which runs in a
 * Web Worker). The engine `Game` object is mutable and lives in a ref; a
 * version counter forces re-renders after each mutation.
 */
import {
  applyMoveToken,
  exportPgn,
  type Game,
  importPgn,
  Movement,
  MoveType,
  type MoveInfo,
  moveTypeHasProperty,
} from '@chessv/engine';
import { createVariant } from '@chessv/variants';
import { useEffect, useReducer, useRef, useState } from 'react';
import { BoardView } from './BoardView.js';
import { COLOR_SCHEMES, DEFAULT_SCHEME } from '../colorSchemes.js';
import { pieceGlyph } from '../pieceGlyphs.js';
import { DEFAULT_PIECE_SET, PIECE_SETS } from '../pieceSets.js';
import { useAiEngine } from '../useAiEngine.js';

/** Build a fresh, initialized game for the named variant. */
function createGame(variantName: string): Game {
  const game = createVariant(variantName);
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

interface GameViewProps {
  /** The registered name of the variant to play. */
  variantName: string;
}

/** The main game container. */
export function GameView({ variantName }: GameViewProps): React.JSX.Element {
  const gameRef = useRef<Game>(createGame(variantName));
  const moveHashes = useRef<number[]>([]);
  const aiBusy = useRef(false);
  const [version, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [aiSide, setAiSide] = useState<AiSide>('off');
  const [aiDepth, setAiDepth] = useState(4);
  const [thinking, setThinking] = useState(false);
  const [pgnMode, setPgnMode] = useState<'export' | 'import' | null>(null);
  const [pgnText, setPgnText] = useState('');
  const [pgnError, setPgnError] = useState<string | null>(null);
  /** When non-null, we are reviewing the position after move `reviewCursor`. */
  const [reviewCursor, setReviewCursor] = useState<number | null>(null);
  const [colorSchemeName, setColorSchemeName] = useState(DEFAULT_SCHEME.name);
  const colorScheme =
    COLOR_SCHEMES.find((scheme) => scheme.name === colorSchemeName) ?? DEFAULT_SCHEME;
  const [pieceSetName, setPieceSetName] = useState(DEFAULT_PIECE_SET);
  const pieceSet = PIECE_SETS[pieceSetName] ?? null;

  const engine = useAiEngine(variantName);
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
    if (reviewCursor !== null) return;
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
    if (reviewCursor !== null) return;
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
    gameRef.current = createGame(variantName);
    moveHashes.current = [];
    aiBusy.current = false;
    setSelectedSquare(null);
    setHistory([]);
    setPendingPromotion(null);
    setThinking(false);
    setReviewCursor(null);
    forceUpdate();
  };

  const handleUndo = (): void => {
    if (thinking || history.length === 0 || reviewCursor !== null) return;
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

  /**
   * Jump the board to the position after the given move index, or null for the
   * live tip. Re-uses the saved move-hash log to undo / redo without rebuilding.
   */
  const jumpTo = (cursor: number | null): void => {
    const targetMoveCount = cursor === null ? moveHashes.current.length : cursor + 1;
    while (game.gameMoveNumber > targetMoveCount) game.undoMove();
    while (game.gameMoveNumber < targetMoveCount) {
      const next = moveHashes.current[game.gameMoveNumber]!;
      game.makeMovement(Movement.fromHash(next), false);
    }
    setReviewCursor(cursor);
    setSelectedSquare(null);
    setPendingPromotion(null);
    forceUpdate();
  };

  const openExportPgn = (): void => {
    setPgnText(exportPgn(game, game.getMoveHistory(), { Variant: variantName }));
    setPgnError(null);
    setPgnMode('export');
  };

  const openImportPgn = (): void => {
    setPgnText('');
    setPgnError(null);
    setPgnMode('import');
  };

  const closePgnDialog = (): void => {
    setPgnMode(null);
    setPgnText('');
    setPgnError(null);
  };

  const loadPgn = (): void => {
    try {
      const parsed = importPgn(pgnText);
      const next = createGame(variantName);
      for (const token of parsed.moves) applyMoveToken(next, token);
      gameRef.current = next;
      const played = next.getMoveHistory();
      moveHashes.current = played.map((m) => m.hash);
      setHistory(played.map((m) => describeMove(next, m)));
      setSelectedSquare(null);
      setPendingPromotion(null);
      setThinking(false);
      aiBusy.current = false;
      closePgnDialog();
      forceUpdate();
    } catch (error) {
      setPgnError(error instanceof Error ? error.message : String(error));
    }
  };

  const copyPgn = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(pgnText);
    } catch {
      // Clipboard API can fail in non-secure contexts — the user can still
      // copy manually from the textarea.
    }
  };

  const legalTargets = new Set<number>(
    selectedSquare === null
      ? []
      : moves.filter((m) => m.fromSquare === selectedSquare).map((m) => m.toSquare),
  );

  // Captured pieces, grouped by the capturing side. Each captured piece is
  // shown as its (now-lost) owner's glyph.
  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  for (const played of game.getMoveHistory()) {
    if (played.pieceCaptured !== null) {
      const glyph = pieceGlyph(played.pieceCaptured.pieceType.internalName);
      (played.player === 0 ? capturedByWhite : capturedByBlack).push(glyph);
    }
  }

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
          colorScheme={colorScheme}
          pieceSet={pieceSet}
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
          <button type="button" onClick={openExportPgn} disabled={history.length === 0}>
            Export PGN
          </button>
          <button
            type="button"
            onClick={openImportPgn}
            disabled={thinking || reviewCursor !== null}
          >
            Import PGN
          </button>
          {reviewCursor !== null && (
            <button type="button" onClick={() => jumpTo(null)}>
              Return to live
            </button>
          )}
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
          <label>
            Theme
            <select
              value={colorSchemeName}
              onChange={(event) => setColorSchemeName(event.target.value)}
            >
              {COLOR_SCHEMES.map((scheme) => (
                <option key={scheme.name} value={scheme.name}>
                  {scheme.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pieces
            <select value={pieceSetName} onChange={(event) => setPieceSetName(event.target.value)}>
              {Object.keys(PIECE_SETS).map((name) => (
                <option key={name} value={name}>
                  {name}
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

        {(capturedByWhite.length > 0 || capturedByBlack.length > 0) && (
          <div className="captured">
            <div className="captured-row">
              <span className="captured-label">White captured</span>
              <span className="captured-glyphs dark-glyphs">{capturedByWhite.join(' ')}</span>
            </div>
            <div className="captured-row">
              <span className="captured-label">Black captured</span>
              <span className="captured-glyphs light-glyphs">{capturedByBlack.join(' ')}</span>
            </div>
          </div>
        )}

        <ol className="move-list">
          {history.map((text, index) => {
            const isCurrent =
              reviewCursor === null ? index === history.length - 1 : index === reviewCursor;
            return (
              // The move list is append-only; index is a stable key here.
              // eslint-disable-next-line react/no-array-index-key
              <li key={index} className={isCurrent ? 'move-current' : undefined}>
                <button
                  type="button"
                  className="move-item"
                  onClick={() => jumpTo(index === history.length - 1 ? null : index)}
                >
                  {text}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {pgnMode !== null && (
        <div className="pgn-dialog-backdrop" onClick={closePgnDialog}>
          <div className="pgn-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>{pgnMode === 'export' ? 'Export PGN' : 'Import PGN'}</h3>
            <textarea
              value={pgnText}
              onChange={(event) => setPgnText(event.target.value)}
              readOnly={pgnMode === 'export'}
              spellCheck={false}
              rows={14}
            />
            {pgnError !== null && <p className="pgn-error">{pgnError}</p>}
            <div className="pgn-dialog-actions">
              {pgnMode === 'export' ? (
                <button type="button" onClick={() => void copyPgn()}>
                  Copy to clipboard
                </button>
              ) : (
                <button type="button" onClick={loadPgn} disabled={pgnText.trim() === ''}>
                  Load
                </button>
              )}
              <button type="button" onClick={closePgnDialog}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
