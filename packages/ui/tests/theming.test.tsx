import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Contrast, argbFromHex, lstarFromArgb } from '@material/material-color-utilities';
import { createTheme } from '../src/ui/color-theme';
import { tokenNames, tokenVariable, tokensToStyle } from '../src/ui/token-contract';
import { PlainProvider, ThemeScope } from '../src/ui/styling';
import { Button } from '../src/ui/primitives';
import { Combobox } from '../src/ui/command';
import { extend } from '../src/ui/extend';
import { useTheme, validateTheme, defaultTheme } from '../src/ui/theme';
import { useMotionSettings } from '../src/ui/motion-policy';

describe('layered color themes', () => {
  it('preserves the original manual neutral roles without a Material seed', () => {
    const theme = createTheme();
    expect(theme.color).toBe(null);
    expect(theme.light).toMatchObject({
      background: '#ffffff',
      foreground: '#202321',
      surface: '#ffffff',
      muted: '#f5f6f5',
      'muted-foreground': '#666b68',
      border: '#e5e7e6',
      outline: '#858e87',
      primary: '#252826',
      'primary-foreground': '#ffffff',
      'primary-container': '#f2f3f2',
    });
    expect(theme.dark).toMatchObject({
      background: '#141615',
      foreground: '#edeff0',
      surface: '#1b1e1c',
      muted: '#242825',
      'muted-foreground': '#a2aaa5',
      border: '#333a35',
      outline: '#666f69',
      primary: '#e6ebe7',
      'primary-foreground': '#171a18',
      'primary-container': '#292e2b',
    });
    for (const [key, color] of Object.entries(theme.light)) {
      if (!key.startsWith('palette.')) continue;
      expect(color.slice(1, 3)).toBe(color.slice(3, 5));
      expect(color.slice(3, 5)).toBe(color.slice(5, 7));
    }
    expect(createTheme({ color: null, scheme: 'expressive', contrast: 1 })).toEqual(theme);
  });
  it('generates a coherent surface palette instead of replacing only the accent', () => {
    const green = createTheme({ color: '#087f5b' });
    const blue = createTheme({ color: '#2563eb' });
    for (const token of [
      'background',
      'surface-container',
      'muted-foreground',
      'outline',
      'secondary',
      'tertiary',
      'chart-2',
    ] as const)
      expect(green.light[token]).not.toBe(blue.light[token]);
    expect(green.light.background).not.toBe(green.dark.background);
    expect(green.light['palette.primary.40']).toMatch(/^#[a-f\d]{6}$/);
  });
  it('keeps accessible text pairs for supported seed colors and contrast levels', () => {
    for (const color of ['#087f5b', '#2563eb', '#ffea00', '#ffffff', '#000000', '#be185d'])
      for (const contrast of [0, 0.5, 1]) {
        const theme = createTheme({ color, contrast });
        for (const roles of [theme.light, theme.dark])
          for (const [foreground, background] of [
            ['foreground', 'background'],
            ['accent-foreground', 'accent'],
            ['accent-soft-foreground', 'accent-soft'],
            ['inverse-foreground', 'inverse'],
          ] as const) {
            const ratio = Contrast.ratioOfTones(
              lstarFromArgb(argbFromHex(roles[foreground]!)),
              lstarFromArgb(argbFromHex(roles[background]!)),
            );
            expect(ratio).toBeGreaterThanOrEqual(4.49);
          }
      }
  });
  it('normalizes short hex colors and rejects invalid direct generation requests', () => {
    expect(createTheme({ color: '#abc' }).color).toBe('#aabbcc');
    expect(() => createTheme({ color: 'not-a-color' })).toThrow(TypeError);
    expect(validateTheme({ color: 'bad', contrast: Infinity, borders: 'invalid' })).toEqual(
      defaultTheme,
    );
  });
  it('applies explicit root and component overrides after generated roles without mutating the cache', () => {
    const configured = createTheme({
      color: '#087f5b',
      tokens: { 'sidebar.background': '#123456' },
      dark: { background: '#121212' },
    });
    expect(configured.light['sidebar.background']).toBe('#123456');
    expect(configured.dark.background).toBe('#121212');
    expect(createTheme({ color: '#087f5b' }).dark.background).not.toBe('#121212');
    expect(configured.css).toContain('--ui-sidebar-background: #123456;');
  });
  it('preserves explicit component aliases across nested scopes while allowing a local override', () => {
    render(
      <PlainProvider persist={false} tokens={{ 'sidebar.background': '#123456' }}>
        <ThemeScope tokens={{ background: '#eeeeee' }} data-testid="outer">
          <ThemeScope tokens={{ 'sidebar.background': '#abcdef' }} data-testid="inner" />
        </ThemeScope>
      </PlainProvider>,
    );
    expect(screen.getByTestId('outer').style.getPropertyValue('--ui-sidebar-background')).toBe(
      '#123456',
    );
    expect(screen.getByTestId('inner').style.getPropertyValue('--ui-sidebar-background')).toBe(
      '#abcdef',
    );
  });
  it('maps typed tokens consistently and exposes a unique complete registry', () => {
    expect(tokenVariable('sidebar.background')).toBe('--ui-sidebar-background');
    expect(tokensToStyle({ 'button.radius': '12px' })).toEqual({ '--ui-button-radius': '12px' });
    expect(new Set(tokenNames).size).toBe(tokenNames.length);
    expect(tokenNames.length).toBeGreaterThan(200);
  });
  it('applies borderless and disabled-motion policies and restores document overrides', async () => {
    function Controls() {
      const { setTheme } = useTheme();
      const motion = useMotionSettings();
      return (
        <>
          <output aria-label="Animation enabled">{String(motion.enabled)}</output>
          <Button onClick={() => setTheme({ borders: 'none', motion: 'none' })}>Minimal</Button>
        </>
      );
    }
    const previous = document.documentElement.style.getPropertyValue('--ui-border-width');
    const { unmount } = render(
      <PlainProvider persist={false}>
        <Controls />
      </PlainProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Minimal' }));
    expect(document.documentElement.dataset.borders).toBe('none');
    expect(document.documentElement.style.getPropertyValue('--ui-border-width')).toBe('0px');
    expect(screen.getByLabelText('Animation enabled')).toHaveTextContent('false');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--ui-border-width')).toBe(previous);
  });
});

describe('component extensions', () => {
  it('combines typed variants, compound rules, slots and tokens without hiding native props or refs', async () => {
    const AppButton = extend(Button, {
      defaults: { variant: 'accent', size: 'sm' },
      className: 'px-8',
      variants: { tone: { brand: 'font-semibold', quiet: 'opacity-70' } },
      defaultVariants: { tone: 'brand' },
      compoundVariants: [{ when: { tone: 'brand', size: 'sm' }, className: 'uppercase' }],
      tokens: { 'button.radius': '12px' },
      styles: { 'button.root': 'rounded-full' },
    });
    const handler = vi.fn();
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <AppButton ref={ref} onClick={handler} className="px-2" data-testid="branded">
        Create
      </AppButton>,
    );
    const button = screen.getByRole('button', { name: 'Create' });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('font-semibold', 'uppercase', 'px-2', 'rounded-full');
    expect(button).not.toHaveClass('px-8');
    expect(button).not.toHaveAttribute('tone');
    expect(button.style.getPropertyValue('--ui-button-radius')).toBe('12px');
    await userEvent.click(button);
    expect(handler).toHaveBeenCalledOnce();
  });
  it('keeps consumer override precedence and native disabled behavior', async () => {
    const defaultHandler = vi.fn();
    const ownHandler = vi.fn();
    const AppButton = extend(Button, { defaults: { variant: 'accent', onClick: defaultHandler } });
    render(
      <>
        <AppButton variant="outline" onClick={ownHandler}>
          Own action
        </AppButton>
        <AppButton disabled>Disabled</AppButton>
      </>,
    );
    const button = screen.getByRole('button', { name: 'Own action' });
    expect(button).toHaveAttribute('data-variant', 'outline');
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    expect(ownHandler).toHaveBeenCalledOnce();
    expect(defaultHandler).not.toHaveBeenCalled();
  });
});

it('clears an explicitly controlled undefined combobox value and retains an uncontrolled default', async () => {
  const options = [{ value: 'one', label: 'One' }];
  const { rerender } = render(
    <Combobox options={options} value="one" defaultValue="one" aria-label="Version" />,
  );
  expect(screen.getByRole('combobox')).toHaveTextContent('One');
  rerender(
    <Combobox options={options} value={undefined} defaultValue="one" aria-label="Version" />,
  );
  await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Select an option'));
});
