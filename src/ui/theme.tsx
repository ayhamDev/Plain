import * as React from 'react';
import { createTheme, normalizeColor, type ColorScheme } from './color-theme';
import { tokenVariable, type ThemeToken, type ThemeTokens } from './token-contract';
import { MotionPolicyProvider, type MotionPolicy } from './motion-policy';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'neutral';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type BorderStyle = 'none' | 'subtle' | 'strong';
export interface ThemeSettings {
  mode: ThemeMode;
  color: string | null;
  accent: AccentColor;
  scheme: ColorScheme;
  contrast: number;
  radius: number;
  density: Density;
  borders: BorderStyle;
  motion: MotionPolicy;
}
export const defaultTheme: ThemeSettings = {
  mode: 'system',
  color: null,
  accent: 'neutral',
  scheme: 'tonal',
  contrast: 0,
  radius: 6,
  density: 'comfortable',
  borders: 'subtle',
  motion: 'system',
};
export const accentSeeds: Record<AccentColor, string | null> = {
  neutral: null,
  emerald: '#087f5b',
  blue: '#2563eb',
  rose: '#be185d',
  amber: '#976900',
  violet: '#6d28d9',
};
const storageKey = 'plainui-theme';

export function validateTheme(value: unknown): ThemeSettings {
  if (!value || typeof value !== 'object') return { ...defaultTheme };
  const p = value as Partial<ThemeSettings>;
  const choice = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    options.includes(value as T) ? (value as T) : fallback;
  return {
    mode: choice(p.mode, ['light', 'dark', 'system'], defaultTheme.mode),
    color: normalizeColor(p.color),
    accent: choice(
      p.accent,
      ['emerald', 'blue', 'rose', 'amber', 'violet', 'neutral'],
      defaultTheme.accent,
    ),
    scheme: choice(p.scheme, ['tonal', 'vibrant', 'expressive'], defaultTheme.scheme),
    contrast:
      typeof p.contrast === 'number' && Number.isFinite(p.contrast)
        ? Math.max(0, Math.min(1, p.contrast))
        : 0,
    radius:
      typeof p.radius === 'number' && Number.isFinite(p.radius)
        ? Math.max(0, Math.min(24, p.radius))
        : defaultTheme.radius,
    density: choice(p.density, ['compact', 'comfortable', 'spacious'], defaultTheme.density),
    borders: choice(p.borders, ['none', 'subtle', 'strong'], defaultTheme.borders),
    motion: choice(p.motion, ['system', 'reduced', 'none'], defaultTheme.motion),
  };
}

interface ThemeContextValue extends ThemeSettings {
  resolvedMode: 'light' | 'dark';
  resolvedColor: string | null;
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
  const [settings, setSettings] = React.useState(() =>
    validateTheme({ ...defaultTheme, ...defaultSettings }),
  );
  const [ready, setReady] = React.useState(false);
  const [systemDark, setSystemDark] = React.useState(false);
  const previousTokens = React.useRef(new Map<string, string>());
  const resolvedMode = settings.mode === 'system' ? (systemDark ? 'dark' : 'light') : settings.mode;
  const resolvedColor = settings.color ?? accentSeeds[settings.accent];
  const generated = React.useMemo(
    () =>
      resolvedColor
        ? createTheme({
            color: resolvedColor,
            contrast: settings.contrast,
            scheme: settings.scheme,
          })
        : null,
    [resolvedColor, settings.contrast, settings.scheme],
  );
  const resolvedTokens: ThemeTokens = React.useMemo(
    () => ({
      ...generated?.[resolvedMode],
      radius: `${settings.radius}px`,
      ...(settings.borders === 'none'
        ? {
            border: 'transparent',
            'control-border': 'transparent',
            'input-border': 'transparent',
            'border-width': '0px',
          }
        : settings.borders === 'strong'
          ? { border: 'var(--ui-outline)' }
          : {}),
      ...tokens,
    }),
    [generated, resolvedMode, settings.radius, settings.borders, tokens],
  );

  React.useEffect(() => {
    if (persist) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setSettings(validateTheme(JSON.parse(saved)));
      } catch {
        /* Preferences are optional in restricted storage contexts. */
      }
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const update = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', update);
    setReady(true);
    return () => media.removeEventListener('change', update);
  }, [persist]);

  React.useEffect(() => {
    const root = document.documentElement;
    const attributeNames = [
      'data-theme',
      'data-accent',
      'data-density',
      'data-borders',
      'data-motion',
    ];
    const attributes = attributeNames.map((name) => [name, root.getAttribute(name)] as const);
    const saved = previousTokens.current;
    return () => {
      for (const [property, value] of saved) {
        if (value) root.style.setProperty(property, value);
        else root.style.removeProperty(property);
      }
      saved.clear();
      for (const [name, value] of attributes) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = resolvedMode;
    root.dataset.accent = settings.accent;
    root.dataset.density = settings.density;
    root.dataset.borders = settings.borders;
    root.dataset.motion = settings.motion;
    const entries = Object.entries(resolvedTokens).filter(([, value]) => value !== undefined);
    const nextProperties = new Set(entries.map(([key]) => tokenVariable(key as ThemeToken)));
    for (const [property, previous] of previousTokens.current) {
      if (!nextProperties.has(property as `--ui-${string}`)) {
        if (previous) root.style.setProperty(property, previous);
        else root.style.removeProperty(property);
        previousTokens.current.delete(property);
      }
    }
    for (const [key, value] of entries) {
      const property = tokenVariable(key as ThemeToken);
      if (!previousTokens.current.has(property))
        previousTokens.current.set(property, root.style.getPropertyValue(property));
      if (root.style.getPropertyValue(property) !== value) root.style.setProperty(property, value!);
    }
    if (persist) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch {
        /* Themes still work without persistence. */
      }
    }
  }, [settings, resolvedMode, resolvedTokens, persist, ready]);

  React.useEffect(() => {
    if (!persist) return;
    const update = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        setSettings(
          event.newValue ? validateTheme(JSON.parse(event.newValue)) : { ...defaultTheme },
        );
      } catch {
        /* Ignore malformed preferences from other tabs. */
      }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [persist]);
  const setTheme = React.useCallback(
    (next: Partial<ThemeSettings>) =>
      setSettings((current) => validateTheme({ ...current, ...next })),
    [],
  );
  const resetTheme = React.useCallback(() => setSettings({ ...defaultTheme }), []);
  const value = React.useMemo(
    () => ({ ...settings, resolvedMode, resolvedColor, setTheme, resetTheme }),
    [settings, resolvedMode, resolvedColor, setTheme, resetTheme],
  );
  return (
    <ThemeContext.Provider value={value}>
      <MotionPolicyProvider policy={settings.motion}>{children}</MotionPolicyProvider>
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider.');
  return context;
}
