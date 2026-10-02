import { useLocation } from 'react-router-dom';
import { Combobox } from '../ui/command';
import { documentationVersion, useDocsVersions, versionDestination } from './versioning';

export function VersionSwitcher({
  id,
  label = 'Library version',
  onNavigate,
}: {
  id?: string;
  label?: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { manifest, error, loading } = useDocsVersions();
  const selected = documentationVersion(window.location.pathname);
  return (
    <Combobox
      id={id}
      aria-label={label}
      value={selected}
      disabled={loading}
      className="version-switcher"
      options={manifest.versions.map((item) => ({
        value: item.version,
        label: item.version,
        description: item.status === 'current' ? 'Current documentation' : 'Archived documentation',
      }))}
      title={error ? 'Version registry unavailable; refresh to retry' : undefined}
      searchPlaceholder="Find a version..."
      onValueChange={(version) => {
        const target = manifest.versions.find((item) => item.version === version);
        if (!target) return;
        window.location.assign(
          versionDestination(target, location.pathname, location.search, location.hash),
        );
        onNavigate?.();
      }}
    />
  );
}
