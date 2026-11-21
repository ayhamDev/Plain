import * as React from 'react';
import { Direction } from 'radix-ui';
import { ThemeProvider, useTheme, type ThemeSettings } from './theme';
import { createTheme } from './color-theme';
import { createColorPalette, type ColorPaletteOptions } from './color-palette';
import { TokenOverridesContext } from './theme-token-context';
import { cn } from './utils';
import { wrapTooltip } from './tooltip-prop';
import { TooltipProviderScope, type TooltipProviderProps } from './tooltip-provider';
import type { TooltipProps, TooltipValue } from './tooltip-types';
import {
  LanguageProvider,
  languageDirection,
  useTranslation,
  type LanguageProviderProps,
} from './i18n';
import type { StyleSlot } from './slots';
import {
  tokensToStyle,
  lightTokens,
  componentTokenAliases,
  type ThemeTokens,
} from './token-contract';
export type { ThemeToken, ThemeTokens } from './token-contract';

export type TextDirection = 'ltr' | 'rtl';
export interface PlainStyleProps extends TooltipProps {
  unstyled?: boolean;
}
/** @deprecated Use the corresponding resizable.* styling slots. */
export type SplitPaneStyleSlot = `split-pane.${'root' | 'panel' | 'handle' | 'icon'}`;
export type ComponentStyles = Partial<Record<StyleSlot | SplitPaneStyleSlot, string>>;
const PaletteScopeContext = /* @__PURE__ */ React.createContext<
  | {
      mode?: 'light' | 'dark';
      tokens: ThemeTokens;
    }
  | undefined
>(undefined);

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
const aliasNames = /* @__PURE__ */ createAliasNames();
function createAliasNames() {
  return new Set([
    ...Object.keys(componentTokenAliases),
    ...Object.entries(lightTokens)
      .filter(([, value]) => value.includes('var('))
      .map(([key]) => key),
  ]);
}
function TokenOverridesProvider({
  tokens,
  children,
}: {
  tokens?: ThemeTokens;
  children: React.ReactNode;
}) {
  const parent = React.useContext(TokenOverridesContext);
  const value = React.useMemo(() => ({ ...parent, ...tokens }), [parent, tokens]);
  return <TokenOverridesContext.Provider value={value}>{children}</TokenOverridesContext.Provider>;
}
interface StyleContextValue {
  unstyled: boolean;
  styles: ComponentStyles;
}
const StyleContext = /* @__PURE__ */ React.createContext<StyleContextValue>({
  unstyled: false,
  styles: {},
});

export function StyleProvider({
  children,
  unstyled,
  styles = {},
}: {
  children: React.ReactNode;
  unstyled?: boolean;
  styles?: ComponentStyles;
}) {
  const parent = React.useContext(StyleContext);
  const value = React.useMemo(
    () => ({ unstyled: unstyled ?? parent.unstyled, styles: { ...parent.styles, ...styles } }),
    [unstyled, styles, parent],
  );
  return <StyleContext.Provider value={value}>{children}</StyleContext.Provider>;
}

// One context read per component; the returned function can also style conditional parts.
export function useStyles() {
  const context = React.useContext(StyleContext);
  const styles = (slot: StyleSlot, defaults: string, className?: string, unstyled?: boolean) => {
    const index = slot.indexOf('.');
    const override =
      context.styles[slot] ??
      (slot.startsWith('resizable.')
        ? context.styles[`split-pane.${slot.slice(index + 1)}` as SplitPaneStyleSlot]
        : undefined);
    return {
      'data-ui': slot.slice(0, index),
      'data-slot': slot.slice(index + 1),
      className: cn((unstyled ?? context.unstyled) ? undefined : defaults, override, className),
    };
  };
  return Object.assign(styles, {
    unstyled: context.unstyled,
    tooltip: <P,>(element: React.ReactElement<P>, unstyled?: boolean, value?: TooltipValue) =>
      wrapTooltip(
        element,
        unstyled ?? context.unstyled,
        value,
        styles('tooltip.disabled-trigger', '', undefined, unstyled),
      ),
  });
}

export function DirectionProvider({
  children,
  dir,
}: {
  children: React.ReactNode;
  dir: TextDirection;
}) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}
export const useDirection: (localDirection?: TextDirection) => TextDirection =
  Direction.useDirection;
const PortalContainerContext = /* @__PURE__ */ React.createContext<HTMLElement | undefined>(
  undefined,
);
export function usePortalContainer() {
  return React.useContext(PortalContainerContext);
}
export interface PlainProviderProps extends LanguageProviderProps {
  tooltip?: Omit<TooltipProviderProps, 'children'>;
  theme?: Partial<ThemeSettings>;
  tokens?: ThemeTokens;
  styles?: ComponentStyles;
  unstyled?: boolean;
  persist?: boolean;
}
export function PlainProvider({
  children,
  dir,
  locale,
  timeZone,
  messages,
  translations,
  theme,
  tokens,
  styles,
  unstyled,
  tooltip,
  persist = true,
}: PlainProviderProps) {
  const inheritedDirection = useDirection();
  return (
    <LanguageProvider
      locale={locale}
      timeZone={timeZone}
      dir={dir ?? (locale ? languageDirection(locale) : inheritedDirection)}
      messages={messages}
      translations={translations}
    >
      <DocumentLanguage />
      <ThemeProvider defaultSettings={theme} persist={persist} tokens={tokens}>
        <TokenOverridesProvider tokens={tokens}>
          <StyleProvider styles={styles} unstyled={unstyled}>
            <TooltipProviderScope options={tooltip}>{children}</TooltipProviderScope>
          </StyleProvider>
        </TokenOverridesProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
function DocumentLanguage() {
  const { locale, dir } = useTranslation();
  React.useEffect(() => {
    const root = document.documentElement;
    const previousDirection = root.getAttribute('dir');
    const previousLanguage = root.getAttribute('lang');
    root.dir = dir;
    root.lang = locale;
    return () => {
      if (previousDirection !== null) root.setAttribute('dir', previousDirection);
      else root.removeAttribute('dir');
      if (previousLanguage !== null) root.setAttribute('lang', previousLanguage);
      else root.removeAttribute('lang');
    };
  }, [locale, dir]);
  return null;
}

export interface ThemeScopeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Pick<LanguageProviderProps, 'locale' | 'timeZone' | 'messages' | 'translations'> {
  tokens?: ThemeTokens;
  unstyled?: boolean;
  componentStyles?: ComponentStyles;
  mode?: 'light' | 'dark';
}
const ThemeScopeContent = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  Omit<ThemeScopeProps, 'locale' | 'timeZone' | 'messages' | 'translations'>
>(({ children, tokens, componentStyles, unstyled, style, dir, mode, ...props }, ref) => {
  const direction = useDirection(dir === 'rtl' || dir === 'ltr' ? dir : undefined);
  const language = useTranslation();
  const [container, setContainer] = React.useState<HTMLDivElement>();
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const scopeRef = React.useCallback((node: HTMLDivElement | null) => {
    nodeRef.current = node;
    setContainer(node ?? undefined);
  }, []);
  React.useImperativeHandle(ref, () => nodeRef.current!, []);
  const parentOverrides = React.useContext(TokenOverridesContext);
  const parentPaletteScope = React.useContext(PaletteScopeContext);
  const inheritedAliases = Object.fromEntries(
    Object.entries(parentOverrides).filter(([key]) => aliasNames.has(key)),
  );
  const variables = tokensToStyle({ ...inheritedAliases, ...tokens }) as React.CSSProperties;
  const paletteScope = React.useMemo(
    () => ({
      mode: mode ?? parentPaletteScope?.mode,
      tokens: mode
        ? {
            ...Object.fromEntries(
              Object.entries(parentOverrides).filter(([key]) => aliasNames.has(key)),
            ),
            ...tokens,
          }
        : { ...(parentPaletteScope?.tokens ?? parentOverrides), ...tokens },
    }),
    [mode, parentPaletteScope, parentOverrides, tokens],
  );
  return (
    <DirectionProvider dir={direction}>
      <TokenOverridesProvider tokens={tokens}>
        <PaletteScopeContext.Provider value={paletteScope}>
          <StyleProvider styles={componentStyles} unstyled={unstyled}>
            <div
              ref={scopeRef}
              dir={direction}
              lang={language.locale}
              data-ui-theme-scope=""
              data-theme={mode}
              style={{ ...variables, ...style }}
              {...props}
            >
              <PortalContainerContext.Provider value={container}>
                {children}
              </PortalContainerContext.Provider>
            </div>
          </StyleProvider>
        </PaletteScopeContext.Provider>
      </TokenOverridesProvider>
    </DirectionProvider>
  );
});
export const ThemeScope = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<HTMLDivElement, ThemeScopeProps>((props, ref) => {
    const inheritedDirection = useDirection();
    const { locale, timeZone, messages, translations, ...scopeProps } = props;
    return (
      <LanguageProvider
        locale={locale}
        timeZone={timeZone}
        dir={
          props.dir === 'rtl' || props.dir === 'ltr'
            ? props.dir
            : locale
              ? languageDirection(locale)
              : inheritedDirection
        }
        messages={messages}
        translations={translations}
      >
        <ThemeScopeContent {...scopeProps} ref={ref} />
      </LanguageProvider>
    );
  }),
  { displayName: 'ThemeScope' },
);
