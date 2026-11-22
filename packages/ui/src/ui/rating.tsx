import * as React from 'react';
import { RadioGroup } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { Star, X } from 'lucide-react';

export interface RatingProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroup.Root>,
      'value' | 'defaultValue' | 'onValueChange'
    >,
    PlainStyleProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  allowClear?: boolean;
  getLabel?: (value: number, max: number) => string;
}

export const Rating = /* @__PURE__ */ React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value: controlled,
      defaultValue = 0,
      onValueChange,
      max = 5,
      readOnly,
      allowClear,
      getLabel: getLabelProp,
      name,
      form,
      disabled,
      required,
      className,
      unstyled,
      dir,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!, []);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const limit = Math.max(1, Math.min(20, Math.floor(Number.isFinite(max) ? max : 5)));
    const value = Math.max(0, Math.min(limit, Math.round(Number.isFinite(raw) ? raw : 0)));
    useFormReset(root, reset, form);
    return (
      <div {...styles('rating.wrapper', 'ui-rating-wrapper', undefined, unstyled)}>
        {styles.tooltip(
          <RadioGroup.Root
            ref={root}
            dir={direction}
            orientation="horizontal"
            aria-label={t('rating.title')}
            value={value ? String(value) : ''}
            disabled={disabled}
            required={required}
            form={form}
            {...styles('rating.root', 'ui-rating', className, unstyled)}
            {...props}
            onValueChange={(next) => {
              if (!readOnly) setValue(Number(next));
            }}
          >
            {Array.from({ length: limit }, (_, index) => (
              <RadioGroup.Item
                key={index}
                value={String(index + 1)}
                aria-label={
                  getLabelProp?.(index + 1, limit) ??
                  t('rating.label', { value: index + 1, max: limit })
                }
                tabIndex={readOnly ? -1 : undefined}
                data-filled={index < value || undefined}
                {...styles('rating.item', 'ui-rating-item', undefined, unstyled)}
              >
                <Star
                  {...styles('rating.icon', 'ui-rating-icon', undefined, unstyled)}
                  aria-hidden="true"
                />
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>,
          unstyled,
        )}
        {name && <input type="hidden" name={name} form={form} value={value} disabled={disabled} />}
        {allowClear && !readOnly && (
          <button
            type="button"
            disabled={disabled || value === 0}
            aria-label={t('rating.clear')}
            title={t('rating.clear')}
            {...styles('rating.clear', 'ui-input-action', undefined, unstyled)}
            onClick={() => setValue(0)}
          >
            <X
              {...styles('rating.clear-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  },
);

Rating.displayName = 'Rating';
