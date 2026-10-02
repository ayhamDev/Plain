import { readFile, readdir, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBuiltin } from 'node:module';
import ts from 'typescript';
import postcss from 'postcss';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
// Use path segments rather than a string-prefix check (packages/ui-other is not packages/ui).
export function contained(root, path) {
  const local = relative(root, path).replaceAll('\\', '/');
  return !isAbsolute(local) && local !== '..' && !local.startsWith('../');
}
export async function workspaceGraph(root = repositoryRoot) {
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const workspaces = [];
  for (const pattern of manifest.workspaces ?? []) {
    if (!/^(packages|apps)\/\*$/.test(pattern))
      throw new Error('Unsupported workspace glob: ' + pattern);
    const parent = join(root, pattern.slice(0, -2));
    for (const entry of await readdir(parent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = join(parent, entry.name);
      const file = await readFile(join(directory, 'package.json'), 'utf8').catch((error) => {
        if (error.code === 'ENOENT') return undefined;
        throw error;
      });
      if (file) {
        if (!contained(root, await realpath(directory)))
          throw new Error('Workspace escapes repository: ' + directory);
        workspaces.push({ directory, manifest: JSON.parse(file) });
      }
    }
  }
  return { root, manifest, workspaces };
}
export function graphErrors(graph) {
  const errors = [];
  if (graph.manifest.private !== true) errors.push('The repository root must be private.');
  const names = new Map();
  for (const item of graph.workspaces) {
    const pkg = item.manifest;
    if (!/^@plain\/[a-z][a-z0-9-]*$/.test(pkg.name ?? ''))
      errors.push('Invalid workspace name: ' + pkg.name);
    if (names.has(pkg.name)) errors.push('Duplicate workspace name: ' + pkg.name);
    names.set(pkg.name, item);
    if (contained(join(graph.root, 'apps'), item.directory) && pkg.private !== true)
      errors.push(pkg.name + ': apps must be private.');
    for (const task of ['build', 'typecheck', 'test'])
      if (!pkg.scripts?.[task]) errors.push(pkg.name + ': missing ' + task + ' script.');
    if (!pkg.private) {
      if (!pkg.exports || !pkg.types || !pkg.files?.includes('dist'))
        errors.push(pkg.name + ': publishable packages need exports, types and a dist allowlist.');
      if (!pkg.license) errors.push(pkg.name + ': publishable packages need a license.');
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(name, chain = []) {
    if (visiting.has(name)) {
      errors.push('Workspace cycle: ' + [...chain, name].join(' -> '));
      return;
    }
    if (visited.has(name)) return;
    visiting.add(name);
    const pkg = names.get(name).manifest;
    for (const dependency of Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    })) {
      if (names.has(dependency)) {
        const target = names.get(dependency);
        if (
          contained(join(graph.root, 'packages'), names.get(name).directory) &&
          contained(join(graph.root, 'apps'), target.directory)
        )
          errors.push(name + ': libraries must not depend on apps.');
        if (
          !pkg.private &&
          target.manifest.private &&
          (pkg.dependencies?.[dependency] || pkg.peerDependencies?.[dependency])
        )
          errors.push(name + ': runtime dependency ' + dependency + ' is private.');
        visit(dependency, [...chain, name]);
      }
    }
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of names.keys()) visit(name);
  return errors;
}
export function importErrors(
  graph,
  owner,
  file,
  specifier,
  { typeOnly = false, css = false } = {},
) {
  const errors = [];
  if (specifier.startsWith('.')) {
    const target = resolve(dirname(file), specifier);
    const sharedTool =
      (contained(join(graph.root, 'tooling'), target) ||
        contained(join(graph.root, 'scripts'), target)) &&
      !contained(join(owner.directory, 'src'), file);
    if (
      !contained(owner.directory, target) &&
      target !== join(graph.root, 'docs/versions.json') &&
      !sharedTool
    )
      errors.push('cross-boundary relative import ' + specifier);
    return errors;
  }
  if (isAbsolute(specifier)) return ['absolute imports are not portable: ' + specifier];
  if (isBuiltin(specifier) || specifier.startsWith('\0')) return errors;
  const name = specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
  const runtime = contained(join(owner.directory, 'src'), file) && !typeOnly && !css;
  const declared = {
    ...owner.manifest.dependencies,
    ...owner.manifest.peerDependencies,
    ...(runtime ? {} : owner.manifest.devDependencies),
  };
  if (!(name in declared) && name !== owner.manifest.name)
    errors.push('undeclared ' + (runtime ? 'runtime ' : '') + 'dependency ' + name);
  const dependency = graph.workspaces.find((item) => item.manifest.name === name);
  if (dependency) {
    const key = specifier === name ? '.' : '.' + specifier.slice(name.length);
    const exports = dependency.manifest.exports ?? {};
    if (
      !(key in exports) &&
      !Object.keys(exports).some(
        (pattern) =>
          pattern.includes('*') &&
          key.startsWith(pattern.split('*')[0]) &&
          key.endsWith(pattern.split('*')[1]),
      )
    )
      errors.push('private or unknown package entry point ' + specifier);
  }
  return errors;
}
async function sources(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      ![
        'node_modules',
        'dist',
        '.turbo',
        'public',
        'coverage',
        'test-results',
        'playwright-report',
      ].includes(entry.name)
    )
      files.push(...(await sources(join(directory, entry.name))));
    else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|css)$/.test(entry.name))
      files.push(join(directory, entry.name));
  }
  return files;
}
export async function checkWorkspaces(root = repositoryRoot) {
  const graph = await workspaceGraph(root);
  const errors = graphErrors(graph);
  for (const owner of graph.workspaces)
    for (const file of await sources(owner.directory)) {
      const code = await readFile(file, 'utf8');
      const inspect = (specifier, options) => {
        for (const error of importErrors(graph, owner, file, specifier, options))
          errors.push(relative(root, file) + ': ' + error);
      };
      if (file.endsWith('.css')) {
        postcss.parse(code, { from: file }).walkAtRules(/^(import|reference)$/, (rule) => {
          const quoted = /^(['"])(.*?)\1/.exec(rule.params);
          if (quoted) inspect(quoted[2], { css: true });
        });
      } else {
        const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
        const visit = (node) => {
          if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier)
          )
            inspect(node.moduleSpecifier.text, {
              typeOnly: node.importClause?.isTypeOnly || node.isTypeOnly,
            });
          if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            ts.isStringLiteral(node.arguments[0])
          )
            inspect(node.arguments[0].text);
          ts.forEachChild(node, visit);
        };
        visit(source);
      }
    }
  if (errors.length) throw new Error(errors.join('\n'));
  return graph;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const graph = await checkWorkspaces();
  console.log(
    'Validated ' +
      graph.workspaces.length +
      ' workspaces: explicit dependencies, public boundaries and acyclic graph.',
  );
}
