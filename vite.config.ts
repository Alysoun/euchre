import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** GitHub Pages project site: https://alysoun.github.io/euchre/ */
export default defineConfig({
  base: '/euchre/',
  plugins: [react()],
  server: {
    open: '/euchre/',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
