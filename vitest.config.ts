import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
    maxWorkers: 2,
    server: { deps: { inline: ['@material/material-color-utilities'] } },
  },
});
