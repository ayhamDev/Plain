import * as React from 'react';
import {
  componentTokenAliases,
  lightTokens,
  type ThemeTokens,
  tokensToStyle,
} from './token-contract';
import {
  type LanguageProviderProps,
  useTranslation,
  LanguageProvider,
  languageDirection,
} from './i18n';
import {
  type ComponentStyles,
  useDirection,
  DirectionProvider,
  StyleProvider,
} from './style-context';
import { TokenOverridesContext } from './theme-token-context';
import {
  PaletteScopeContext,
  TokenOverridesProvider,
  PortalContainerContext,
} from './styling-internal';

const aliasNames = /* @__PURE__ */ createAliasNames();

function createAliasNames() {
  return new Set([
    ...Object.keys(componentTokenAliases),
    ...Object.entries(lightTokens)
      .filter(([, value]) => value.includes('var('))
      .map(([key]) => key),
  ]);
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
