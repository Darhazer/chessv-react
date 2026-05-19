/**
 * React hook wrapping the AI Web Worker.
 *
 * Owns the worker's lifecycle and message handling, and exposes a simple
 * `requestMove` call for the game view.
 */
import type { FromWorker, TimeControl, ToWorker } from '@chessv/ai';
import { useEffect, useRef, useState } from 'react';

/** A search progress report surfaced to the UI. */
export interface EngineInfo {
  depth: number;
  score: number;
  nodes: number;
  nps: number;
  pv: string[];
}

/** The hook's return value. */
export interface AiEngine {
  /** True once the worker has initialized the variant. */
  ready: boolean;
  /** The most recent search-progress report, or null. */
  info: EngineInfo | null;
  /** Ask the engine for a move; `handler` receives the chosen move hash. */
  requestMove: (
    moveHashes: number[],
    timeControl: TimeControl,
    handler: (moveHash: number) => void,
  ) => void;
}

/** Manage an AI worker for the given variant. */
export function useAiEngine(variantId: string): AiEngine {
  const workerRef = useRef<Worker | null>(null);
  const onBestMove = useRef<((moveHash: number) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<EngineInfo | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.addEventListener('message', (event: MessageEvent<FromWorker>) => {
      const message = event.data;
      switch (message.type) {
        case 'ready':
          setReady(true);
          break;
        case 'info':
          setInfo({
            depth: message.depth,
            score: message.score,
            nodes: message.nodes,
            nps: message.nps,
            pv: message.pv,
          });
          break;
        case 'bestmove': {
          const handler = onBestMove.current;
          onBestMove.current = null;
          handler?.(message.moveHash);
          break;
        }
        case 'error':
          console.error('AI worker error:', message.message);
          break;
      }
    });

    worker.postMessage({ type: 'init', variantId } satisfies ToWorker);
    return () => worker.terminate();
  }, [variantId]);

  const requestMove = (
    moveHashes: number[],
    timeControl: TimeControl,
    handler: (moveHash: number) => void,
  ): void => {
    onBestMove.current = handler;
    setInfo(null);
    workerRef.current?.postMessage({ type: 'position', moveHashes } satisfies ToWorker);
    workerRef.current?.postMessage({ type: 'go', timeControl } satisfies ToWorker);
  };

  return { ready, info, requestMove };
}
