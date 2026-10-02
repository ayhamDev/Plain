import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { uiSourceAliases } from '../../tooling/config/ui-source.ts';
import { createPackage } from '../create-package.mjs';
import {
  contained,
  repositoryRoot,
  graphErrors,
  importErrors,
  checkWorkspaces,
} from '../check-workspaces.mjs';

const exports = { '.': { types: './dist/index.d.ts', import: './dist/index.js' } };
function graph() {
  return {
    root: repositoryRoot,
    manifest: { private: true },
    workspaces: ['ui', 'icon'].map((name) => ({
      directory: join(repositoryRoot, 'packages', name),
      manifest: {
        name: '@plain/' + name,
        version: '0.2.0',
        exports,
        types: './dist/index.d.ts',
        files: ['dist'],
        license: 'MIT',
        scripts: { build: 'build', typecheck: 'typecheck', test: 'test' },
      },
    })),
  };
}
test('the real workspace graph and package imports pass boundary checks', async () => {
  const result = await checkWorkspaces();
  assert(result.workspaces.some((item) => item.manifest.name === '@plain/ui'));
  assert(
    result.workspaces.some((item) => item.manifest.name === '@plain/docs' && item.manifest.private),
  );
});
test('development aliases cover public exports without leaking private entry points', async () => {
  const pkg = JSON.parse(await readFile(join(repositoryRoot, 'packages/ui/package.json'), 'utf8'));
  const aliases = uiSourceAliases();
  for (const entry of Object.keys(pkg.exports)) {
    const name = entry === '.' ? '@plain/ui' : '@plain/ui/' + entry.slice(2);
    assert.equal(aliases.filter((alias) => alias.find.test(name)).length, 1, name);
  }
  for (const name of [
    '@plain/ui/src/ui/forms',
    '@plain/ui/table-filter',
    '@plain/icon',
    '@plain/ui/forms/private',
  ])
    assert(!aliases.some((alias) => alias.find.test(name)), name);
});

test('libraries reject dependency cycles and public dependencies on private packages', () => {
  const value = graph();
  value.workspaces[0].manifest.dependencies = { '@plain/icon': '0.2.0' };
  value.workspaces[1].manifest.dependencies = { '@plain/ui': '0.2.0' };
  value.workspaces[1].manifest.private = true;
  const errors = graphErrors(value);
  assert(errors.some((error) => error.includes('cycle')));
  assert(errors.some((error) => error.includes('is private')));
});
test('private apps cannot become runtime library dependencies', () => {
  const value = graph();
  value.workspaces.push({
    directory: join(repositoryRoot, 'apps', 'docs'),
    manifest: { ...value.workspaces[1].manifest, name: '@plain/docs', private: true },
  });
  value.workspaces[0].manifest.dependencies = { '@plain/docs': '0.2.0' };
  assert(graphErrors(value).some((error) => error.includes('must not depend on apps')));
});
test('source cannot consume undeclared dependencies, private subpaths or sibling source', () => {
  const value = graph();
  const owner = value.workspaces[0];
  const source = join(owner.directory, 'src/index.ts');
  owner.manifest.devDependencies = { '@plain/icon': '0.2.0' };
  assert(
    importErrors(value, owner, source, '@plain/icon').some((error) =>
      error.includes('undeclared runtime'),
    ),
  );
  owner.manifest.dependencies = { '@plain/icon': '0.2.0' };
  assert.deepEqual(importErrors(value, owner, source, '@plain/icon'), []);
  assert(
    importErrors(value, owner, source, '@plain/icon/src/private').some((error) =>
      error.includes('private'),
    ),
  );
  assert(
    importErrors(value, owner, source, '../../icon/src/index').some((error) =>
      error.includes('cross-boundary'),
    ),
  );
  assert(contained(owner.directory, join(owner.directory, 'src/index.ts')));
  assert(!contained(owner.directory, owner.directory + '-other/src/index.ts'));
});
test('package names, private root and publish contracts are checked', () => {
  const value = graph();
  value.manifest.private = false;
  value.workspaces[1].manifest.name = value.workspaces[0].manifest.name;
  delete value.workspaces[0].manifest.exports;
  const errors = graphErrors(value);
  assert(errors.some((error) => error.includes('root must be private')));
  assert(errors.some((error) => error.includes('Duplicate')));
  assert(errors.some((error) => error.includes('need exports')));
});
async function fixture(context) {
  const parent = join(repositoryRoot, '.preview/scaffolds');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, 'library-'));
  await mkdir(join(root, 'packages'));
  await cp(join(repositoryRoot, 'package.json'), join(root, 'package.json'));
  await cp(join(repositoryRoot, 'package-lock.json'), join(root, 'package-lock.json'));
  await cp(join(repositoryRoot, 'LICENSE'), join(root, 'LICENSE'));
  context.after(async () => {
    assert(contained(parent, root) && root !== parent);
    await rm(root, { recursive: true, force: true });
  });
  return root;
}
test('scaffolds a private React package without modifying root metadata and refuses overwrites', async (context) => {
  const root = await fixture(context);
  const original = await readFile(join(root, 'package.json'), 'utf8');
  const plan = await createPackage('icon', { root, react: true, dryRun: true });
  assert(plan.private);
  assert.deepEqual(await readdir(join(root, 'packages')), []);
  await createPackage('icon', { root, react: true });
  const pkg = JSON.parse(await readFile(join(root, 'packages/icon/package.json'), 'utf8'));
  assert.equal(pkg.name, '@plain/icon');
  assert(pkg.private);
  assert(pkg.peerDependencies.react);
  assert.equal(await readFile(join(root, 'package.json'), 'utf8'), original);
  await assert.rejects(createPackage('icon', { root }), /overwrite/);
  for (const name of ['../escape', 'Icon', 'con', 'a/b', '', null])
    await assert.rejects(createPackage(name, { root }), /package name/);
});
test('generated library builds ESM and declarations with shared tooling', async (context) => {
  const root = await fixture(context);
  await cp(join(repositoryRoot, 'tooling/library'), join(root, 'tooling/library'), {
    recursive: true,
  });
  await cp(join(repositoryRoot, 'tsconfig.base.json'), join(root, 'tsconfig.base.json'));
  const { directory } = await createPackage('icon', { root, react: true, publishable: true });
  await writeFile(join(directory, 'src/index.ts'), "export { sample, Sample } from './sample';\n");
  await writeFile(
    join(directory, 'src/sample.tsx'),
    "export const sample = 'icon';\nexport function Sample() { return <span>{sample}</span>; }\n",
  );
  const run = (args) => {
    const result = spawnSync(process.execPath, args, {
      cwd: directory,
      encoding: 'utf8',
      windowsHide: true,
    });
    assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
  };
  run([resolve(repositoryRoot, 'node_modules/vite/bin/vite.js'), 'build']);
  run([resolve(repositoryRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json']);
  assert((await readFile(join(directory, 'dist/index.js'), 'utf8')).includes('sample'));
  assert((await readFile(join(directory, 'dist/sample.js'), 'utf8')).includes('icon'));
  assert((await readFile(join(directory, 'dist/sample.d.ts'), 'utf8')).includes('Sample'));
  const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  assert.equal(pkg.private, false);
  assert.equal(pkg.publishConfig.access, 'public');
});

test('Changesets versions packages independently and updates private consumers without bumping them', async (context) => {
  const root = await fixture(context);
  const initialized = spawnSync('git', ['init', '--quiet'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(initialized.status, 0, initialized.stderr);
  const ui = await createPackage('ui', { root, publishable: true });
  const icon = await createPackage('icon', { root, publishable: true });
  const setVersion = async (directory, version) => {
    const path = join(directory, 'package.json');
    const pkg = JSON.parse(await readFile(path, 'utf8'));
    await writeFile(path, JSON.stringify({ ...pkg, version }));
  };
  await setVersion(ui.directory, '0.2.0');
  await setVersion(icon.directory, '1.0.0');
  await mkdir(join(root, 'apps/docs'), { recursive: true });
  await writeFile(
    join(root, 'apps/docs/package.json'),
    JSON.stringify({
      name: '@plain/docs',
      version: '0.0.0',
      private: true,
      dependencies: { '@plain/ui': '0.2.0' },
    }),
  );
  await mkdir(join(root, '.changeset'));
  const config = JSON.parse(await readFile(join(repositoryRoot, '.changeset/config.json'), 'utf8'));
  await writeFile(
    join(root, '.changeset/config.json'),
    JSON.stringify({ ...config, changelog: false }),
  );
  const metadata = JSON.parse(
    await readFile(join(repositoryRoot, 'node_modules/@changesets/cli/package.json'), 'utf8'),
  );
  const cli = resolve(repositoryRoot, 'node_modules/@changesets/cli', metadata.bin.changeset);
  const version = async (name) => {
    await writeFile(
      join(root, '.changeset/fixture-release.md'),
      `---\n'${name}': minor\n---\n\nFixture release.\n`,
    );
    const result = spawnSync(process.execPath, [cli, 'version'], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    });
    assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
  };
  const read = async (directory) =>
    JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  await version('@plain/icon');
  assert.equal((await read(icon.directory)).version, '1.1.0');
  assert.equal((await read(ui.directory)).version, '0.2.0');
  await version('@plain/ui');
  assert.equal((await read(ui.directory)).version, '0.3.0');
  assert.equal((await read(icon.directory)).version, '1.1.0');
  const docs = await read(join(root, 'apps/docs'));
  assert.equal(docs.version, '0.0.0');
  assert.equal(docs.dependencies['@plain/ui'], '0.3.0');
});
