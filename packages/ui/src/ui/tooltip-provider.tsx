import * as React from 'react';
import type { Tooltip as TooltipPrimitive } from 'radix-ui';

export type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider>;
export const TooltipSettingsContext = /* @__PURE__ */ React.createContext<{
  provided: boolean;
  options: Omit<TooltipProviderProps, 'children'>;
}>({ provided: false, options: {} });
export const useTooltipProviderSettings = () => React.useContext(TooltipSettingsContext);

export function TooltipProviderScope({
  options,
  children,
}: {
  options?: Omit<TooltipProviderProps, 'children'>;
  children: React.ReactNode;
}) {
  const inherited = useTooltipProviderSettings();
  const value = React.useMemo(
    () =>
      options === undefined
        ? inherited
        : {
            provided: false,
            options: { ...inherited.options, ...options },
          },
    [inherited, options],
  );
  return (
    <TooltipSettingsContext.Provider value={value}>{children}</TooltipSettingsContext.Provider>
  );
}
