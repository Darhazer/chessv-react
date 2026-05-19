import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The AI search runs in a Web Worker; ES module workers keep the bundle clean.
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
});
