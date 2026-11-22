import * as React from 'react';
import { type ThemeTokens } from './token-contract';
import { TokenOverridesContext } from './theme-token-context';
import { type ComponentStyles } from './style-context';

export const PaletteScopeContext = /* @__PURE__ */ React.createContext<
  | {
      mode?: 'light' | 'dark';
      tokens: ThemeTokens;
    }
  | undefined
>(undefined);

export function TokenOverridesProvider({
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

export const StyleContext = /* @__PURE__ */ React.createContext<StyleContextValue>({
  unstyled: false,
  styles: {},
});

export const PortalContainerContext = /* @__PURE__ */ React.createContext<HTMLElement | undefined>(
  undefined,
);
