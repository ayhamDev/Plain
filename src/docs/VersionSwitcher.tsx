import { useLocation, useNavigate } from 'react-router-dom';
import { Combobox } from '../ui/command';

export function VersionSwitcher({
  id,
  label = 'Library version',
  onNavigate,
}: {
  id?: string;
  label?: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const selected =
    location.pathname === '/changelog' && location.hash === '#release-0-1' ? '0.1.0' : '0.2.0';
  return (
    <Combobox
      id={id}
      aria-label={label}
      value={selected}
      className="version-switcher"
      options={[
        { value: '0.2.0', label: '0.2.0', description: 'Current release' },
        { value: '0.1.0', label: '0.1.0', description: 'Release archive' },
      ]}
      searchPlaceholder="Find a version..."
      onValueChange={(version) => {
        navigate(version === '0.1.0' ? '/changelog#release-0-1' : '/');
        onNavigate?.();
      }}
    />
  );
}
