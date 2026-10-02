import { mkdir, readFile, writeFile, access, realpath, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contained, repositoryRoot } from './check-workspaces.mjs';

export async function createPackage(
  name,
  { root = repositoryRoot, react = false, publishable = false, dryRun = false } = {},
) {
  if (!/^[a-z][a-z0-9-]*$/.test(name ?? '') || /^(con|prn|aux|nul|com\d|lpt\d)$/.test(name))
    throw new Error(
      'Use a lowercase package name such as icon; paths and reserved names are not allowed.',
    );
  const packages = join(root, 'packages');
  if (!dryRun) await mkdir(packages, { recursive: true });
  if (!contained(await realpath(root), await realpath(packages)))
    throw new Error('Package directory escapes the repository.');
  const directory = join(packages, name);
  try {
    await access(directory);
    throw new Error('Refusing to overwrite existing package: ' + name);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const versions = rootPackage.devDependencies;
  const pkg = {
    name: '@plain/' + name,
    version: '0.0.0',
    private: !publishable,
    type: 'module',
    license: 'MIT',
    sideEffects: false,
    files: ['dist', 'README.md', 'LICENSE', 'CHANGELOG.md'],
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
    engines: { node: '>=22.12.0' },
    scripts: {
      build: 'vite build && tsc -p tsconfig.build.json',
      typecheck: 'tsc --noEmit',
      test: 'vitest run --passWithNoTests',
      prepack: 'npm run build',
    },
    ...(publishable ? { publishConfig: { access: 'public' } } : {}),
    ...(react ? { peerDependencies: { react: '^18.3.0 || ^19.0.0' } } : {}),
    devDependencies: {
      vite: versions.vite,
      typescript: versions.typescript,
      vitest: versions.vitest,
      ...(react ? { react: '^19.3.0', '@types/react': '^19.3.0' } : {}),
    },
  };
  const json = (value) => JSON.stringify(value, null, 2) + '\n';
  const files = {
    'package.json': json(pkg),
    'src/index.ts': 'export {};\n',
    'tsconfig.json': json({
      extends: '../../tsconfig.base.json',
      include: ['src', 'tests', '*.config.ts'],
    }),
    'tsconfig.build.json': json({
      extends: './tsconfig.json',
      compilerOptions: {
        noEmit: false,
        emitDeclarationOnly: true,
        declaration: true,
        declarationMap: true,
        rootDir: 'src',
        outDir: 'dist',
      },
      include: ['src'],
    }),
    'vite.config.ts':
      "import { defineLibraryConfig } from '../../tooling/library/vite.ts';\nexport default defineLibraryConfig(import.meta.dirname, { react: " +
      react +
      ' });\n',
    'vitest.config.ts':
      "import { defineConfig } from 'vitest/config';\nexport default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'] } });\n",
    'README.md':
      '# @plain/' +
      name +
      '\n\nImplement the public API in `src/index.ts` and add tests before release.\n\nThis package starts ' +
      (publishable
        ? 'publishable, but is not published.'
        : 'private. Set `private: false` and add `publishConfig.access: public` only when ready to release.') +
      '\n',
    'CHANGELOG.md':
      '# @plain/' +
      name +
      '\n\nNo releases yet. Changesets will record independent package releases.\n',
  };
  if (!dryRun) {
    await mkdir(directory);
    for (const [path, content] of Object.entries(files)) {
      const target = join(directory, path);
      await mkdir(resolve(target, '..'), { recursive: true });
      await writeFile(target, content, { flag: 'wx' });
    }
    await copyFile(join(root, 'LICENSE'), join(directory, 'LICENSE'));
  }
  return {
    name: pkg.name,
    directory,
    private: pkg.private,
    files: [...Object.keys(files), 'LICENSE'],
    dryRun,
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [name, ...flags] = process.argv.slice(2);
  if (flags.some((flag) => !['--react', '--publishable', '--dry-run'].includes(flag)))
    throw new Error('Unknown flag. Use --react, --publishable or --dry-run.');
  console.log(
    JSON.stringify(
      await createPackage(name, {
        react: flags.includes('--react'),
        publishable: flags.includes('--publishable'),
        dryRun: flags.includes('--dry-run'),
      }),
      null,
      2,
    ),
  );
}
