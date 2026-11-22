import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputClass, inputVariantClass } from './input-variants';
import { cn } from './utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  PlainStyleProps & {
    variant?: InputVariant;
    /** Native resize handle direction. Defaults to vertical; use none to disable it. */
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  };

const textareaResizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
} satisfies Record<NonNullable<TextareaProps['resize']>, string>;

export const Textarea = /* @__PURE__ */ React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, variant = 'outlined', resize = 'vertical', unstyled, ...props }, ref) => {
    const styles = useStyles();
    return styles.tooltip(
      <textarea
        ref={ref}
        rows={rows}
        data-variant={variant}
        data-resize={resize}
        {...styles(
          'textarea.root',
          cn(
            inputClass,
            inputVariantClass(variant),
            'min-h-24 max-w-full leading-6',
            textareaResizeClasses[resize],
          ),
          className,
          unstyled,
        )}
        {...props}
      />,
      unstyled,
    );
  },
);

Textarea.displayName = 'Textarea';
