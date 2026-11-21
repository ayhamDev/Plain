import * as React from 'react';
import type { ThemeTokens } from './token-contract';

/** Explicit overrides shared by the theme provider, scopes and derived color utilities. */
export const TokenOverridesContext = /* @__PURE__ */ React.createContext<ThemeTokens>({});
