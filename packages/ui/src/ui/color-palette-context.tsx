import * as React from 'react';
import { type ColorPaletteOptions, createColorPalette } from './color-palette';
import { useTheme } from './theme';
import { TokenOverridesContext } from './theme-token-context';
import { PaletteScopeContext } from './styling-internal';
import { createTheme } from './color-theme';

/** Memoized palette following PlainProvider/ThemeProvider and nested ThemeScope roles. */
export function useColorPalette({
  color,
  scheme,
  mode,
  tokens,
  background,
  minContrast,
}: ColorPaletteOptions = {}) {
  const theme = useTheme();
  const overrides = React.useContext(TokenOverridesContext);
  const scope = React.useContext(PaletteScopeContext);
  const resolvedMode = mode ?? scope?.mode ?? theme.resolvedMode;
  return React.useMemo(() => {
    if (color !== undefined)
      return createColorPalette({
        color,
        scheme,
        mode: resolvedMode,
        tokens,
        background,
        minContrast,
      });
    const base = createTheme({
      color: scope?.mode ? null : theme.resolvedColor,
      scheme: scheme ?? theme.scheme,
      contrast: theme.contrast,
    })[resolvedMode];
    return createColorPalette({
      mode: resolvedMode,
      background,
      minContrast,
      tokens: {
        ...base,
        ...(scope?.tokens ?? overrides),
        ...tokens,
      },
    });
  }, [
    color,
    scheme,
    resolvedMode,
    tokens,
    background,
    minContrast,
    scope,
    overrides,
    theme.resolvedColor,
    theme.scheme,
    theme.contrast,
  ]);
}
