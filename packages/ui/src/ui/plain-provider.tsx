import * as React from 'react';
import {
  type LanguageProviderProps,
  LanguageProvider,
  languageDirection,
  useTranslation,
} from './i18n';
import { type TooltipProviderProps, TooltipProviderScope } from './tooltip-provider';
import { type ThemeSettings, ThemeProvider } from './theme';
import { type ThemeTokens } from './token-contract';
import { type ComponentStyles, useDirection, StyleProvider } from './style-context';
import { TokenOverridesProvider } from './styling-internal';

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
