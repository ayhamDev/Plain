import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { docsVersionMiddleware } from '../../scripts/docs-version-middleware.ts';
import { uiSourceAliases } from '../../tooling/config/ui-source.ts';

export default defineConfig(({ command }) => ({
  resolve: { alias: command === 'serve' ? uiSourceAliases() : [], dedupe: ['react', 'react-dom'] },
  plugins: [docsVersionMiddleware(), react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    watch: {
      ignored: [
        '**/.preview/**',
        '**/.npm-cache/**',
        '**/dist/**',
        '**/public/v/**',
        '**/.turbo/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/coverage/**',
      ],
    },
  },
}));
