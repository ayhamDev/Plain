import * as React from 'react';
import { Direction } from 'radix-ui';
import { ThemeProvider, type ThemeSettings } from './theme';
import { cn } from './utils';
import type { StyleSlot } from './slots';
import {
  tokensToStyle,
  lightTokens,
  componentTokenAliases,
  type ThemeTokens,
} from './token-contract';
export type { ThemeToken, ThemeTokens } from './token-contract';

export type TextDirection = 'ltr' | 'rtl';
export interface PlainStyleProps {
  unstyled?: boolean;
}
export type ComponentStyles = Partial<Record<StyleSlot, string>>;
const TokenOverridesContext = /* @__PURE__ */ React.createContext<ThemeTokens>({});
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
    return {
      'data-ui': slot.slice(0, index),
      'data-slot': slot.slice(index + 1),
      className: cn(
        (unstyled ?? context.unstyled) ? undefined : defaults,
        context.styles[slot],
        className,
      ),
    };
  };
  return Object.assign(styles, { unstyled: context.unstyled });
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
export interface PlainProviderProps {
  children: React.ReactNode;
  dir?: TextDirection;
  theme?: Partial<ThemeSettings>;
  tokens?: ThemeTokens;
  styles?: ComponentStyles;
  unstyled?: boolean;
  persist?: boolean;
}
export function PlainProvider({
  children,
  dir = 'ltr',
  theme,
  tokens,
  styles,
  unstyled,
  persist = true,
}: PlainProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('dir');
    root.dir = dir;
    return () => {
      if (previous) root.dir = previous;
      else root.removeAttribute('dir');
    };
  }, [dir]);
  return (
    <DirectionProvider dir={dir}>
      <ThemeProvider defaultSettings={theme} persist={persist} tokens={tokens}>
        <TokenOverridesProvider tokens={tokens}>
          <StyleProvider styles={styles} unstyled={unstyled}>
            {children}
          </StyleProvider>
        </TokenOverridesProvider>
      </ThemeProvider>
    </DirectionProvider>
  );
}

export interface ThemeScopeProps extends React.HTMLAttributes<HTMLDivElement> {
  tokens?: ThemeTokens;
  unstyled?: boolean;
  componentStyles?: ComponentStyles;
  mode?: 'light' | 'dark';
}
export const ThemeScope = /* @__PURE__ */ Object.assign(
  React.forwardRef<HTMLDivElement, ThemeScopeProps>(
    ({ children, tokens, componentStyles, unstyled, style, dir, mode, ...props }, ref) => {
      const direction = useDirection(dir as TextDirection | undefined);
      const [container, setContainer] = React.useState<HTMLDivElement>();
      const nodeRef = React.useRef<HTMLDivElement>(null);
      const scopeRef = React.useCallback((node: HTMLDivElement | null) => {
        nodeRef.current = node;
        setContainer(node ?? undefined);
      }, []);
      React.useImperativeHandle(ref, () => nodeRef.current!, []);
      const parentOverrides = React.useContext(TokenOverridesContext);
      const inheritedAliases = Object.fromEntries(
        Object.entries(parentOverrides).filter(([key]) => aliasNames.has(key)),
      );
      const variables = tokensToStyle({ ...inheritedAliases, ...tokens }) as React.CSSProperties;
      return (
        <DirectionProvider dir={direction}>
          <TokenOverridesProvider tokens={tokens}>
            <StyleProvider styles={componentStyles} unstyled={unstyled}>
              <div
                ref={scopeRef}
                dir={direction}
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
          </TokenOverridesProvider>
        </DirectionProvider>
      );
    },
  ),
  { displayName: 'ThemeScope' },
);
