import * as React from 'react';
import { useStyles, type PlainStyleProps } from './styling';

export interface TypographyOptions {
  tone?: 'default' | 'muted' | 'accent' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'start' | 'center' | 'end' | 'justify';
  wrap?: 'normal' | 'balance' | 'pretty';
  truncate?: boolean;
}
type TypographyTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'small'
  | 'strong'
  | 'em'
  | 'a'
  | 'code'
  | 'pre'
  | 'blockquote'
  | 'ul'
  | 'ol'
  | 'li'
  | 'mark';
export type TypographyProps<T extends TypographyTag> = Omit<
  React.ComponentPropsWithoutRef<T>,
  keyof TypographyOptions
> &
  TypographyOptions &
  PlainStyleProps;

const sizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36 } as const;
const weights = { normal: 400, medium: 500, semibold: 600, bold: 700 } as const;

function typography<T extends TypographyTag>(tag: T) {
  const Component = React.forwardRef<
    HTMLElement,
    Omit<React.HTMLAttributes<HTMLElement>, keyof TypographyOptions> &
      TypographyOptions &
      PlainStyleProps
  >((allProps, ref) => {
    const { tone, size, weight, align, wrap, truncate, className, unstyled, style, ...props } =
      allProps;
    const styles = useStyles();
    return React.createElement(tag, {
      ...styles('typography.root', 'ui-typography', className, unstyled),
      'data-element': tag,
      'data-tone': tone,
      'data-truncate': truncate || undefined,
      style: {
        ...(size ? { '--ui-text-size': `${sizes[size]}px` } : {}),
        ...(weight ? { fontWeight: weights[weight] } : {}),
        ...(align ? { textAlign: align } : {}),
        ...(wrap ? { textWrap: wrap } : {}),
        ...style,
      } as React.CSSProperties,
      ...props,
      ref,
    });
  });
  Component.displayName =
    tag === 'blockquote' ? 'Blockquote' : tag.charAt(0).toUpperCase() + tag.slice(1);
  return Component as unknown as React.ForwardRefExoticComponent<
    React.PropsWithoutRef<TypographyProps<T>> & React.RefAttributes<React.ComponentRef<T>>
  >;
}

export const H1 = /* @__PURE__ */ typography('h1');
export const H2 = /* @__PURE__ */ typography('h2');
export const H3 = /* @__PURE__ */ typography('h3');
export const H4 = /* @__PURE__ */ typography('h4');
export const H5 = /* @__PURE__ */ typography('h5');
export const H6 = /* @__PURE__ */ typography('h6');
export const P = /* @__PURE__ */ typography('p');
export const Span = /* @__PURE__ */ typography('span');
export const Small = /* @__PURE__ */ typography('small');
export const Strong = /* @__PURE__ */ typography('strong');
export const Em = /* @__PURE__ */ typography('em');
export const A = /* @__PURE__ */ typography('a');
export const Code = /* @__PURE__ */ typography('code');
export const Pre = /* @__PURE__ */ typography('pre');
export const Blockquote = /* @__PURE__ */ typography('blockquote');
export const Ul = /* @__PURE__ */ typography('ul');
export const Ol = /* @__PURE__ */ typography('ol');
export const Li = /* @__PURE__ */ typography('li');
export const Mark = /* @__PURE__ */ typography('mark');
