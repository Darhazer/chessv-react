/// <reference lib="webworker" />
/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Part of the ChessV web port — distributed under the GNU General Public
 *  License, version 3 or later.
 ***************************************************************************/
/**
 * AI Web Worker.
 *
 * Runs the alpha-beta search off the UI thread. It reconstructs a {@link Game}
 * from a variant id, loads positions by FEN, searches on `go`, and streams
 * back `info` updates followed by `bestmove`.
 *
 * Note: the search is synchronous, so a `stop` arriving mid-search cannot
 * interrupt it (that would need a SharedArrayBuffer flag). Callers should
 * therefore always pass a bounded time control — a depth, move-time or node
 * limit — which is what local hotseat play does.
 */
import { type Game, Movement, TimeControl } from '@chessv/engine';
import { createVariant } from '@chessv/variants';
import type { FromWorker, ToWorker, TimeControl as ProtocolTimeControl } from './protocol.js';

let game: Game | null = null;
let variantId: string | null = null;
let optionOverrides: Record<string, string> | null = null;

/** Build a fresh, initialized game using the stored variant + overrides. */
function buildGame(): Game {
  if (variantId === null) throw new Error('Worker not initialized');
  const next = createVariant(variantId);
  next.optionOverrides = optionOverrides;
  next.initialize();
  return next;
}

function post(message: FromWorker): void {
  (self as DedicatedWorkerGlobalScope).postMessage(message);
}

/** Translate a protocol time control into the engine's TimeControl. */
function toEngineTimeControl(tc: ProtocolTimeControl): TimeControl {
  const engine = new TimeControl();
  if (tc.infinite) engine.infinite = true;
  if (tc.moveTimeMs !== undefined) engine.timePerMove = tc.moveTimeMs;
  if (tc.maxDepth !== undefined) engine.plyLimit = tc.maxDepth;
  if (tc.maxNodes !== undefined) engine.nodeLimit = tc.maxNodes;
  if (tc.baseTimeMs !== undefined) engine.activeTimeLeft = tc.baseTimeMs;
  if (tc.incrementMs !== undefined) engine.timeIncrement = tc.incrementMs;
  // With no constraint at all, fall back to a modest fixed depth.
  if (
    !engine.infinite &&
    engine.timePerMove === 0 &&
    engine.plyLimit === 0 &&
    engine.nodeLimit === 0 &&
    engine.activeTimeLeft === 0
  ) {
    engine.plyLimit = 6;
  }
  return engine;
}

function handle(message: ToWorker): void {
  switch (message.type) {
    case 'init': {
      variantId = message.variantId;
      optionOverrides = message.optionOverrides ?? null;
      game = buildGame();
      post({ type: 'ready' });
      break;
    }
    case 'position': {
      if (variantId === null) throw new Error('Worker received "position" before "init"');
      // Rebuild from the start position so the game state is exactly correct.
      game = buildGame();
      for (const moveHash of message.moveHashes) {
        game.makeMovement(Movement.fromHash(moveHash), false);
      }
      break;
    }
    case 'go': {
      if (game === null) throw new Error('Worker received "go" before "init"');
      const current = game;
      current.onSearchInfo = (info) => {
        post({
          type: 'info',
          depth: info.depth,
          score: info.score,
          nodes: info.nodes,
          nps: info.nps,
          pv: info.pv,
        });
      };
      try {
        const line = current.think(toEngineTimeControl(message.timeControl));
        const best: Movement | undefined = line[0];
        post({ type: 'bestmove', moveHash: best ? best.hash : 0 });
      } finally {
        current.onSearchInfo = null;
      }
      break;
    }
    case 'stop': {
      game?.abortSearch();
      break;
    }
    case 'setoption': {
      // Phase 2 exposes no tunable options yet.
      break;
    }
  }
}

self.addEventListener('message', (event: MessageEvent<ToWorker>) => {
  try {
    handle(event.data);
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});
