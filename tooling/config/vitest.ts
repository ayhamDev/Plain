import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export function defineReactTests() {
  return defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: [fileURLToPath(new URL('../testing/setup.ts', import.meta.url))],
      include: ['tests/**/*.test.{ts,tsx}'],
      restoreMocks: true,
      clearMocks: true,
      maxWorkers: 2,
      server: { deps: { inline: ['@material/material-color-utilities'] } },
    },
  });
}
