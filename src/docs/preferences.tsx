import * as React from 'react';
import type { TextDirection } from '../ui';
export const AppPreferences = React.createContext<{
  direction: TextDirection;
  setDirection: (direction: TextDirection) => void;
  customize: () => void;
}>({ direction: 'ltr', setDirection: () => {}, customize: () => {} });
export const useAppPreferences = () => React.useContext(AppPreferences);
