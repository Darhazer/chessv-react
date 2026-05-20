/**
 * Persist a piece of React state in `localStorage`. The value is JSON-encoded,
 * so anything serialisable works; falls back to the initial value if storage
 * is unavailable (e.g. private mode, SSR) or the stored JSON is corrupt.
 */
import { useEffect, useState } from 'react';

const PREFIX = 'chessv:';

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — silently ignore; the in-memory
    // state is still the source of truth for this session.
  }
}

/**
 * `useState`, but the value is persisted to `localStorage` under
 * `chessv:<key>`. The initial value is used the first time only; subsequent
 * mounts hydrate from storage.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readStorage(key, initial));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
