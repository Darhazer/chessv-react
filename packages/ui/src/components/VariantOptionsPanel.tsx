/**
 * Pre-game options panel for variants exposing user-selectable ChoiceVariables
 * (e.g. Chess with Different Armies). Each option offers the variant's choices
 * plus a "Random" entry that is resolved when the next game starts.
 *
 * Changes update the user's saved preference but do not apply to the live
 * game — the player must click "New game" for them to take effect.
 */
import type { ChoiceVariable } from '@chessv/engine';

/** Sentinel preference value meaning "pick at random when the game starts". */
export const RANDOM_CHOICE = 'Random';

interface VariantOptionsPanelProps {
  /** The ChoiceVariables exposed by the variant, as they stand in the live game. */
  options: ChoiceVariable[];
  /** User preferences keyed by ChoiceVariable.displayName; may contain RANDOM_CHOICE. */
  prefs: Record<string, string>;
  /** Update one option's preference. */
  onChange: (displayName: string, value: string) => void;
  /** Whether the displayed prefs differ from what the current game uses. */
  pendingChanges: boolean;
}

/** Render the options block; returns null if the variant has no options. */
export function VariantOptionsPanel({
  options,
  prefs,
  onChange,
  pendingChanges,
}: VariantOptionsPanelProps): React.JSX.Element | null {
  if (options.length === 0) return null;

  return (
    <div className="variant-options">
      <div className="variant-options-header">
        Variant options
        {pendingChanges && (
          <span className="variant-options-hint"> (start a new game to apply)</span>
        )}
      </div>
      <div className="variant-options-grid">
        {options.map((option) => {
          if (option.displayName === null) return null;
          const label = option.displayName;
          const liveValue = option.value;
          const pref = prefs[label] ?? liveValue ?? RANDOM_CHOICE;
          const showLiveHint = pref === RANDOM_CHOICE && liveValue !== null;
          return (
            <label key={label}>
              {label}
              <select value={pref} onChange={(event) => onChange(label, event.target.value)}>
                <option value={RANDOM_CHOICE}>Random</option>
                {option.choices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
              {showLiveHint && <span className="variant-options-live">in play: {liveValue}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Resolve user prefs against the variant's option list, replacing
 * {@link RANDOM_CHOICE} with a randomly picked concrete choice. Options the
 * user has not touched are left out so the variant's own default applies.
 */
export function resolveOverrides(
  options: ChoiceVariable[],
  prefs: Record<string, string>,
): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const option of options) {
    if (option.displayName === null) continue;
    const pref = prefs[option.displayName];
    if (pref === undefined) continue;
    if (pref === RANDOM_CHOICE) {
      const choices = option.choices;
      if (choices.length === 0) continue;
      overrides[option.displayName] = choices[Math.floor(Math.random() * choices.length)]!;
    } else {
      overrides[option.displayName] = pref;
    }
  }
  return overrides;
}
