import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from './index.js';

describe('@chessv/engine scaffold', () => {
  it('exposes a version string', () => {
    expect(ENGINE_VERSION).toBe('0.0.0');
  });
});
