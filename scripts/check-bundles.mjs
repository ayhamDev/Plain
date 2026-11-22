import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { bundleCases, unrelatedModules } from '../tooling/bundles/cases.mjs';
import { measureBundle } from '../tooling/bundles/measure.mjs';

const root = resolve('.');
const pkg = JSON.parse(await readFile(resolve('packages/ui/package.json'), 'utf8'));
const packageRoot = resolve('packages/ui');
const rootExports = await import(pathToFileURL(resolve(packageRoot, pkg.exports['.'].import)));
const chartExports = await import(
  pathToFileURL(resolve(packageRoot, pkg.exports['./charts'].import))
);
let runtimeEntries = 0;
for (const [name, target] of Object.entries(pkg.exports)) {
  for (const path of Object.values(target)) await access(resolve(packageRoot, path));
  if (!target.import) continue;
  const entry = await import(pathToFileURL(resolve(packageRoot, target.import)));
  assert(Object.keys(entry).length, `Empty public runtime entry: ${name}`);
  for (const [key, value] of Object.entries(entry)) {
    const reference = rootExports[key] ?? chartExports[key];
    if (reference !== undefined)
      assert.equal(value, reference, `${name}: ${key} has a duplicate identity`);
  }
  runtimeEntries++;
}

const report = { version: pkg.version, runtimeEntries, cases: {}, css: {} };
for (const [name, entry, names, limit, grouped = ''] of bundleCases) {
  const result = await measureBundle(root, `@plain/ui/${entry}`, names);
  assert(
    result.eagerGzip <= limit,
    `${name}: ${result.eagerGzip} exceeds ${limit} eager gzip bytes`,
  );
  for (const dependency of unrelatedModules[name] ?? [])
    assert(
      !result.eagerModules.some((id) => id.includes(dependency)),
      `${name} retained unrelated ${dependency}`,
    );
  // Root/grouped imports must shake as well as a direct component entry.
  const compatible = await measureBundle(
    root,
    grouped ? `@plain/ui/${grouped}` : '@plain/ui',
    names,
  );
  assert(
    compatible.eagerGzip <= result.eagerGzip + 1024,
    `${name}: grouped/root import retained ${compatible.eagerGzip - result.eagerGzip} extra bytes`,
  );
  report.cases[name] = { ...result, rootGzip: compatible.eagerGzip, limit };
  console.log(`${name}: ${result.eagerGzip} B eager, ${result.deferredGzip} B deferred (gzip)`);
}
for (const [name, target] of Object.entries(pkg.exports)) {
  if (!name.endsWith('.css')) continue;
  const css = await readFile(resolve(packageRoot, target.default));
  report.css[name] = { bytes: css.length, gzip: gzipSync(css).length };
}
assert(
  report.css['./core.css'].gzip < report.css['./styles.css'].gzip * 0.8,
  'The core stylesheet should omit substantial optional component CSS.',
);
await mkdir(resolve('.preview/bundles'), { recursive: true });
await writeFile(resolve('.preview/bundles/report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  `Verified ${runtimeEntries} runtime entries, ${bundleCases.length} bundle pairs and ${Object.keys(report.css).length} stylesheets.`,
);
