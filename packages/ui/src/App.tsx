import { ENGINE_VERSION } from '@chessv/engine';

/**
 * Application shell. Phase 1 replaces this with the catalog browser and game
 * view; for now it confirms the workspace packages resolve and build.
 */
export function App(): React.JSX.Element {
  return (
    <main className="app-shell">
      <h1>ChessV Web</h1>
      <p>A browser port of the ChessV chess-variant engine.</p>
      <p className="app-status">Scaffold ready — engine v{ENGINE_VERSION}</p>
    </main>
  );
}
