/**
 * Web Worker entry point.
 *
 * Importing `@chessv/ai/worker` installs its `message` listener; this file
 * exists so Vite can bundle the worker from within the UI package via
 * `new Worker(new URL('./aiWorker.ts', import.meta.url))`.
 */
import '@chessv/ai/worker';
