import {
  Hct,
  SchemeTonalSpot,
  SchemeVibrant,
  SchemeExpressive,
  argbFromHex,
  hexFromArgb,
  type DynamicScheme,
} from '@material/material-color-utilities';
import {
  lightTokens,
  darkTokens,
  paletteTones,
  type ThemeTokens,
  type PaletteFamily,
  themeCSS,
} from './token-contract';
import { neutralPaletteTokens } from './neutral-palette';

export type ColorScheme = 'tonal' | 'vibrant' | 'expressive';
export interface CreateThemeOptions {
  color?: string | null;
  contrast?: number;
  scheme?: ColorScheme;
  tokens?: ThemeTokens;
  light?: ThemeTokens;
  dark?: ThemeTokens;
}
export interface CreatedTheme {
  color: string | null;
  light: ThemeTokens;
  dark: ThemeTokens;
  css: string;
}
export function normalizeColor(color: unknown): string | null {
  if (typeof color !== 'string') return null;
  const value = color.trim();
  if (/^#[\da-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[\da-f]{3}$/i.test(value))
    return `#${value
      .slice(1)
      .split('')
      .map((letter) => letter.repeat(2))
      .join('')}`.toLowerCase();
  return null;
}
const cache = new Map<string, { light: ThemeTokens; dark: ThemeTokens }>();
function roles(scheme: DynamicScheme): ThemeTokens {
  const hex = (value: number) => hexFromArgb(value);
  // Material's lowest surface is not an elevated panel. Keep the seed's atmosphere
  // in low-chroma surfaces, with a restrained hierarchy instead of black cutouts.
  const surface = (tone: number) =>
    hex(
      Hct.from(scheme.neutralPalette.hue, Math.min(4, scheme.neutralPalette.chroma), tone).toInt(),
    );
  const dark = scheme.isDark;
  const controlOutline = hex(
    Hct.from(
      scheme.neutralPalette.hue,
      Math.min(4, scheme.neutralPalette.chroma),
      (dark ? 48 : 54) +
        (Hct.fromInt(scheme.outline).tone - (dark ? 48 : 54)) * scheme.contrastLevel,
    ).toInt(),
  );
  const tokens: ThemeTokens = {
    background: surface(dark ? 8 : 98),
    foreground: hex(scheme.onSurface),
    surface: surface(dark ? 11 : 100),
    'surface-lowest': surface(dark ? 8 : 100),
    'surface-low': surface(dark ? 11 : 97),
    'surface-container': surface(dark ? 14 : 95),
    'surface-high': surface(dark ? 17 : 93),
    'surface-highest': surface(dark ? 20 : 91),
    'surface-foreground': hex(scheme.onSurface),
    muted: surface(dark ? 15 : 95),
    'muted-foreground': hex(scheme.onSurfaceVariant),
    outline: hex(scheme.outline),
    border: surface(dark ? 23 : 89),
    'control-border': controlOutline,
    'input-border': controlOutline,
    primary: hex(scheme.primary),
    'primary-foreground': hex(scheme.onPrimary),
    'primary-container': hex(scheme.primaryContainer),
    'primary-container-foreground': hex(scheme.onPrimaryContainer),
    secondary: hex(scheme.secondary),
    'secondary-foreground': hex(scheme.onSecondary),
    'secondary-container': hex(scheme.secondaryContainer),
    'secondary-container-foreground': hex(scheme.onSecondaryContainer),
    tertiary: hex(scheme.tertiary),
    'tertiary-foreground': hex(scheme.onTertiary),
    'tertiary-container': hex(scheme.tertiaryContainer),
    'tertiary-container-foreground': hex(scheme.onTertiaryContainer),
    accent: hex(scheme.primary),
    'accent-foreground': hex(scheme.onPrimary),
    'accent-soft': hex(scheme.primaryContainer),
    'accent-soft-foreground': hex(scheme.onPrimaryContainer),
    danger: hex(scheme.error),
    'danger-foreground': hex(scheme.onError),
    'danger-soft': hex(scheme.errorContainer),
    'danger-soft-foreground': hex(scheme.onErrorContainer),
    inverse: hex(scheme.inverseSurface),
    'inverse-foreground': hex(scheme.inverseOnSurface),
    'inverse-muted': hex(
      scheme.isDark ? scheme.neutralPalette.tone(35) : scheme.neutralPalette.tone(80),
    ),
    'inverse-accent': hex(scheme.inversePrimary),
    'focus-ring': hex(scheme.primary),
  };
  // Categorical colors share perceptual tone/chroma; error colors are not data roles.
  const offsets = [0, 55, 150, 235, 95, 195, 285, 320];
  offsets.forEach((offset, index) => {
    tokens[`chart-${index + 1}` as keyof ThemeTokens] = hex(
      Hct.from((scheme.primaryPalette.hue + offset) % 360, dark ? 36 : 32, dark ? 70 : 45).toInt(),
    );
  });
  const palettes = {
    primary: scheme.primaryPalette,
    secondary: scheme.secondaryPalette,
    tertiary: scheme.tertiaryPalette,
    neutral: scheme.neutralPalette,
    'neutral-variant': scheme.neutralVariantPalette,
    error: scheme.errorPalette,
  };
  for (const [family, palette] of Object.entries(palettes))
    for (const tone of paletteTones)
      tokens[`palette.${family as PaletteFamily}.${tone}`] = hex(palette.tone(tone));
  return tokens;
}

/** Generate light/dark roles once, then override only the roots or component aliases you own. */
export function createTheme({
  color = null,
  contrast = 0,
  scheme = 'tonal',
  tokens,
  light,
  dark,
}: CreateThemeOptions = {}): CreatedTheme {
  const seed = normalizeColor(color);
  if (color !== null && !seed)
    throw new TypeError('Theme color must be a #RGB or #RRGGBB hex color.');
  const level = Number.isFinite(contrast) ? Math.max(0, Math.min(1, contrast)) : 0;
  const key = `${seed}:${level}:${scheme}`;
  let generated = cache.get(key);
  if (!generated) {
    if (seed) {
      const source = Hct.fromInt(argbFromHex(seed));
      const Constructor =
        scheme === 'vibrant'
          ? SchemeVibrant
          : scheme === 'expressive'
            ? SchemeExpressive
            : SchemeTonalSpot;
      generated = {
        light: roles(new Constructor(source, false, level)),
        dark: roles(new Constructor(source, true, level)),
      };
    } else
      generated = {
        light: { ...lightTokens, ...neutralPaletteTokens },
        dark: { ...lightTokens, ...darkTokens, ...neutralPaletteTokens },
      };
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    cache.set(key, generated);
  }
  const lightTheme = { ...generated.light, ...tokens, ...light };
  const darkTheme = { ...generated.dark, ...tokens, ...dark };
  return {
    color: seed,
    light: lightTheme,
    dark: darkTheme,
    css: `${themeCSS(lightTheme)}\n${themeCSS(darkTheme, "[data-theme='dark']")}`,
  };
}
