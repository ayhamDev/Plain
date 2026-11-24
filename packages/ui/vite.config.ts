import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = [...Object.keys(pkg.dependencies ?? {}), 'react', 'react-dom'];
// Every public runtime entry is built, including compatibility barrels that
// are no longer reached by the root's direct re-exports.
const publicEntries = Object.fromEntries(
  Object.values(pkg.exports as Record<string, { import?: string }>).flatMap(
    ({ import: target }) => {
      if (!target) return [];
      const name = target.replace('./dist/', '').replace(/\.js$/, '');
      const source = ['ts', 'tsx']
        .map((extension) => resolve(import.meta.dirname, `src/${name}.${extension}`))
        .find(existsSync);
      if (!source) throw new Error(`Missing runtime entry: ${target}`);
      return [[name, source]];
    },
  ),
);
const serverSafe = new Set([
  'utils.ts',
  'color-theme.ts',
  'color-palette.ts',
  'token-contract.ts',
  'neutral-palette.ts',
  'chart-palette.tsx',
  'qr-code-geometry.ts',
  'calendar-model.ts',
  'gantt-model.ts',
  'table-filter.ts',
  'progress-geometry.ts',
  'shape-geometry.ts',
  'shape-data.ts',
  'loading-shapes.ts',
  'loading-animation.ts',
]);

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
        for (const [name, value] of Object.entries(pkg.exports)) {
          if (!name.endsWith('.css')) continue;
          const fileName = (value as { types: string }).types.replace('./dist/', '');
          this.emitFile({ type: 'asset', fileName, source: 'export {};\n' });
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: {
        ...publicEntries,
        'ui/stylesheet': resolve(import.meta.dirname, 'src/ui/stylesheet.ts'),
        'ui/motion': resolve(import.meta.dirname, 'src/ui/motion.tsx'),
        'ui/kanban': resolve(import.meta.dirname, 'src/ui/kanban.tsx'),
        'ui/charts': resolve(import.meta.dirname, 'src/ui/charts.tsx'),
        'ui/full-calendar': resolve(import.meta.dirname, 'src/ui/full-calendar.tsx'),
        'charts-styles': resolve(import.meta.dirname, 'src/ui/charts.css'),
        'full-calendar-styles': resolve(import.meta.dirname, 'src/ui/full-calendar.css'),
        ...Object.fromEntries(
          [
            'core',
            'inputs',
            'collections',
            'calendar',
            'sidebar',
            'data-table',
            'qr-code',
            'shape',
          ].map((name) => [`${name}-styles`, resolve(import.meta.dirname, `src/ui/${name}.css`)]),
        ),
      },
      formats: ['es'],
      cssFileName: 'plainui',
    },
    rolldownOptions: {
      external: (id) => external.some((name) => id === name || id.startsWith(`${name}/`)),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        banner: (chunk) =>
          chunk.moduleIds.every((id) => serverSafe.has(id.replaceAll('\\', '/').split('/').at(-1)!))
            ? ''
            : "'use client';",
      },
    },
  },
});
