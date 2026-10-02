import * as React from 'react';
import type { TextDirection, ThemeTokens } from '../ui';
export const AppPreferences = React.createContext<{
  direction: TextDirection;
  setDirection: (direction: TextDirection) => void;
  customize: () => void;
  tokens: ThemeTokens;
  setTokens: (tokens: ThemeTokens) => void;
}>({
  direction: 'ltr',
  setDirection: () => {},
  customize: () => {},
  tokens: {},
  setTokens: () => {},
});
export const useAppPreferences = () => React.useContext(AppPreferences);
