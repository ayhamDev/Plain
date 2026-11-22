import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { changeInput } from './utils';
import { Minus, Plus } from 'lucide-react';

export interface NumberInputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'size'
    >,
    PlainStyleProps {
  value?: number | '';
  defaultValue?: number | '';
  onValueChange?: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  showControls?: boolean;
  variant?: InputVariant;
  textAlign?: 'start' | 'center' | 'end';
}

export const NumberInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlled,
      defaultValue = '',
      onValueChange,
      min,
      max,
      step = 1,
      showControls = true,
      variant = 'outlined',
      textAlign = showControls ? 'center' : 'start',
      className,
      unstyled,
      onChange,
      onBlur,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const value = typeof raw === 'number' && !Number.isFinite(raw) ? '' : raw;
    useFormReset(input, reset);
    const lower = min !== undefined && Number.isFinite(min) ? min : undefined;
    const upper = max !== undefined && Number.isFinite(max) ? max : undefined;
    const increment = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const clamp = (next: number) => Math.min(upper ?? Infinity, Math.max(lower ?? -Infinity, next));
    const changeBy = (sign: number) => {
      const next =
        value === ''
          ? sign > 0
            ? (lower ?? increment)
            : (upper ?? -increment)
          : Number((value + sign * increment).toFixed(12));
      changeInput(input.current, String(clamp(next)));
      input.current?.focus();
    };
    return (
      <div
        {...styles(
          'number-input.root',
          `ui-input-control ui-number-input ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-disabled={disabled || undefined}
        data-variant={variant}
        data-controls={showControls}
        data-align={textAlign}
      >
        {showControls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={
              disabled || readOnly || (value !== '' && lower !== undefined && value <= lower)
            }
            aria-label={t('input.decrease')}
            title={t('input.decrease')}
            {...styles('number-input.decrease', 'ui-input-action', undefined, unstyled)}
            onClick={() => changeBy(-1)}
          >
            <Minus
              {...styles('number-input.decrease-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
        {styles.tooltip(
          <input
            ref={input}
            type="number"
            aria-label={t('input.number')}
            value={value}
            min={lower}
            max={upper}
            step={step}
            disabled={disabled}
            readOnly={readOnly}
            {...styles('number-input.input', 'ui-advanced-input', className, unstyled)}
            {...props}
            onChange={(event) => {
              const next = event.currentTarget.valueAsNumber;
              setValue(Number.isFinite(next) ? next : '');
              onChange?.(event);
            }}
            onBlur={(event) => {
              onBlur?.(event);
              if (!event.defaultPrevented && value !== '' && value !== clamp(value))
                changeInput(input.current, String(clamp(value)));
            }}
          />,
          unstyled,
        )}
        {showControls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={
              disabled || readOnly || (value !== '' && upper !== undefined && value >= upper)
            }
            aria-label={t('input.increase')}
            title={t('input.increase')}
            {...styles('number-input.increase', 'ui-input-action', undefined, unstyled)}
            onClick={() => changeBy(1)}
          >
            <Plus
              {...styles('number-input.increase-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';
