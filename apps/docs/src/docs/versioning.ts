import * as React from 'react';
import registry from '../../../../docs/versions.json';

export interface DocsVersion {
  version: string;
  status: 'current' | 'archived';
  base: string;
  ref?: string;
  routes: string[];
}
export interface DocsVersionManifest {
  current: string;
  versions: DocsVersion[];
}
export const currentDocsVersion = registry.current;
const initialManifest: DocsVersionManifest = {
  current: registry.current,
  versions: registry.versions.map((item) => ({
    ...item,
    status: item.status as DocsVersion['status'],
    base: `/v/${item.version}/`,
    routes: [],
  })),
};
let manifestPromise: Promise<DocsVersionManifest> | undefined;
export function parseDocsVersions(value: unknown): DocsVersionManifest {
  const invalid = () => {
    throw new Error('Invalid documentation manifest.');
  };
  if (!value || typeof value !== 'object') return invalid();
  const candidate = value as Partial<DocsVersionManifest>;
  const semver = /^\d+\.\d+\.\d+$/;
  if (
    typeof candidate.current !== 'string' ||
    !semver.test(candidate.current) ||
    !Array.isArray(candidate.versions) ||
    candidate.versions.length === 0
  )
    return invalid();
  for (const version of candidate.versions) {
    if (
      !version ||
      typeof version.version !== 'string' ||
      !semver.test(version.version) ||
      !['current', 'archived'].includes(version.status) ||
      version.base !== `/v/${version.version}/` ||
      !Array.isArray(version.routes) ||
      version.routes.length === 0 ||
      !version.routes.includes('/') ||
      version.routes.some(
        (route) => typeof route !== 'string' || !/^\/(?:[\w-]+\/?)*$/.test(route),
      ) ||
      (version.status === 'archived' &&
        (typeof version.ref !== 'string' || !/^[\da-f]{40}$/i.test(version.ref)))
    )
      return invalid();
  }
  const current = candidate.versions.filter((version) => version.status === 'current');
  if (
    current.length !== 1 ||
    current[0].version !== candidate.current ||
    new Set(candidate.versions.map((version) => version.version)).size !== candidate.versions.length
  )
    return invalid();
  return candidate as DocsVersionManifest;
}
export function loadDocsVersions(): Promise<DocsVersionManifest> {
  manifestPromise ??= fetch('/docs-versions.json')
    .then(async (response) => {
      if (!response.ok) throw new Error('Documentation versions could not load.');
      return parseDocsVersions(await response.json());
    })
    .catch((error: unknown) => {
      manifestPromise = undefined;
      throw error;
    });
  return manifestPromise;
}
export function useDocsVersions() {
  const [manifest, setManifest] = React.useState(initialManifest);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    loadDocsVersions().then(
      (value) => {
        if (active) setManifest(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return {
    manifest,
    error,
    loading: manifest.versions.some((version) => version.routes.length === 0),
  };
}
export function documentationVersion(path: string): string {
  return /^\/v\/(\d+\.\d+\.\d+)(?:\/|$)/.exec(path)?.[1] ?? currentDocsVersion;
}
export function documentationPath(path: string): string {
  return path.replace(/^\/v\/\d+\.\d+\.\d+(?=\/|$)/, '') || '/';
}
export function versionDestination(
  version: DocsVersion,
  path: string,
  search = '',
  hash = '',
): string {
  const requested = documentationPath(path).replace(/\/$/, '') || '/';
  const available = version.routes.length === 0 || version.routes.includes(requested);
  const fallback =
    requested.startsWith('/components/') && version.routes.includes('/components')
      ? '/components'
      : requested.startsWith('/blocks/') && version.routes.includes('/blocks')
        ? '/blocks'
        : requested.startsWith('/templates/') && version.routes.includes('/templates')
          ? '/templates'
          : '/';
  return `${version.base.replace(/\/$/, '')}${available ? requested : fallback}${available ? search + hash : ''}`;
}
