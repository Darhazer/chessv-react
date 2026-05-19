import { GameView } from './components/GameView.js';

/**
 * Application shell. Phase 1 renders a single playable Standard Chess game;
 * the variant catalog browser arrives with the 160-variant work in Phase 3.
 */
export function App(): React.JSX.Element {
  return (
    <main className="app-shell">
      <header>
        <h1>ChessV Web</h1>
        <p>A browser port of the ChessV chess-variant engine — Standard Chess.</p>
      </header>
      <GameView />
    </main>
  );
}
