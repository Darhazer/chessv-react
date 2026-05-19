import { useState } from 'react';
import { CatalogBrowser } from './components/CatalogBrowser.js';
import { GameView } from './components/GameView.js';

/**
 * Application shell. Shows the variant catalog, then a playable game for the
 * chosen variant.
 */
export function App(): React.JSX.Element {
  const [variant, setVariant] = useState<string | null>(null);

  return (
    <main className="app-shell">
      <header>
        <h1>ChessV Web</h1>
        <p>A browser port of the ChessV chess-variant engine.</p>
      </header>
      {variant === null ? (
        <CatalogBrowser onSelect={setVariant} />
      ) : (
        <>
          <button type="button" className="back-button" onClick={() => setVariant(null)}>
            ← Back to catalog
          </button>
          <h2 className="variant-title">{variant}</h2>
          {/* Remount the game view when the variant changes. */}
          <GameView key={variant} variantName={variant} />
        </>
      )}
    </main>
  );
}
