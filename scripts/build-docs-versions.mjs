import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { build } from 'vite';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const config = JSON.parse(await readFile(resolve(root, 'docs/versions.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
assert.equal(config.current, pkg.version, 'Current docs must match the package version.');
assert.equal(config.versions.filter((entry) => entry.status === 'current').length, 1);
assert.equal(new Set(config.versions.map((entry) => entry.version)).size, config.versions.length);
const git = (...args) =>
  execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], {
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
  });
const contained = (path) => {
  const resolved = resolve(root, path);
  const local = relative(root, resolved);
  assert(
    local && !local.startsWith('..') && !isAbsolute(local),
    'Output must stay in this workspace.',
  );
  return resolved;
};
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function routesFor(sourceRoot) {
  const virtual = '\0docs-route-manifest';
  const entry = resolve(sourceRoot, '__docs_route_manifest.js');
  const results = await build({
    configFile: false,
    root: sourceRoot,
    logLevel: 'silent',
    plugins: [
      {
        name: 'docs-route-manifest',
        resolveId: (id) => (id === entry ? virtual : undefined),
        load: (id) =>
          id === virtual
            ? `import { components, guideLinks } from ${JSON.stringify(resolve(sourceRoot, 'src/docs/catalog.ts').replaceAll('\\', '/'))};
        export const routes = ['/', '/components', '/examples', '/changelog', '/docs/customization', '/docs/rtl', ...components.map(c => '/components/' + c.slug), ...guideLinks.map(g => '/docs/' + g.slug)];`
            : undefined,
      },
    ],
    build: { write: false, minify: false, lib: { entry, formats: ['es'] } },
  });
  const result = Array.isArray(results) ? results[0] : results;
  const code = result.output.find((item) => item.type === 'chunk').code;
  const { routes } = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  );
  if (await exists(resolve(sourceRoot, 'src/docs/pages/BlocksPage.tsx'))) {
    routes.push('/blocks', '/templates');
    const manifestPath = resolve(sourceRoot, 'public/compositions/manifest.json');
    if (await exists(manifestPath)) {
      const compositions = JSON.parse(await readFile(manifestPath, 'utf8'));
      for (const kind of ['blocks', 'templates'])
        for (const item of compositions[kind]) routes.push(`/${kind}/${item.id}`);
    }
  }
  return [...new Set(routes)].sort();
}

function legacyAdapter(code, filename) {
  const source = ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const edits = [];
  let needsNavigation = false;
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      ['href', 'src'].includes(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      /^\/(?!\/).*(?:\.(?:tgz|svg|png|webp|jpg|ico)|LICENSE)$/.test(node.initializer.text)
    )
      edits.push({
        start: node.initializer.getStart(source),
        end: node.initializer.end,
        text: `{import.meta.env.BASE_URL + ${JSON.stringify(node.initializer.text.slice(1))}}`,
      });
    if (
      ts.isJsxOpeningElement(node) &&
      node.tagName.getText(source) === 'BrowserRouter' &&
      !node.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'basename',
      )
    )
      edits.push({
        start: node.end - 1,
        end: node.end - 1,
        text: ' basename={import.meta.env.BASE_URL}',
      });
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(source) === 'Link' &&
      node.openingElement.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(source) === 'className' &&
          attribute.initializer &&
          ts.isStringLiteral(attribute.initializer) &&
          attribute.initializer.text === 'brand',
      ) &&
      !code.includes('VersionSwitcher')
    ) {
      needsNavigation = true;
      edits.push({ start: node.end, end: node.end, text: '<ArchiveNavigation />' });
      for (const child of node.children)
        if (ts.isJsxElement(child) && child.openingElement.tagName.getText(source) === 'Badge')
          edits.push({ start: child.pos, end: child.end, text: '' });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const edit of edits.sort((a, b) => b.start - a.start))
    code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
  return needsNavigation
    ? `import { ArchiveNavigation } from '__docs_archive_navigation__';\n${code}`
    : code;
}

const versions = [];
for (const entry of config.versions) {
  assert(/^\d+\.\d+\.\d+$/.test(entry.version), 'Only stable semantic versions are supported.');
  const base = `/v/${entry.version}/`;
  if (entry.status === 'current') {
    assert.equal(entry.version, config.current);
    versions.push({ ...entry, base, routes: await routesFor(root) });
    continue;
  }
  assert.equal(entry.status, 'archived');
  assert(
    typeof entry.ref === 'string' && /^[\da-f]{7,40}$/i.test(entry.ref),
    'Archives require a pinned commit, not a moving branch.',
  );
  const ref = git('rev-parse', `${entry.ref}^{commit}`).toString().trim();
  const originalPackage = JSON.parse(git('show', `${ref}:package.json`).toString());
  assert.equal(
    originalPackage.version,
    entry.version,
    'Archive revision does not match its version.',
  );
  const output = contained(`public/v/${entry.version}`);
  const signature = createHash('sha256')
    .update(ref)
    .update(await readFile(resolve(root, 'scripts/build-docs-versions.mjs')))
    .update(await readFile(resolve(root, 'scripts/archive-navigation.tsx')))
    .update(await readFile(resolve(root, 'src/docs/versioning.ts')))
    .digest('hex');
  const stamp = resolve(output, '.snapshot.json');
  if ((await exists(stamp)) && (await exists(resolve(output, 'index.html')))) {
    const saved = JSON.parse(await readFile(stamp, 'utf8'));
    if (saved.signature === signature) {
      versions.push(saved.manifest);
      console.log(`Reusing ${entry.version} documentation at ${ref.slice(0, 7)}.`);
      continue;
    }
  }
  const stage = contained(`.preview/docs-versions/${entry.version}/${ref}/source`);
  await mkdir(stage, { recursive: true });
  // Extract tracked source only. No checkout, recursive deletion, or user files are altered.
  const tracked = git('ls-tree', '--name-only', ref).toString().trim().split('\n');
  const archive = git(
    'archive',
    ref,
    ...[
      'src',
      'scripts',
      'public',
      'docs',
      'index.html',
      'package.json',
      'package-lock.json',
      'LICENSE',
    ].filter((path) => tracked.includes(path)),
  );
  const extracted = spawnSync('tar', ['-xf', '-'], {
    cwd: stage,
    input: archive,
    maxBuffer: 64 * 1024 * 1024,
  });
  assert.equal(extracted.status, 0, extracted.stderr?.toString());
  if (!(await exists(resolve(stage, 'node_modules/vite')))) {
    const cli = process.env.npm_execpath;
    assert(cli && (await exists(cli)), 'Run this script through npm run docs:versions.');
    const args = [
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefer-offline',
      '--cache',
      resolve(root, '.npm-cache'),
    ];
    let installed = spawnSync(process.execPath, [cli, 'ci', ...args], {
      cwd: stage,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });
    let repairedLock = false;
    if (installed.status !== 0 && installed.stderr.includes('EUSAGE')) {
      const repair = spawnSync(process.execPath, [cli, 'install', '--package-lock-only', ...args], {
        cwd: stage,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
      });
      assert.equal(repair.status, 0, repair.stderr);
      repairedLock = true;
      installed = spawnSync(process.execPath, [cli, 'ci', ...args], {
        cwd: stage,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
      });
    }
    assert.equal(installed.status, 0, installed.stderr);
    await writeFile(resolve(stage, '.lock-provenance.json'), JSON.stringify({ repairedLock }));
  }
  if (await exists(resolve(stage, 'scripts/generate-compositions.mjs'))) {
    const generated = spawnSync(
      process.execPath,
      ['--experimental-strip-types', 'scripts/generate-compositions.mjs'],
      { cwd: stage, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
    );
    assert.equal(generated.status, 0, generated.stderr);
  }
  const snapshotRequire = createRequire(resolve(stage, 'package.json'));
  const snapshotModule = (name) => import(pathToFileURL(snapshotRequire.resolve(name)).href);
  const { build: snapshotBuild } = await snapshotModule('vite');
  const { default: snapshotReact } = await snapshotModule('@vitejs/plugin-react');
  const { default: snapshotTailwind } = await snapshotModule('@tailwindcss/vite');
  await snapshotBuild({
    configFile: false,
    root: stage,
    base,
    logLevel: 'warn',
    resolve: {
      alias: { '@archive/ui': resolve(stage, 'src/ui/command.tsx') },
      dedupe: ['react', 'react-dom'],
    },
    plugins: [
      {
        name: 'archive-compatibility',
        enforce: 'pre',
        resolveId: (id) =>
          id === '__docs_archive_navigation__'
            ? resolve(root, 'scripts/archive-navigation.tsx')
            : undefined,
        transform(code, id) {
          const path = id.replaceAll('\\', '/');
          if (path.startsWith(stage.replaceAll('\\', '/')) && path.endsWith('.tsx'))
            code = legacyAdapter(code, id);
          if (path.startsWith(stage.replaceAll('\\', '/')) && /\.(tsx?|html)$/.test(path))
            return code.replaceAll(
              /(['"])plainui-(theme|direction|token-overrides)\1/g,
              (_match, quote, key) => `${quote}plainui-${key}:${entry.version}${quote}`,
            );
        },
      },
      snapshotReact(),
      snapshotTailwind(),
    ],
    build: { outDir: output, emptyOutDir: true, sourcemap: false },
  });
  const manifest = {
    version: entry.version,
    status: entry.status,
    ref,
    base,
    routes: await routesFor(stage),
  };
  const lockProvenance = await readFile(resolve(stage, '.lock-provenance.json'), 'utf8').catch(
    () => '{}',
  );
  await writeFile(
    stamp,
    JSON.stringify({ signature, manifest, lockProvenance: JSON.parse(lockProvenance) }, null, 2),
  );
  versions.push(manifest);
  console.log(
    `Built full ${entry.version} documentation (${manifest.routes.length} routes) from ${ref.slice(0, 7)}.`,
  );
}
await mkdir(resolve(root, 'public'), { recursive: true });
await writeFile(
  resolve(root, 'public/docs-versions.json'),
  JSON.stringify({ current: config.current, versions }, null, 2),
);
await writeFile(
  resolve(root, 'public/_redirects'),
  [
    ...versions
      .filter((entry) => entry.status === 'archived')
      .flatMap((entry) => [
        `/v/${entry.version} /v/${entry.version}/ 308`,
        `/v/${entry.version}/* /v/${entry.version}/index.html 200`,
      ]),
    `/v/${config.current} /v/${config.current}/ 308`,
    `/v/${config.current}/* /index.html 200`,
    '/v/* /404.html 404',
    '/* /index.html 200',
    '',
  ].join('\n'),
);
console.log(`Documentation registry contains ${versions.length} isolated versions.`);
