/**
 * The variant catalog: lists every registered chess variant and lets the
 * player pick one. Replaces ChessV's WinForms MainForm game browser.
 */
import { listVariants } from '@chessv/variants';

interface CatalogBrowserProps {
  /** Called with the chosen variant's name. */
  onSelect: (variantName: string) => void;
}

/** Renders the variant catalog as a grid of selectable cards. */
export function CatalogBrowser({ onSelect }: CatalogBrowserProps): React.JSX.Element {
  const variants = listVariants();
  return (
    <div className="catalog">
      {variants.map((variant) => (
        <button
          key={variant.name}
          type="button"
          className="catalog-card"
          onClick={() => onSelect(variant.name)}
        >
          <h3>{variant.name}</h3>
          <p>{variant.description ?? ''}</p>
          <span className="catalog-meta">
            {variant.files}×{variant.ranks}
            {variant.inventedBy && variant.inventedBy !== 'Unknown'
              ? ` · ${variant.inventedBy}`
              : ''}
            {variant.invented ? ` · ${variant.invented}` : ''}
          </span>
        </button>
      ))}
    </div>
  );
}
