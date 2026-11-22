import { build } from 'vite';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

/** A production ESM consumer, with React supplied by the application. */
export async function measureBundle(root, source, names) {
  const entry = resolve(root, '.preview/__plain_bundle_probe__.js');
  const virtual = '\0plain-bundle-probe';
  const result = await build({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [
      {
        name: 'plain-bundle-probe',
        resolveId: (id) =>
          id === entry || id === entry.replaceAll('\\', '/') ? virtual : undefined,
        load: (id) =>
          id === virtual
            ? `export { ${names.join(', ')} } from ${JSON.stringify(source)};`
            : undefined,
      },
    ],
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ['es'] },
      rolldownOptions: { external: (id) => /^(react|react-dom)(\/|$)/.test(id) },
    },
  });
  const chunks = (Array.isArray(result) ? result : [result])
    .flatMap((item) => item.output)
    .filter((item) => item.type === 'chunk');
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const eager = new Set();
  const visit = (chunk) => {
    if (eager.has(chunk.fileName)) return;
    eager.add(chunk.fileName);
    for (const dependency of chunk.imports) {
      const imported = byName.get(dependency.replace(/^\.\//, ''));
      if (imported) visit(imported);
    }
  };
  chunks.filter((chunk) => chunk.isEntry).forEach(visit);
  const liveModules = (group) => [
    ...new Set(
      group.flatMap((chunk) =>
        Object.entries(chunk.modules)
          .filter(([, value]) => value.renderedLength > 0)
          .map(([id]) => id.replaceAll('\\', '/')),
      ),
    ),
  ];
  const eagerChunks = chunks.filter((chunk) => eager.has(chunk.fileName));
  const deferredChunks = chunks.filter((chunk) => !eager.has(chunk.fileName));
  const compressed = (group) =>
    group.length ? gzipSync(group.map((chunk) => chunk.code).join('\n')).length : 0;
  return {
    eagerGzip: compressed(eagerChunks),
    deferredGzip: compressed(deferredChunks),
    totalGzip: compressed(chunks),
    transferGzip: chunks.reduce((sum, chunk) => sum + gzipSync(chunk.code).length, 0),
    chunks: chunks.length,
    modules: liveModules(chunks),
    eagerModules: liveModules(eagerChunks),
  };
}
