import { Contrast, Hct, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { createTheme, normalizeColor, type ColorScheme } from './color-theme';
import { tokenVariable, type ThemeTokens } from './token-contract';

export interface ColorPaletteOptions {
  /** Same optional hex seed and scheme as createTheme; null preserves neutral theme colors. */
  color?: string | null;
  scheme?: ColorScheme;
  mode?: 'light' | 'dark';
  /** Resolved theme roles or hex/var() overrides. */
  tokens?: ThemeTokens;
  /** Opaque hex background; defaults to the theme's surface. */
  background?: string;
  /** Minimum color/background contrast ratio, 1..21. Defaults to 3 for chart marks. */
  minContrast?: number;
}

export interface ColorPalette extends Iterable<string> {
  /** Deterministic hex color at a nonnegative safe integer index. Does not allocate earlier colors. */
  get(index: number): string;
  /** Allocate only the requested batch, optionally starting at an index. */
  take(count: number, start?: number): string[];
  /** Stable association independent of the order in which keys are requested. */
  forKey(key: string | number): string;
}

function integer(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`${name} must be a nonnegative safe integer.`);
}

function resolveHex(
  value: string | undefined,
  variables: Map<string, string>,
  seen = new Set<string>(),
): string | null {
  const hex = normalizeColor(value);
  if (hex) return hex;
  const reference = value?.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/);
  if (!reference) return null;
  const [, variable, fallback] = reference;
  if (!seen.has(variable)) {
    const next = new Set(seen).add(variable);
    const resolved = resolveHex(variables.get(variable), variables, next);
    if (resolved) return resolved;
  }
  return fallback ? resolveHex(fallback, variables, new Set(seen).add(variable)) : null;
}

/**
 * Lazy, deterministic colors derived from the theme's eight categorical roles.
 * Hex output works in SVG, canvas, CSS and server-rendered content. Extended
 * colors vary perceptual hue/chroma/tone gently around those roles, never modulo-wrap.
 */
export function createColorPalette({
  color = null,
  scheme = 'tonal',
  mode = 'light',
  tokens,
  background,
  minContrast = 3,
}: ColorPaletteOptions = {}): ColorPalette {
  if (mode !== 'light' && mode !== 'dark')
    throw new TypeError('Palette mode must be light or dark.');
  if (!['tonal', 'vibrant', 'expressive'].includes(scheme))
    throw new TypeError('Unknown palette scheme.');
  if (!Number.isFinite(minContrast) || minContrast < 1 || minContrast > 21)
    throw new RangeError('minContrast must be between 1 and 21.');
  const roles = { ...createTheme({ color, scheme })[mode], ...tokens };
  const variables = new Map(
    Object.entries(roles)
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([key, value]) => [tokenVariable(key as keyof ThemeTokens), value]),
  );
  const role = (key: keyof ThemeTokens) => {
    const value = resolveHex(roles[key], variables);
    if (!value)
      throw new TypeError(
        `Palette token "${key}" must resolve to a hex color. Supply resolved tokens for CSS expressions.`,
      );
    return value;
  };
  const backdrop = background === undefined ? role('surface') : normalizeColor(background);
  if (!backdrop) throw new TypeError('Palette background must be a #RGB or #RRGGBB hex color.');
  const backgroundTone = Hct.fromInt(argbFromHex(backdrop)).tone;
  const endpoints = [0, 100].filter(
    (tone) => Contrast.ratioOfTones(tone, backgroundTone) + 1e-6 >= minContrast,
  );
  if (!endpoints.length)
    throw new RangeError('The requested contrast is not attainable against this background.');
  const fit = (candidate: Hct) => {
    if (Contrast.ratioOfTones(candidate.tone, backgroundTone) + 1e-6 >= minContrast)
      return hexFromArgb(candidate.toInt());
    const targets = [
      Contrast.darker(backgroundTone, minContrast),
      Contrast.lighter(backgroundTone, minContrast),
    ]
      .filter((tone) => tone >= 0)
      .sort((a, b) => Math.abs(a - candidate.tone) - Math.abs(b - candidate.tone));
    for (const target of targets) {
      const direction = target < backgroundTone ? -1 : 1;
      for (let step = 0; step < 16; step++) {
        const tone = Math.max(0, Math.min(100, target + direction * step * 0.25));
        const adjusted = Hct.from(candidate.hue, candidate.chroma, tone);
        if (Contrast.ratioOfTones(adjusted.tone, backgroundTone) + 1e-6 >= minContrast)
          return hexFromArgb(adjusted.toInt());
      }
    }
    const endpoint = endpoints.reduce((closest, tone) =>
      Math.abs(tone - candidate.tone) < Math.abs(closest - candidate.tone) ? tone : closest,
    );
    return hexFromArgb(Hct.from(candidate.hue, candidate.chroma, endpoint).toInt());
  };
  const anchors = Array.from({ length: 8 }, (_, index) =>
    fit(Hct.fromInt(argbFromHex(role(`chart-${index + 1}` as keyof ThemeTokens)))),
  );
  const profiles = anchors.map((value) => Hct.fromInt(argbFromHex(value)));
  const cache = new Map<number, string>();
  const fraction = (value: number) => value - Math.floor(value);
  const get = (index: number) => {
    integer(index, 'Palette index');
    if (index < anchors.length) return anchors[index];
    const cached = cache.get(index);
    if (cached) return cached;
    const base = profiles[index % profiles.length];
    const generation = Math.floor(index / profiles.length);
    const hue = (base.hue + (fraction(generation * 0.618033988749895) - 0.5) * 38 + 360) % 360;
    const chroma = base.chroma * (0.82 + fraction(generation * 0.5698402909980532) * 0.36);
    const tone = Math.max(
      0,
      Math.min(100, base.tone + (fraction(generation * 0.7548776662466927) - 0.5) * 18),
    );
    const result = fit(Hct.from(hue, chroma, tone));
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(index, result);
    return result;
  };
  return Object.freeze({
    get,
    take(count: number, start = 0) {
      integer(count, 'Palette count');
      integer(start, 'Palette start');
      if (count > 0 && !Number.isSafeInteger(start + count - 1))
        throw new RangeError('Palette batch exceeds the safe integer index range.');
      return Array.from({ length: count }, (_, index) => get(start + index));
    },
    forKey(key: string | number) {
      if (typeof key !== 'string' && (typeof key !== 'number' || !Number.isFinite(key)))
        throw new TypeError('Palette keys must be strings or finite numbers.');
      const value = `${typeof key}:${key}`;
      let hash = 2166136261;
      for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
      return get(hash >>> 0);
    },
    *[Symbol.iterator]() {
      for (let index = 0; index <= Number.MAX_SAFE_INTEGER; index++) yield get(index);
    },
  });
}

/** Request a finite batch without managing a palette instance. */
export function generateColors(count: number, options?: ColorPaletteOptions): string[] {
  return createColorPalette(options).take(count);
}
