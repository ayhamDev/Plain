import { mkdir, writeFile } from 'node:fs/promises';
// Retain the manifest contract without shipping retired application source.
await mkdir('public/compositions', { recursive: true });
await writeFile(
  'public/compositions/manifest.json',
  JSON.stringify({ blocks: [], templates: [] }, null, 2),
);
console.log('Blocks and templates are empty.');
