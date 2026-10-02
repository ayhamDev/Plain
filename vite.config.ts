import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { docsVersionMiddleware } from './scripts/docs-version-middleware.ts';

export default defineConfig({
  plugins: [docsVersionMiddleware(), react(), tailwindcss()],
  build: {
    outDir: 'site-dist',
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
      ignored: ['**/.preview/**', '**/.npm-cache/**', '**/dist/**', '**/public/v/**'],
    },
  },
});
