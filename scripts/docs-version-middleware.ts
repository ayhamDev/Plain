import registry from '../docs/versions.json' with { type: 'json' };
import type { Plugin } from 'vite';

/** Route archive HTML without allowing the current SPA to impersonate old versions. */
export function docsVersionMiddleware(): Plugin {
  const install = (server: {
    middlewares: {
      use: (
        handler: (
          request: { url?: string; headers: { accept?: string } },
          response: {
            statusCode: number;
            setHeader: (name: string, value: string) => void;
            end: (body: string) => void;
          },
          next: () => void,
        ) => void,
      ) => void;
    };
  }) => {
    server.middlewares.use((request, response, next) => {
      const pathname = (request.url ?? '').split('?')[0];
      // HTML guide routes must not resolve to similarly named source JSON modules.
      if (
        pathname.startsWith('/docs/') &&
        !/\.[a-z\d]+$/i.test(pathname) &&
        request.headers.accept?.includes('text/html')
      ) {
        request.url = '/index.html';
        return next();
      }
      const match = /^\/v\/([^/]+)(?:\/(.*))?$/.exec(pathname);
      if (!match) return next();
      const version = registry.versions.find((entry) => entry.version === match[1]);
      if (!version) {
        response.statusCode = 404;
        response.end('Documentation version not found');
        return;
      }
      if (match[2] === undefined) {
        response.statusCode = 308;
        const query = request.url?.slice(pathname.length) ?? '';
        response.setHeader('Location', `${pathname}/${query}`);
        response.end('');
        return;
      }
      if (/\.[a-z\d]+$/i.test(match[2] ?? '')) return next();
      request.url =
        version.status === 'current' ? '/index.html' : `/v/${version.version}/index.html`;
      next();
    });
  };
  return { name: 'docs-versions', configureServer: install, configurePreviewServer: install };
}
