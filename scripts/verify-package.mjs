import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';
import { components, componentCode } from '../src/docs/catalog.ts';

const root = resolve('.');
const consumer = resolve('.preview/package-consumer');
const npmCli = process.env.npm_execpath;
assert(npmCli, 'Run this check with npm run verify:package.');
function run(binary, args, cwd = root) {
  const result = spawnSync(binary, args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

await mkdir(resolve('public'), { recursive: true });
const [packed] = JSON.parse(
  run(process.execPath, [
    npmCli,
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    'public',
  ]),
);
const packageFiles = new Set(packed.files.map((file) => file.path));
const compositions = JSON.parse(await readFile('public/compositions/manifest.json', 'utf8'));
const compositionExamples = [...compositions.blocks, ...compositions.templates];
assert.equal(compositions.blocks.length, 120);
assert.equal(compositions.templates.length, 60);
assert.equal(new Set(compositionExamples.map((item) => item.id)).size, 180);
assert(
  !packed.files.some((file) => /blocks|compositions|templates/.test(file.path)),
  'Copy/paste examples must not be embedded in the npm package.',
);
assert(
  !packed.files.some((file) => /\.(tgz|woff2|png|svg)$/.test(file.path)),
  'The library must not contain documentation assets or previous archives.',
);
for (const expected of [
  'LICENSE',
  'README.md',
  'dist/ui/index.js',
  'dist/ui/index.d.ts',
  'dist/ui/styles.css',
  'dist/tokens.css',
])
  assert(packageFiles.has(expected), `Missing ${expected}`);
await mkdir(join(consumer, 'examples'), { recursive: true });
await writeFile(
  join(consumer, 'package.json'),
  JSON.stringify({ name: 'plainui-package-check', private: true, type: 'module' }),
);
await copyFile(resolve('tests/fixtures/consumer.tsx'), join(consumer, 'consumer.tsx'));
await writeFile(join(consumer, 'button-only.ts'), "export { Button } from '@plain/ui';\n");
await writeFile(
  join(consumer, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: false,
      noEmit: true,
    },
    include: ['*.tsx', 'examples/*.tsx'],
  }),
);
for (const component of components)
  await writeFile(join(consumer, 'examples', `${component.slug}.tsx`), componentCode(component));
for (const item of compositionExamples) {
  assert(/^(blocks|templates)\/[a-z0-9-]+\.tsx$/.test(item.path));
  const source = await readFile(resolve('public/compositions', item.path), 'utf8');
  assert(!source.includes('@plain/ui/blocks'), 'Examples must contain their own implementation.');
  await writeFile(join(consumer, 'examples', `${item.id}.tsx`), source);
}
run(process.execPath, [
  npmCli,
  'install',
  '--prefix',
  consumer,
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
  '--cache',
  resolve('.npm-cache'),
  resolve('public', packed.filename),
  'react@19.3.0',
  'react-dom@19.3.0',
]);
run(process.execPath, [
  resolve('node_modules/typescript/bin/tsc'),
  '-p',
  join(consumer, 'tsconfig.json'),
]);
const built = await build({
  configFile: false,
  root: consumer,
  logLevel: 'error',
  build: {
    write: false,
    minify: true,
    lib: { entry: join(consumer, 'button-only.ts'), formats: ['es'] },
    rolldownOptions: { external: (id) => /^(react|react-dom)(\/|$)/.test(id) },
  },
});
const builds = Array.isArray(built) ? built : [built];
const chunks = builds
  .flatMap((output) => output.output)
  .filter((output) => output.type === 'chunk');
const modules = chunks.flatMap((chunk) =>
  Object.keys(chunk.modules).filter((id) => chunk.modules[id].renderedLength > 0),
);
for (const heavy of [
  'react-day-picker',
  '@tanstack',
  'cmdk',
  'sonner',
  'recharts',
  '@fullcalendar',
  '/motion/',
  'material-color-utilities',
  'vaul',
  'react-resizable-panels',
])
  assert(!modules.some((id) => id.includes(heavy)), `Button bundle retained ${heavy}`);
const bundle = chunks.map((chunk) => chunk.code).join('\n');
const gzipBytes = gzipSync(bundle).length;
assert(gzipBytes < 25000, `Button bundle exceeded 25 kB gzip: ${gzipBytes}`);
const library = await import(
  pathToFileURL(join(consumer, 'node_modules/@plain/ui/dist/ui/index.js')).href
);
const require = createRequire(join(consumer, 'package.json'));
const { createElement } = require('react');
const { renderToString } = require('react-dom/server');
assert(
  renderToString(createElement(library.Button, null, 'Package works')).includes('Package works'),
);
const metadata = JSON.parse(
  await readFile(join(consumer, 'node_modules/@plain/ui/package.json'), 'utf8'),
);
for (const value of Object.values(metadata.exports)) {
  for (const file of typeof value === 'string' ? [value] : Object.values(value))
    await readFile(join(consumer, 'node_modules/@plain/ui', file));
}
const minimumConsumer = resolve('.preview/package-consumer-react18');
await mkdir(minimumConsumer, { recursive: true });
await writeFile(
  join(minimumConsumer, 'package.json'),
  JSON.stringify({ name: 'plainui-react18-check', private: true, type: 'module' }),
);
run(process.execPath, [
  npmCli,
  'install',
  '--prefix',
  minimumConsumer,
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
  '--cache',
  resolve('.npm-cache'),
  resolve('public', packed.filename),
  'react@18.3.1',
  'react-dom@18.3.1',
]);
for (const directory of [consumer, minimumConsumer]) {
  const peerRequire = createRequire(join(directory, 'package.json'));
  const peerReact = peerRequire('react');
  const peerServer = peerRequire('react-dom/server');
  const peerLibrary = await import(
    pathToFileURL(join(directory, 'node_modules/@plain/ui/dist/ui/index.js')).href
  );
  const markup = peerServer.renderToString(
    peerReact.createElement(
      peerLibrary.LoadingOverlay,
      null,
      peerReact.createElement(peerLibrary.Button, null, 'Loading action'),
    ),
  );
  assert(markup.includes(' inert=""'), `React ${peerReact.version} dropped the inert attribute.`);
  assert(markup.includes('aria-hidden="true"'));
  assert(
    peerServer
      .renderToString(peerReact.createElement(peerLibrary.H1, null, 'Native heading'))
      .startsWith('<h1'),
  );
}
console.log(
  JSON.stringify(
    {
      archive: packed.filename,
      packageBytes: packed.size,
      files: packed.files.length,
      compiledExamples: components.length,
      compiledCompositions: compositionExamples.length,
      buttonGzipBytes: gzipBytes,
      heavyFeaturesExcluded: true,
      ssr: true,
      ssrReactVersions: ['18.3.1', '19.3.0'],
    },
    null,
    2,
  ),
);
