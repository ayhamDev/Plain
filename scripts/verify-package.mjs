import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';
import { components, componentCode } from '../apps/docs/src/docs/catalog.ts';

const root = resolve('.');
const packageRoot = resolve(root, 'packages/ui');
const publicRoot = resolve(root, 'apps/docs/public');
const consumer = resolve('.preview/package-consumer');
const npmCli = process.env.npm_execpath;
assert(npmCli, 'Run this check with npm run verify:package.');
function run(binary, args, cwd = root) {
  const result = spawnSync(binary, args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

await mkdir(publicRoot, { recursive: true });
const [packed] = JSON.parse(
  run(
    process.execPath,
    [
      npmCli,
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      publicRoot,
      '--workspaces=false',
    ],
    packageRoot,
  ),
);
const packageFiles = new Set(packed.files.map((file) => file.path));
const compositions = JSON.parse(
  await readFile(join(publicRoot, 'compositions/manifest.json'), 'utf8'),
);
const compositionExamples = [...compositions.blocks, ...compositions.templates];
assert.equal(compositions.blocks.length, 0);
assert.equal(compositions.templates.length, 0);
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
const exampleDirectory = resolve(consumer, 'examples');
const relativeDirectory = relative(root, exampleDirectory);
assert(!isAbsolute(relativeDirectory) && !relativeDirectory.startsWith('..'));
await rm(exampleDirectory, { recursive: true, force: true });
await mkdir(join(consumer, 'examples'), { recursive: true });
await writeFile(
  join(consumer, 'package.json'),
  JSON.stringify({ name: 'plainui-package-check', private: true, type: 'module' }),
);
await copyFile(resolve('apps/docs/tests/fixtures/consumer.tsx'), join(consumer, 'consumer.tsx'));
await writeFile(join(consumer, 'button-only.ts'), "export { Button } from '@plain/ui';\n");
await writeFile(
  join(consumer, 'layout-only.ts'),
  "export { Stack, Grid, LayoutPresence } from '@plain/ui/layout';\n",
);
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
  const source = await readFile(resolve(publicRoot, 'compositions', item.path), 'utf8');
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
  '--prefer-offline',
  '--cache',
  resolve('.npm-cache'),
  join(publicRoot, packed.filename),
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
function eagerChunks(chunks) {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const visited = new Set();
  const visit = (chunk) => {
    if (visited.has(chunk.fileName)) return;
    visited.add(chunk.fileName);
    for (const dependency of chunk.imports) {
      const imported = byName.get(dependency.replace(/^\.\//, ''));
      if (imported) visit(imported);
    }
  };
  chunks.filter((chunk) => chunk.isEntry).forEach(visit);
  return chunks.filter((chunk) => visited.has(chunk.fileName));
}
const buttonEagerChunks = eagerChunks(chunks);
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
  '@dnd-kit',
  '/motion/',
  'material-color-utilities',
  'vaul',
  'react-resizable-panels',
  '/qrcode/',
])
  assert(!modules.some((id) => id.includes(heavy)), `Button bundle retained ${heavy}`);
const bundle = buttonEagerChunks.map((chunk) => chunk.code).join('\n');
const buttonDeferredGzipBytes = gzipSync(
  chunks
    .filter((chunk) => !buttonEagerChunks.includes(chunk))
    .map((chunk) => chunk.code)
    .join('\n'),
).length;
assert(
  !buttonEagerChunks.some((chunk) =>
    Object.keys(chunk.modules).some(
      (id) => id.includes('/react-tooltip/') || id.includes('/tooltip-runtime.'),
    ),
  ),
  'Button eagerly retained the optional tooltip engine',
);
const gzipBytes = gzipSync(bundle).length;
assert(gzipBytes < 25000, `Button bundle exceeded 25 kB gzip: ${gzipBytes}`);
assert(
  !modules.some((id) => id.includes('/layout-presence.')),
  'Button bundle retained layout presence',
);
const library = await import(
  pathToFileURL(join(consumer, 'node_modules/@plain/ui/dist/ui/index.js')).href
);
const require = createRequire(join(consumer, 'package.json'));
const layoutBuild = await build({
  configFile: false,
  root: consumer,
  logLevel: 'error',
  build: {
    write: false,
    minify: true,
    lib: { entry: join(consumer, 'layout-only.ts'), formats: ['es'] },
    rolldownOptions: { external: (id) => /^(react|react-dom)(\/|$)/.test(id) },
  },
});
const layoutChunks = (Array.isArray(layoutBuild) ? layoutBuild : [layoutBuild])
  .flatMap((output) => output.output)
  .filter((output) => output.type === 'chunk');
const layoutModules = layoutChunks.flatMap((chunk) =>
  Object.keys(chunk.modules).filter((id) => chunk.modules[id].renderedLength > 0),
);
for (const heavy of [
  '/motion/',
  'framer-motion',
  'react-resizable-panels',
  'recharts',
  '@tanstack',
])
  assert(!layoutModules.some((id) => id.includes(heavy)), `Layout bundle retained ${heavy}`);
const layoutEagerChunks = eagerChunks(layoutChunks);
const layoutGzipBytes = gzipSync(layoutEagerChunks.map((chunk) => chunk.code).join('\n')).length;
const layoutDeferredGzipBytes = gzipSync(
  layoutChunks
    .filter((chunk) => !layoutEagerChunks.includes(chunk))
    .map((chunk) => chunk.code)
    .join('\n'),
).length;
assert(
  !layoutEagerChunks.some((chunk) =>
    Object.keys(chunk.modules).some(
      (id) => id.includes('/react-tooltip/') || id.includes('/tooltip-runtime.'),
    ),
  ),
  'Layout eagerly retained the optional tooltip engine',
);
assert(layoutGzipBytes < 25000, `Layout bundle exceeds the 25kB gzip budget: ${layoutGzipBytes}`);
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
  '--prefer-offline',
  '--cache',
  resolve('.npm-cache'),
  join(publicRoot, packed.filename),
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
  const peerCharts = await import(
    pathToFileURL(join(directory, 'node_modules/@plain/ui/dist/ui/charts.js')).href
  );
  const item = peerServer.renderToString(
    peerReact.createElement(peerLibrary.Item, { defaultSelected: true }, 'Peer item'),
  );
  assert(
    item.includes('aria-pressed="true"') &&
      item.includes('type="button"') &&
      !/\s(?:selected|defaultSelected|interactive)=/.test(item),
    `React ${peerReact.version} did not preserve Item semantics.`,
  );
  const disabledItem = peerServer.renderToString(
    peerReact.createElement(
      peerLibrary.Item,
      { asChild: true, disabled: true },
      peerReact.createElement('a', { href: '#file' }, 'File'),
    ),
  );
  assert(
    disabledItem.includes('aria-disabled="true"') && !disabledItem.includes('href='),
    `React ${peerReact.version} left a disabled Item link navigable.`,
  );
  for (const resize of ['none', 'vertical', 'horizontal', 'both']) {
    const textarea = peerServer.renderToString(
      peerReact.createElement(peerLibrary.Textarea, {
        resize,
        name: 'notes',
        defaultValue: 'Team notes',
        'aria-label': 'Notes',
      }),
    );
    assert(
      textarea.includes(`data-resize="${resize}"`) &&
        textarea.includes('name="notes"') &&
        textarea.includes('Team notes') &&
        !/\sresize=/.test(textarea),
      `React ${peerReact.version} did not preserve textarea resize mode and native props.`,
    );
  }
  for (const variant of ['outlined', 'filled', 'ghost', 'contrast']) {
    const pin = peerServer.renderToString(
      peerReact.createElement(peerLibrary.PinInput, {
        variant,
        name: 'verification',
        defaultValue: '1234',
        length: 4,
        'aria-label': 'Verification code',
      }),
    );
    assert(
      pin.includes(`data-variant="${variant}"`) &&
        pin.includes('value="1234"') &&
        pin.includes('name="verification"') &&
        !/\svariant=/.test(pin) &&
        (pin.match(/data-slot="slot"/g) ?? []).length === 4,
      `React ${peerReact.version} did not preserve the ${variant} PIN appearance and native value.`,
    );
    const choice = peerServer.renderToString(
      peerReact.createElement(peerLibrary.Combobox, {
        variant,
        name: 'team',
        defaultValue: 'design',
        options: [{ value: 'design', label: 'Design' }],
      }),
    );
    assert(
      choice.includes('type="button"') &&
        choice.includes('value="design"') &&
        !/\svariant=/.test(choice),
    );
  }
  assert.equal(peerLibrary.ChartSkeleton, peerCharts.ChartSkeleton);
  const chartSkeleton = peerServer.renderToString(
    peerReact.createElement(
      peerLibrary.PlainProvider,
      { persist: false, theme: { motion: 'none' } },
      peerReact.createElement(peerLibrary.ChartSkeleton, {
        variant: 'heatmap',
        rows: 3,
        columns: 5,
        height: 176,
        label: 'Preparing chart',
      }),
    ),
  );
  assert(
    chartSkeleton.includes('role="status"') &&
      chartSkeleton.includes('Preparing chart') &&
      chartSkeleton.includes('data-motion="disabled"') &&
      chartSkeleton.includes('height:176px') &&
      chartSkeleton.includes('aria-hidden="true"') &&
      !chartSkeleton.includes('recharts') &&
      !chartSkeleton.includes(' ui-skeleton'),
    `React ${peerReact.version} did not render a static, accessible chart skeleton.`,
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
  const presence = peerServer.renderToString(
    peerReact.createElement(
      peerLibrary.Stack,
      { presence: true },
      peerReact.createElement('p', { key: 'content' }, 'Visible layout'),
    ),
  );
  assert(
    presence.includes('Visible layout') && !presence.includes('opacity:0'),
    `React ${peerReact.version} hid the server layout.`,
  );
  const calendar = peerServer.renderToString(
    peerReact.createElement(peerLibrary.Calendar, {
      defaultMonth: new Date(2026, 10, 20),
      localeCode: 'en-US',
    }),
  );
  for (const [label, value] of [
    ['Choose month', 'November'],
    ['Choose year', '2026'],
  ]) {
    const trigger = calendar.split(`aria-label="${label}"`)[1]?.split('</button>')[0];
    assert(
      trigger?.includes(value),
      `React ${peerReact.version} omitted the server calendar ${label}.`,
    );
  }
  const range = peerServer.renderToString(
    peerReact.createElement(peerLibrary.DateRangePicker, {
      name: 'travel',
      defaultValue: { from: new Date(2026, 10, 20), to: new Date(2026, 10, 23) },
    }),
  );
  assert(
    range.includes('value="2026-11-20"') && range.includes('value="2026-11-23"'),
    `React ${peerReact.version} omitted server date range form values.`,
  );
  const tooltip = peerServer.renderToString(
    peerReact.createElement(
      peerLibrary.PlainProvider,
      { persist: false, tooltip: { delayDuration: 200 } },
      peerReact.createElement(
        peerLibrary.Button,
        {
          type: 'submit',
          name: 'action',
          value: 'save',
          tooltip: { content: 'Save project', side: 'right' },
        },
        peerReact.createElement('svg', { 'aria-hidden': true }),
      ),
    ),
  );
  assert(
    tooltip.includes('aria-label="Save project"') &&
      tooltip.includes('type="submit"') &&
      tooltip.includes('name="action"'),
    `React ${peerReact.version} lost native tooltip trigger attributes during SSR.`,
  );
  assert(
    !/\btooltip=/.test(tooltip) && !tooltip.includes('role="tooltip"'),
    `React ${peerReact.version} leaked tooltip configuration into server markup.`,
  );
  const qr = peerServer.renderToString(
    peerReact.createElement(peerLibrary.QRCode, { value: 'https://github.com/ayhamDev/Plain' }),
  );
  assert(qr.startsWith('<svg'), `React ${peerReact.version} did not render QRCode as SVG.`);
  assert(
    qr.includes('data-state="ready"') && qr.includes('<path'),
    `React ${peerReact.version} did not encode QRCode during SSR.`,
  );
  const brandedQR = peerServer.renderToString(
    peerReact.createElement(peerLibrary.QRCode, {
      value: 'https://github.com/ayhamDev/Plain',
      shape: 'circle',
      moduleShape: 'dots',
      finderShape: 'rounded',
      finderCenterShape: 'circle',
      logo: { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' },
      gradient: {
        stops: [
          { offset: 0, color: '#111827' },
          { offset: 1, color: '#3730a3' },
        ],
      },
      animation: { preset: 'fade', duration: 600 },
      qrVersion: 7,
      maskPattern: 3,
    }),
  );
  assert(
    brandedQR.includes('data-shape="circle"') &&
      brandedQR.includes('data-level="H"') &&
      brandedQR.includes('<linearGradient') &&
      brandedQR.includes('<image') &&
      brandedQR.includes('data-slot="finder-center"'),
    `React ${peerReact.version} did not render the customized QR during SSR.`,
  );
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
      layoutGzipBytes,
      buttonDeferredGzipBytes,
      layoutDeferredGzipBytes,
      heavyFeaturesExcluded: true,
      ssr: true,
      ssrReactVersions: ['18.3.1', '19.3.0'],
    },
    null,
    2,
  ),
);
