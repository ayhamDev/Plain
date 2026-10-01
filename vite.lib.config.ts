import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = [...Object.keys(pkg.dependencies ?? {}), 'react', 'react-dom'];

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'plainui-tokens',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'tokens.css',
          source: readFileSync(new URL('./src/ui/tokens.css', import.meta.url), 'utf8'),
        });
        for (const fileName of ['styles.css.d.ts', 'tokens.css.d.ts']) {
          this.emitFile({ type: 'asset', fileName, source: 'export {};\n' });
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/ui/index.ts'),
        stylesheet: resolve(import.meta.dirname, 'src/ui/stylesheet.ts'),
      },
      formats: ['es'],
      cssFileName: 'plainui',
    },
    rolldownOptions: {
      external: (id) => external.some((name) => id === name || id.startsWith(`${name}/`)),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src/ui',
        entryFileNames: '[name].js',
        banner: "'use client';",
      },
    },
  },
});
