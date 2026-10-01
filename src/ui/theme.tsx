import * as React from 'react';
import type { ThemeTokens } from './styling';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'neutral';
export type Density = 'compact' | 'comfortable' | 'spacious';
export interface ThemeSettings {
  mode: ThemeMode;
  accent: AccentColor;
  radius: number;
  density: Density;
}
export const defaultTheme: ThemeSettings = {
  mode: 'system',
  accent: 'neutral',
  radius: 6,
  density: 'comfortable',
};
const storageKey = 'plainui-theme';

export function validateTheme(value: unknown): ThemeSettings {
  if (!value || typeof value !== 'object') return defaultTheme;
  const p = value as Partial<ThemeSettings>;
  return {
    mode: ['light', 'dark', 'system'].includes(p.mode ?? '') ? p.mode! : defaultTheme.mode,
    accent: ['emerald', 'blue', 'rose', 'amber', 'violet', 'neutral'].includes(p.accent ?? '')
      ? p.accent!
      : defaultTheme.accent,
    radius:
      typeof p.radius === 'number' && Number.isFinite(p.radius)
        ? Math.max(0, Math.min(24, p.radius))
        : defaultTheme.radius,
    density: ['compact', 'comfortable', 'spacious'].includes(p.density ?? '')
      ? p.density!
      : defaultTheme.density,
  };
}

interface ThemeContextValue extends ThemeSettings {
  resolvedMode: 'light' | 'dark';
  setTheme: (settings: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
}
const ThemeContext = /* @__PURE__ */ React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  defaultSettings = defaultTheme,
  persist = true,
  tokens,
}: {
  children: React.ReactNode;
  defaultSettings?: Partial<ThemeSettings>;
  persist?: boolean;
  tokens?: ThemeTokens;
}) {
  const [settings, setSettings] = React.useState<ThemeSettings>(() =>
    validateTheme({ ...defaultTheme, ...defaultSettings }),
  );
  const [ready, setReady] = React.useState(false);
  const [systemDark, setSystemDark] = React.useState(false);
  const previousTokens = React.useRef(new Map<string, string>());
  const resolvedMode = settings.mode === 'system' ? (systemDark ? 'dark' : 'light') : settings.mode;

  React.useEffect(() => {
    if (persist) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setSettings(validateTheme(JSON.parse(saved)));
      } catch {
        /* Storage may be unavailable in private or embedded contexts. */
      }
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', onChange);
    setReady(true);
    return () => media.removeEventListener('change', onChange);
  }, [persist]);

  React.useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = resolvedMode;
    root.dataset.accent = settings.accent;
    root.dataset.density = settings.density;
    root.style.setProperty('--ui-radius', `${settings.radius}px`);
    for (const [property, previous] of previousTokens.current) {
      const key = property.slice('--ui-'.length) as keyof ThemeTokens;
      if (tokens?.[key] === undefined) {
        if (key === 'radius') root.style.setProperty(property, `${settings.radius}px`);
        else if (previous) root.style.setProperty(property, previous);
        else root.style.removeProperty(property);
        previousTokens.current.delete(property);
      }
    }
    for (const [key, value] of Object.entries(tokens ?? {})) {
      if (value === undefined) continue;
      const property = `--ui-${key}`;
      if (!previousTokens.current.has(property))
        previousTokens.current.set(property, root.style.getPropertyValue(property));
      root.style.setProperty(property, value);
    }
    if (persist) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch {
        /* Nonpersistent themes still work. */
      }
    }
  }, [settings, resolvedMode, persist, ready, tokens]);

  React.useEffect(() => {
    const saved = previousTokens.current;
    return () => {
      for (const [property, value] of saved) {
        if (value) document.documentElement.style.setProperty(property, value);
        else document.documentElement.style.removeProperty(property);
      }
      saved.clear();
    };
  }, []);

  React.useEffect(() => {
    if (!persist) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        try {
          setSettings(e.newValue ? validateTheme(JSON.parse(e.newValue)) : defaultTheme);
        } catch {
          /* Ignore malformed preferences. */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [persist]);

  const setTheme = React.useCallback(
    (next: Partial<ThemeSettings>) =>
      setSettings((current) => validateTheme({ ...current, ...next })),
    [],
  );
  const resetTheme = React.useCallback(() => setSettings(defaultTheme), []);
  const value = React.useMemo(
    () => ({ ...settings, resolvedMode, setTheme, resetTheme }),
    [settings, resolvedMode, setTheme, resetTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider.');
  return context;
}
