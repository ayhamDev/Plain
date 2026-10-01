import * as React from 'react';
import { Direction } from 'radix-ui';
import { ThemeProvider, type ThemeSettings } from './theme';
import { cn } from './utils';
import type { StyleSlot } from './slots';

export type TextDirection = 'ltr' | 'rtl';
export interface PlainStyleProps {
  unstyled?: boolean;
}
export type ThemeToken =
  | 'background'
  | 'foreground'
  | 'surface'
  | 'muted'
  | 'muted-foreground'
  | 'border'
  | 'input-border'
  | 'accent'
  | 'accent-foreground'
  | 'accent-soft'
  | 'danger'
  | 'danger-soft'
  | 'radius'
  | 'control-height'
  | 'font'
  | 'shadow';
export type ThemeTokens = Partial<Record<ThemeToken, string>>;
export type ComponentStyles = Partial<Record<StyleSlot, string>>;
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
        <StyleProvider styles={styles} unstyled={unstyled}>
          {children}
        </StyleProvider>
      </ThemeProvider>
    </DirectionProvider>
  );
}

export interface ThemeScopeProps extends React.HTMLAttributes<HTMLDivElement> {
  tokens?: ThemeTokens;
  unstyled?: boolean;
  componentStyles?: ComponentStyles;
}
export const ThemeScope = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ThemeScopeProps>(
  ({ children, tokens, componentStyles, unstyled, style, dir, ...props }, ref) => {
    const direction = useDirection(dir as TextDirection | undefined);
    const [container, setContainer] = React.useState<HTMLDivElement>();
    const nodeRef = React.useRef<HTMLDivElement>(null);
    const scopeRef = React.useCallback((node: HTMLDivElement | null) => {
      nodeRef.current = node;
      setContainer(node ?? undefined);
    }, []);
    React.useImperativeHandle(ref, () => nodeRef.current!, []);
    const variables = Object.fromEntries(
      Object.entries(tokens ?? {}).map(([key, value]) => [`--ui-${key}`, value]),
    ) as React.CSSProperties;
    return (
      <DirectionProvider dir={direction}>
        <StyleProvider styles={componentStyles} unstyled={unstyled}>
          <div ref={scopeRef} dir={direction} style={{ ...variables, ...style }} {...props}>
            <PortalContainerContext.Provider value={container}>
              {children}
            </PortalContainerContext.Provider>
          </div>
        </StyleProvider>
      </DirectionProvider>
    );
  },
);
ThemeScope.displayName = 'ThemeScope';
