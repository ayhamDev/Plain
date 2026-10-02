import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Alias } from 'vite';

/** Development resolves only the public entry points to source for HMR. */
export function uiSourceAliases(): Alias[] {
  const root = new URL('../../packages/ui/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
    exports: Record<string, { import?: string; default?: string }>;
  };
  return Object.entries(manifest.exports).map(([name, conditions]) => {
    const key = name === '.' ? '@plain/ui' : '@plain/ui/' + name.slice(2);
    const target = conditions.import ?? conditions.default!;
    const source = target
      .replace('./dist/', './src/')
      .replace('charts-styles.css', 'ui/charts.css')
      .replace('full-calendar-styles.css', 'ui/full-calendar.css')
      .replace('./src/tokens.css', './src/ui/tokens.css');
    const file = source.endsWith('.js')
      ? [source.replace(/\.js$/, '.ts'), source.replace(/\.js$/, '.tsx')].find((candidate) =>
          existsSync(new URL(candidate, root)),
        )
      : source;
    if (!file || !existsSync(new URL(file, root))) throw new Error('Missing public source: ' + key);
    return {
      find: new RegExp('^' + key.replaceAll('.', '\\.') + '$'),
      replacement: fileURLToPath(new URL(file, root)),
    };
  });
}
