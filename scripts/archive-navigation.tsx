import { Combobox } from '@archive/ui';
import {
  documentationVersion,
  useDocsVersions,
  versionDestination,
} from '../apps/docs/src/docs/versioning';

export function ArchiveNavigation() {
  const { manifest, loading, error } = useDocsVersions();
  const selected = documentationVersion(window.location.pathname);
  return (
    <>
      <style>{`
      .header-brand-area { display: flex; align-items: center; gap: 8px; flex-basis: auto; }
      .docs-archive-version { width: 96px; flex-shrink: 0; }
      .docs-archive-version > button { height: 32px; padding-inline: 8px; font-size: 12px; }
      @media (max-width: 720px) {
        .header-brand-area .brand > span:not(.brand-mark) { display: none; }
        .docs-archive-version { width: 80px; }
      }
    `}</style>
      <div className="docs-archive-version">
        <Combobox
          aria-label="Documentation version"
          value={selected}
          disabled={loading}
          title={error ? 'Version registry unavailable; refresh to retry' : undefined}
          options={manifest.versions.map((item) => ({
            value: item.version,
            label: item.version,
            description:
              item.status === 'current' ? 'Current documentation' : 'Archived documentation',
          }))}
          onValueChange={(value: string) => {
            const target = manifest.versions.find((item) => item.version === value);
            if (target)
              window.location.assign(
                versionDestination(
                  target,
                  window.location.pathname,
                  window.location.search,
                  window.location.hash,
                ),
              );
          }}
        />
      </div>
    </>
  );
}
