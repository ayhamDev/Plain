import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const publicRoot = fileURLToPath(new URL('../apps/docs/public/', import.meta.url));
// Retain the manifest contract without shipping retired application source.
await mkdir(publicRoot + 'compositions', { recursive: true });
await writeFile(
  publicRoot + 'compositions/manifest.json',
  JSON.stringify({ blocks: [], templates: [] }, null, 2),
);
console.log('Blocks and templates are empty.');
