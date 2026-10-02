import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const packageRoot = fileURLToPath(new URL('../packages/ui/', import.meta.url));
const destination = fileURLToPath(new URL('../apps/docs/public/', import.meta.url));
assert(process.env.npm_execpath, 'Run through an npm script.');
await mkdir(destination, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    process.env.npm_execpath,
    'pack',
    '--ignore-scripts',
    '--json',
    '--workspaces=false',
    '--pack-destination',
    destination,
  ],
  {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  },
);
assert.equal(result.status, 0, result.stderr);
console.log('Packed ' + JSON.parse(result.stdout)[0].filename);
