import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Contrast, Hct, argbFromHex } from '@material/material-color-utilities';
import {
  createColorPalette,
  generateColors,
  type ColorPaletteOptions,
} from '../src/ui/color-palette';
import { createTheme } from '../src/ui/color-theme';
import { PlainProvider, ThemeScope, useColorPalette } from '../src/ui/styling';
import { ThemeProvider, useTheme } from '../src/ui/theme';

describe('theme color palettes', () => {
  it('preserves neutral roles and generates deterministic extensions without wrapping at eight', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = createTheme();
      const palette = createColorPalette({ mode });
      expect(palette.take(8)).toEqual(
        Array.from(
          { length: 8 },
          (_, i) => theme[mode][`chart-${i + 1}` as keyof typeof theme.light],
        ),
      );
      const colors = palette.take(1024);
      expect(colors.every((color) => /^#[a-f\d]{6}$/.test(color))).toBe(true);
      expect(new Set(colors).size).toBeGreaterThan(1000);
      expect(colors.slice(8, 16)).not.toEqual(colors.slice(0, 8));
      expect(palette.take(32)).toEqual(colors.slice(0, 32));
      expect(createColorPalette({ mode }).get(9000000)).toBe(palette.get(9000000));
      expect(palette.take(12, 80)).toEqual(colors.slice(80, 92));
      expect(theme).toEqual(createTheme());
    }
  });

  it('uses the same seeded themes and keeps generated colors visible on their surface', () => {
    for (const color of ['#087f5b', '#2563eb', '#ffea00', '#be185d', '#000', '#fff'])
      for (const mode of ['light', 'dark'] as const) {
        const theme = createTheme({ color, scheme: 'expressive' });
        const colors = generateColors(80, { color, mode, scheme: 'expressive' });
        const backgroundTone = Hct.fromInt(argbFromHex(theme[mode].surface!)).tone;
        for (const value of colors)
          expect(
            Contrast.ratioOfTones(Hct.fromInt(argbFromHex(value)).tone, backgroundTone),
          ).toBeGreaterThanOrEqual(3 - 1e-6);
        expect(colors).toEqual(createColorPalette({ mode, tokens: theme[mode] }).take(80));
      }
  });

  it('keeps distant colors close to the anchor family in perceptual hue, chroma and tone', () => {
    const palette = createColorPalette({ color: '#2563eb' });
    for (const index of [8, 47, 128, 999, 1000000]) {
      const anchor = Hct.fromInt(argbFromHex(palette.get(index % 8)));
      const color = Hct.fromInt(argbFromHex(palette.get(index)));
      const distance = Math.abs(color.hue - anchor.hue);
      expect(Math.min(distance, 360 - distance)).toBeLessThan(22);
      expect(Math.abs(color.tone - anchor.tone)).toBeLessThan(10);
      expect(Math.abs(color.chroma - anchor.chroma)).toBeLessThan(12);
    }
  });

  it('resolves token references and custom surfaces without mutating overrides', () => {
    const tokens = {
      primary: '#135798',
      'chart-1': 'var(--ui-primary)',
      'chart-2': 'var(--unknown, #a05080)',
      surface: 'var(--ui-background)',
      background: '#fff',
    };
    const palette = createColorPalette({ tokens, minContrast: 1 });
    expect(palette.get(0)).toBe('#135798');
    expect(palette.get(1)).toBe('#a05080');
    tokens.primary = '#abcdef';
    expect(palette.get(0)).toBe('#135798');
    expect(() => createColorPalette({ tokens: { 'chart-1': 'var(--unknown)' } })).toThrow(
      /resolve to a hex/,
    );
    expect(() =>
      createColorPalette({ tokens: { surface: 'color-mix(in srgb, red, blue)' } }),
    ).toThrow(/resolve to a hex/);
  });

  it('applies explicit contrast to both bright and dark colors and rejects unattainable targets', () => {
    for (const background of ['#fff', '#000', '#777']) {
      const tone = Hct.fromInt(argbFromHex(background)).tone;
      for (const value of generateColors(40, { background, minContrast: 4.5 }))
        expect(
          Contrast.ratioOfTones(Hct.fromInt(argbFromHex(value)).tone, tone),
        ).toBeGreaterThanOrEqual(4.5 - 1e-6);
    }
    expect(() => createColorPalette({ background: '#777', minContrast: 21 })).toThrow(RangeError);
    for (const minContrast of [0, 22, Infinity, NaN])
      expect(() => createColorPalette({ minContrast })).toThrow(RangeError);
    expect(() => createColorPalette({ color: 'blue' })).toThrow(TypeError);
    expect(() => createColorPalette({ background: 'transparent' })).toThrow(TypeError);
  });

  it('supports lazy iteration, stable keys and random access with validated batch bounds', () => {
    const palette = createColorPalette({ color: '#087f5b' });
    const iterator = palette[Symbol.iterator]();
    expect(Array.from({ length: 20 }, () => iterator.next().value)).toEqual(palette.take(20));
    const keyColor = palette.forKey('customer:42');
    palette.forKey('another');
    palette.take(512);
    expect(palette.forKey('customer:42')).toBe(keyColor);
    expect(createColorPalette({ color: '#087f5b' }).forKey('customer:42')).toBe(keyColor);
    expect(palette.get(Number.MAX_SAFE_INTEGER)).toMatch(/^#[a-f\d]{6}$/);
    expect(palette.take(0)).toEqual([]);
    for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => palette.get(value)).toThrow(RangeError);
      expect(() => palette.take(value)).toThrow(RangeError);
    }
    expect(() => palette.take(3, Number.MAX_SAFE_INTEGER - 1)).toThrow(RangeError);
    expect(() => palette.forKey(NaN)).toThrow(TypeError);
  });
});

function ReadPalette({ name, options }: { name: string; options?: ColorPaletteOptions }) {
  const palette = useColorPalette(options);
  return <output aria-label={name}>{palette.take(16).join(',')}</output>;
}
const read = (name: string) => screen.getByLabelText(name).textContent!.split(',');

describe('reactive theme palettes', () => {
  it('follows seed and mode changes while preserving memoized identity for unrelated settings', async () => {
    const identities: unknown[] = [];
    function Harness() {
      const palette = useColorPalette();
      identities.push(palette);
      const { setTheme } = useTheme();
      return (
        <>
          <ReadPalette name="Live colors" />
          <button onClick={() => setTheme({ radius: 12 })}>Radius</button>
          <button onClick={() => setTheme({ color: '#2563eb' })}>Blue</button>
          <button onClick={() => setTheme({ mode: 'dark' })}>Dark</button>
        </>
      );
    }
    const user = userEvent.setup();
    render(
      <PlainProvider persist={false} theme={{ mode: 'light' }}>
        <Harness />
      </PlainProvider>,
    );
    expect(read('Live colors')).toEqual(generateColors(16));
    const before = identities.at(-1);
    await user.click(screen.getByText('Radius'));
    expect(identities.at(-1)).toBe(before);
    await user.click(screen.getByText('Blue'));
    expect(read('Live colors')).toEqual(generateColors(16, { color: '#2563eb' }));
    await user.click(screen.getByText('Dark'));
    expect(read('Live colors')).toEqual(generateColors(16, { color: '#2563eb', mode: 'dark' }));
  });

  it('uses scoped modes and role overrides without leaking them to siblings', () => {
    const brand = createTheme({ color: '#087f5b' });
    render(
      <PlainProvider
        persist={false}
        theme={{ color: '#2563eb', mode: 'light' }}
        tokens={{ 'chart-1': '#135798' }}
      >
        <ReadPalette name="Root colors" />
        <ThemeScope>
          <ReadPalette name="Inherited colors" />
        </ThemeScope>
        <ThemeScope mode="dark">
          <ReadPalette name="Dark neutral" />
        </ThemeScope>
        <ThemeScope mode="dark" tokens={brand.dark}>
          <ReadPalette name="Local brand" />
          <ThemeScope tokens={{ 'chart-1': '#91d9ac' }}>
            <ReadPalette name="Nested colors" />
          </ThemeScope>
        </ThemeScope>
        <ReadPalette name="Sibling colors" />
      </PlainProvider>,
    );
    expect(read('Root colors')).toEqual(
      generateColors(16, { color: '#2563eb', tokens: { 'chart-1': '#135798' } }),
    );
    expect(read('Inherited colors')).toEqual(read('Root colors'));
    expect(read('Sibling colors')).toEqual(read('Root colors'));
    expect(read('Dark neutral')).toEqual(generateColors(16, { mode: 'dark' }));
    expect(read('Local brand')).toEqual(generateColors(16, { mode: 'dark', tokens: brand.dark }));
    expect(read('Nested colors')).toEqual(
      generateColors(16, { mode: 'dark', tokens: { ...brand.dark, 'chart-1': '#91d9ac' } }),
    );
  });

  it('honors standalone ThemeProvider overrides and explicit hook seeds', () => {
    render(
      <ThemeProvider
        persist={false}
        defaultSettings={{ mode: 'light' }}
        tokens={{ 'chart-1': '#135798' }}
      >
        <ThemeScope>
          <ReadPalette name="Provider colors" />
        </ThemeScope>
        <ReadPalette name="Explicit seed" options={{ color: '#be185d', minContrast: 1 }} />
      </ThemeProvider>,
    );
    expect(read('Provider colors')).toEqual(
      generateColors(16, { tokens: { 'chart-1': '#135798' } }),
    );
    expect(read('Explicit seed')).toEqual(generateColors(16, { color: '#be185d', minContrast: 1 }));
  });

  it('matches server and initial client colors without browser color resolution', () => {
    const markup = renderToString(
      <PlainProvider persist={false} theme={{ mode: 'dark', color: '#2563eb' }}>
        <ReadPalette name="Server colors" />
      </PlainProvider>,
    );
    expect(markup).toContain(generateColors(16, { mode: 'dark', color: '#2563eb' }).join(','));
  });
});
