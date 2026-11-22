import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputClass, inputVariantClass } from './input-variants';
import { cn } from './utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  PlainStyleProps & { variant?: InputVariant };

export const Input = /* @__PURE__ */ React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', unstyled, variant = 'outlined', ...props }, ref) => {
    const styles = useStyles();
    return styles.tooltip(
      <input
        ref={ref}
        type={type}
        data-variant={variant}
        {...styles('input.root', cn(inputClass, inputVariantClass(variant)), className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);

Input.displayName = 'Input';
