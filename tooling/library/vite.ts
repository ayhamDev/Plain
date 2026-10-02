import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export function defineLibraryConfig(root: string, options: { react?: boolean } = {}) {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const external = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
  return defineConfig({
    publicDir: false,
    plugins: options.react ? [react()] : [],
    build: {
      outDir: 'dist',
      sourcemap: true,
      lib: { entry: resolve(root, 'src/index.ts'), formats: ['es'] },
      rolldownOptions: {
        external: (id) => external.some((name) => id === name || id.startsWith(name + '/')),
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
          ...(options.react ? { banner: "'use client';" } : {}),
        },
      },
    },
  });
}
