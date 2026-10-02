import assert from 'node:assert/strict';
import { access, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import ts from 'typescript';
import postcss from 'postcss';
import { format, resolveConfig } from 'prettier';
import { build } from 'vite';
import { familyExports, sourceComponentName } from '../src/docs/compositions/source.ts';

const root = resolve('src/docs/compositions').replaceAll('\\', '/');
const uiRoot = resolve('src/ui').replaceAll('\\', '/');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.tsx?$/.test(path)) files.push(path);
  }
  return files.sort();
}
const exampleFiles = await sourceFiles(root);
const inputs = [
  ...exampleFiles,
  ...(await sourceFiles(uiRoot)),
  `${root}/styles.css`,
  'scripts/generate-compositions.mjs',
  'package.json',
  '.prettierrc.json',
];
const hash = createHash('sha256');
for (const file of inputs) hash.update(relative(resolve(), file)).update(await readFile(file));
const fingerprint = hash.digest('hex');
try {
  const previous = JSON.parse(await readFile('public/compositions/manifest.json', 'utf8'));
  if (
    previous.fingerprint === fingerprint &&
    previous.blocks.length === 120 &&
    previous.templates.length === 60
  ) {
    for (const item of [...previous.blocks, ...previous.templates]) {
      assert(/^(blocks|templates)\/[a-z0-9-]+\.tsx$/.test(item.path));
      await access(`public/compositions/${item.path}`);
    }
    console.log('All 180 independent composition sources are current.');
    process.exit(0);
  }
} catch {
  // A missing or stale generated catalogue is rebuilt below.
}
const formatting = await resolveConfig('package.json');
const metadataEntry = '\0composition-seeds';
const virtualEntry = resolve('scripts/__composition-seeds.js').replaceAll('\\', '/');
const metadata = await build({
  configFile: false,
  logLevel: 'silent',
  plugins: [
    {
      name: 'composition-seeds',
      enforce: 'pre',
      resolveId: (id) => (id.replaceAll('\\', '/') === virtualEntry ? metadataEntry : undefined),
      load: (id) =>
        id === metadataEntry
          ? [
              `export { blockSeeds as blocks } from ${JSON.stringify(`${root}/catalog/blocks.ts`)};`,
              `export { operationalTemplates } from ${JSON.stringify(`${root}/catalog/templates-operational.ts`)};`,
              `export { personalTemplates } from ${JSON.stringify(`${root}/catalog/templates-personal.ts`)};`,
              `export { websiteTemplates } from ${JSON.stringify(`${root}/catalog/templates-websites.ts`)};`,
            ].join('\n')
          : undefined,
    },
  ],
  build: { write: false, minify: false, lib: { entry: virtualEntry, formats: ['es'] } },
});
const metadataOutput = Array.isArray(metadata) ? metadata[0] : metadata;
const metadataCode = metadataOutput.output.find((item) => item.type === 'chunk').code;
const seeds = await import(
  `data:text/javascript;base64,${Buffer.from(metadataCode).toString('base64')}`
);
const blocks = seeds.blocks;
const templates = [
  ...seeds.operationalTemplates,
  ...seeds.personalTemplates,
  ...seeds.websiteTemplates,
];
assert.equal(blocks.length, 120);
assert.equal(templates.length, 60);
const blockById = new Map(blocks.map((item) => [item.id, item]));

const program = ts.createProgram(exampleFiles, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  esModuleInterop: true,
});
const checker = program.getTypeChecker();
const declarations = new Map();
for (const file of program.getSourceFiles()) {
  if (!file.fileName.replaceAll('\\', '/').startsWith(`${root}/`)) continue;
  for (const statement of file.statements) {
    const names = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.map((item) => item.name)
      : 'name' in statement
        ? [statement.name]
        : [];
    for (const name of names) {
      if (!name || !ts.isIdentifier(name)) continue;
      const symbol = checker.getSymbolAtLocation(name);
      if (symbol) declarations.set(symbol, statement);
    }
  }
}
function exportedSymbol(fileName, name) {
  const file = program.getSourceFile(`${root}/${fileName}`);
  assert(file, `Missing example module ${fileName}`);
  const symbol = checker
    .getExportsOfModule(checker.getSymbolAtLocation(file))
    .find((symbol) => symbol.name === name);
  assert(symbol, `Missing ${name} in ${fileName}`);
  return symbol;
}
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const stylesheet = postcss.parse(await readFile(`${root}/styles.css`, 'utf8'));
const templateBlock = exportedSymbol('registry.tsx', 'Block');

async function copySource(item, kind) {
  const statementOrder = [];
  const selected = new Set();
  const renamed = new Map([[templateBlock, 'ExampleBlock']]);
  const usedNames = new Set([
    'React',
    'config',
    'exampleStyles',
    'exampleBlocks',
    'ExampleBlock',
    sourceComponentName(item.id),
  ]);
  const imports = new Map();
  const externalNames = new Map();
  const activeFamilies = new Set();
  let templateConfigs;

  function unique(name, file) {
    let candidate = name;
    const prefix =
      file
        ?.split('/')
        .at(-1)
        ?.replace(/\.[^.]+$/, '') ?? 'Example';
    if (usedNames.has(candidate)) candidate = `${prefix}${name[0].toUpperCase()}${name.slice(1)}`;
    for (let index = 2; usedNames.has(candidate); index++) candidate = `${prefix}${name}${index}`;
    usedNames.add(candidate);
    return candidate;
  }
  function alias(symbol) {
    return symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  }
  function assign(symbol) {
    if (!renamed.has(symbol))
      renamed.set(symbol, unique(symbol.name, declarations.get(symbol)?.getSourceFile().fileName));
    return renamed.get(symbol);
  }
  function publicSpecifier(file, specifier) {
    if (!specifier.startsWith('.')) return specifier;
    const path = resolve(dirname(file.fileName), specifier).replaceAll('\\', '/');
    if (path.startsWith(`${uiRoot}/`)) {
      const name = relative(uiRoot, path)
        .replaceAll('\\', '/')
        .replace(/\.tsx?$/, '');
      return pkg.exports[`./${name}`] ? `@plain/ui/${name}` : '@plain/ui';
    }
    throw new Error(`Copy source cannot retain a documentation import: ${specifier}`);
  }
  function collectImport(symbol) {
    const declaration = symbol?.declarations?.[0];
    if (!declaration || !(ts.isImportSpecifier(declaration) || ts.isNamespaceImport(declaration)))
      return false;
    const importDeclaration = ts.isImportSpecifier(declaration)
      ? declaration.parent.parent.parent
      : declaration.parent.parent;
    const specifier = importDeclaration.moduleSpecifier.text;
    const target = alias(symbol);
    if (target === templateBlock) {
      renamed.set(symbol, 'ExampleBlock');
      return true;
    }
    if (declarations.has(target)) {
      collect(target);
      renamed.set(symbol, assign(target));
      return true;
    }
    const module = publicSpecifier(declaration.getSourceFile(), specifier);
    if (ts.isNamespaceImport(declaration)) {
      assert.equal(module, 'react', 'Only React namespace imports are supported in copy sources.');
      renamed.set(symbol, 'React');
      return true;
    }
    const original = declaration.propertyName?.text ?? declaration.name.text;
    const key = `${module}:${original}`;
    if (!externalNames.has(key)) externalNames.set(key, unique(declaration.name.text));
    const local = externalNames.get(key);
    renamed.set(symbol, local);
    const records = imports.get(module) ?? new Map();
    const typeOnly = declaration.isTypeOnly || declaration.parent.parent.isTypeOnly;
    const current = records.get(original);
    records.set(original, { local, typeOnly: current ? current.typeOnly && typeOnly : typeOnly });
    imports.set(module, records);
    return true;
  }
  function symbolAt(node) {
    return ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
  }
  function collect(symbol) {
    symbol = alias(symbol);
    if (symbol === templateBlock) return;
    const statement = declarations.get(symbol);
    if (!statement || selected.has(statement)) return;
    selected.add(statement);
    for (const [local, owner] of declarations) if (owner === statement) assign(local);
    function visit(node) {
      if (ts.isIdentifier(node)) {
        const referenced = symbolAt(node);
        if (referenced && !collectImport(referenced)) collect(referenced);
      }
      ts.forEachChild(node, visit);
    }
    visit(statement);
    statementOrder.push(statement);
  }
  function family(familyName) {
    const [component, type] = familyExports[familyName];
    activeFamilies.add(familyName);
    collect(exportedSymbol(`families/${component}.tsx`, component));
    collect(exportedSymbol('types.ts', type));
  }
  if (kind === 'blocks') family(item.config.family);
  else {
    templateConfigs = Object.fromEntries(
      item.config.routes.flatMap((route) =>
        route.blockIds.map((id) => [id, blockById.get(id).config]),
      ),
    );
    for (const config of Object.values(templateConfigs)) family(config.family);
    for (const route of item.config.routes)
      for (const config of Object.values(route.blockOverrides ?? {})) family(config.family);
    family('settings');
    collect(exportedSymbol('types.ts', 'BlockConfig'));
    collect(exportedSymbol('types.ts', 'TemplateConfig'));
    collect(exportedSymbol('TemplateRenderer.tsx', 'TemplateRenderer'));
  }

  const transform = (context) => {
    const visit = (node) => {
      if (ts.isShorthandPropertyAssignment(node)) {
        const symbol = checker.getShorthandAssignmentValueSymbol(node);
        const name = renamed.get(symbol) ?? renamed.get(alias(symbol));
        if (name && name !== node.name.text)
          return ts.factory.createPropertyAssignment(
            node.name.text,
            ts.factory.createIdentifier(name),
          );
      }
      if (ts.isIdentifier(node)) {
        const symbol = symbolAt(node);
        const name = renamed.get(symbol) ?? renamed.get(alias(symbol));
        if (name) return ts.factory.createIdentifier(name);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments[0];
        if (ts.isStringLiteral(argument))
          return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
            ts.factory.createStringLiteral(publicSpecifier(node.getSourceFile(), argument.text)),
          ]);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (node) => ts.visitNode(node, visit);
  };
  const parts = statementOrder.map((statement) => {
    const result = ts.transform(statement, [transform]);
    const code = printer.printNode(
      ts.EmitHint.Unspecified,
      result.transformed[0],
      statement.getSourceFile(),
    );
    result.dispose();
    return code;
  });
  const importLines = ["import * as React from 'react';", "import '@plain/ui/styles.css';"];
  for (const [module, records] of imports)
    importLines.push(
      `import { ${[...records].map(([original, { local, typeOnly }]) => `${typeOnly ? 'type ' : ''}${original}${original === local ? '' : ` as ${local}`}`).join(', ')} } from '${module}';`,
    );
  const blockType = renamed.get(exportedSymbol('types.ts', 'BlockConfig'));
  if (kind === 'templates') {
    parts.push(
      `const exampleBlocks = ${JSON.stringify(templateConfigs, null, 2)} satisfies Record<string, ${blockType}>;`,
    );
    parts.push(
      `function ExampleBlock({ id, config }: { id: string; config?: ${blockType} }) {\n  const current = config ?? exampleBlocks[id as keyof typeof exampleBlocks];\n  if (!current) return null;\n  switch (current.family) {\n${[...activeFamilies].map((name) => `    case '${name}': return <${renamed.get(exportedSymbol(`families/${familyExports[name][0]}.tsx`, familyExports[name][0]))} config={current} />;`).join('\n')}\n    default: return null;\n  }\n}`,
    );
  }
  const componentSymbol =
    kind === 'blocks'
      ? exportedSymbol(
          `families/${familyExports[item.config.family][0]}.tsx`,
          familyExports[item.config.family][0],
        )
      : exportedSymbol('TemplateRenderer.tsx', 'TemplateRenderer');
  const configSymbol = exportedSymbol(
    'types.ts',
    kind === 'blocks' ? familyExports[item.config.family][1] : 'TemplateConfig',
  );
  const rendered = `${importLines.join('\n')}\n\n${parts.join('\n\n')}`;
  const classes = new Set(
    [...rendered.matchAll(/\b(?:pb|pt)-[a-zA-Z0-9-]+/g)].map((match) => match[0]),
  );
  const css = stylesheet.clone();
  css.walkRules((rule) => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    const selectors = postcss.list
      .comma(rule.selector)
      .filter((selector) =>
        [...selector.matchAll(/\.([a-zA-Z][\w-]*)/g)].every((match) => classes.has(match[1])),
      );
    if (selectors.length) rule.selector = selectors.join(',\n');
    else rule.remove();
  });
  css.walkAtRules((rule) => {
    if (rule.nodes?.length === 0) rule.remove();
  });
  const styles = await format(css.toString(), { ...formatting, parser: 'css' });
  const source = `'use client';\n\n${rendered}\n\nexport const config: ${renamed.get(configSymbol)} = ${JSON.stringify(item.config, null, 2)};\n\nconst exampleStyles = \`${styles.replaceAll('`', '\\`').replaceAll('${', '\\${')}\`;\n\nexport default function ${sourceComponentName(item.id)}() {\n  return (\n    <>\n      <style>{exampleStyles}</style>\n      <${renamed.get(componentSymbol)} config={config} />\n    </>\n  );\n}\n`;
  return format(source, { ...formatting, parser: 'typescript' });
}

const manifest = { version: pkg.version, fingerprint, blocks: [], templates: [] };
for (const [kind, items] of [
  ['blocks', blocks],
  ['templates', templates],
]) {
  await mkdir(`public/compositions/${kind}`, { recursive: true });
  for (const item of items) {
    assert(/^[a-z0-9-]+$/.test(item.id));
    const path = `${kind}/${item.id}.tsx`;
    const code = await copySource(item, kind);
    assert(
      !code.includes('@plain/ui/blocks'),
      'Examples cannot depend on a package block renderer.',
    );
    await writeFile(`public/compositions/${path}`, code);
    manifest[kind].push({ id: item.id, name: item.name, category: item.category, path });
  }
}
await writeFile('public/compositions/manifest.json', JSON.stringify(manifest, null, 2));
console.log('Generated 120 independent block sources and 60 independent template sources.');
