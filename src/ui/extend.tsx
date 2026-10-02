import * as React from 'react';
import { StyleProvider, type ComponentStyles } from './styling';
import { tokensToStyle, type ThemeTokens } from './token-contract';
import { cn } from './utils';

type Variants = Record<string, Record<string, string>>;
type VariantValues<V extends Variants> = { [K in keyof V]?: keyof V[K] };
type NativeProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>;
export type ExtendedProps<T extends React.ElementType, V extends Variants> = NativeProps<T> &
  VariantValues<V>;
export interface ExtendConfig<T extends React.ElementType, V extends Variants> {
  displayName?: string;
  defaults?: Partial<NativeProps<T>>;
  className?: string;
  variants?: V;
  defaultVariants?: VariantValues<V>;
  compoundVariants?: Array<{ when: Partial<ExtendedProps<T, V>>; className: string }>;
  tokens?: ThemeTokens;
  styles?: ComponentStyles;
}

/** Configure a brand component once. Native props, events, children and refs still belong to its caller. */
export function extendComponent<
  T extends React.ElementType,
  const V extends Variants = Record<never, never>,
>(Component: T, config: ExtendConfig<T, V>) {
  const Configured = React.forwardRef<React.ComponentRef<T>, ExtendedProps<T, V>>((props, ref) => {
    const supplied = props as Record<string, unknown>;
    const merged = { ...config.defaults, ...supplied } as Record<string, unknown>;
    const selected: Record<string, unknown> = { ...merged };
    const classes: string[] = [];
    for (const [key, values] of Object.entries(config.variants ?? {})) {
      const value = supplied[key] ?? config.defaultVariants?.[key];
      selected[key] = value;
      if (typeof value === 'string' && values[value]) classes.push(values[value]);
      delete merged[key];
    }
    for (const compound of config.compoundVariants ?? [])
      if (Object.entries(compound.when).every(([key, value]) => selected[key] === value))
        classes.push(compound.className);
    const style = config.tokens
      ? {
          ...(config.defaults as { style?: React.CSSProperties })?.style,
          ...tokensToStyle(config.tokens),
          ...(supplied.style as React.CSSProperties),
        }
      : merged.style;
    const node = React.createElement(Component, {
      ...merged,
      ref,
      className: cn(
        (config.defaults as { className?: string })?.className,
        config.className,
        classes,
        supplied.className as string,
      ),
      ...(style ? { style } : {}),
    });
    return config.styles ? <StyleProvider styles={config.styles}>{node}</StyleProvider> : node;
  });
  Configured.displayName =
    config.displayName ??
    `Extended(${typeof Component === 'string' ? Component : ((Component as { displayName?: string }).displayName ?? 'Component')})`;
  return Configured;
}
export const extend = extendComponent;
