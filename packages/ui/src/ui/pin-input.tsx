import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { changeInput } from './utils';

export interface PinInputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'size' | 'maxLength'
    >,
    PlainStyleProps {
  variant?: InputVariant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  numeric?: boolean;
  masked?: boolean;
}

export const PinInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      value: controlled,
      variant = 'outlined',
      defaultValue = '',
      onValueChange,
      onComplete,
      length = 6,
      numeric = true,
      masked,
      className,
      style,
      unstyled,
      disabled,
      readOnly,
      onChange,
      onFocus,
      onBlur,
      onSelect,
      onPaste,
      tooltip,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();

    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const size = Number.isFinite(length) ? Math.max(1, Math.min(32, Math.floor(length))) : 6;
    const clean = (text: string) => (numeric ? text.replace(/[^0-9]/g, '') : text).slice(0, size);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const value = clean(raw);
    const [focused, setFocused] = React.useState(false);
    const [cursor, setCursor] = React.useState(0);
    useFormReset(input, reset);
    return styles.tooltip(
      <div
        tabIndex={tooltip === undefined ? undefined : disabled ? 0 : -1}
        {...styles('pin-input.root', 'ui-pin-input', undefined, unstyled)}
        data-variant={variant}
        data-disabled={disabled || undefined}
        style={
          { '--ui-pin-length': size, '--ui-pin-columns': Math.min(8, size) } as React.CSSProperties
        }
      >
        <div aria-hidden="true" {...styles('pin-input.slots', 'ui-pin-slots', undefined, unstyled)}>
          {Array.from({ length: size }, (_, index) => (
            <span
              key={index}
              data-variant={variant}
              data-disabled={disabled || undefined}
              data-active={(focused && index === Math.min(cursor, size - 1)) || undefined}
              {...styles(
                'pin-input.slot',
                `ui-pin-slot ${inputVariantClass(variant)}`,
                undefined,
                unstyled,
              )}
            >
              {value[index] ? (masked ? '*' : value[index]) : ''}
            </span>
          ))}
        </div>
        {styles.tooltip(
          <input
            ref={input}
            type={masked ? 'password' : 'text'}
            aria-label={t('input.pin')}
            inputMode={numeric ? 'numeric' : 'text'}
            autoComplete="one-time-code"
            pattern={numeric ? `[0-9]{${size}}` : undefined}
            maxLength={size}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            {...styles('pin-input.input', 'ui-pin-native', className, unstyled)}
            style={style}
            {...props}
            onChange={(event) => {
              const next = clean(event.currentTarget.value);
              event.currentTarget.value = next;
              setValue(next);
              setCursor(event.currentTarget.selectionStart ?? next.length);
              onChange?.(event);
              if (next.length === size && next !== value) onComplete?.(next);
            }}
            onFocus={(event) => {
              setFocused(true);
              setCursor(event.currentTarget.selectionStart ?? value.length);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onSelect={(event) => {
              setCursor(event.currentTarget.selectionStart ?? value.length);
              onSelect?.(event);
            }}
            onPaste={(event) => {
              onPaste?.(event);
              if (event.defaultPrevented || disabled || readOnly) return;
              const inserted = numeric
                ? event.clipboardData.getData('text').replace(/[^0-9]/g, '')
                : event.clipboardData.getData('text');
              const start = event.currentTarget.selectionStart ?? value.length;
              const end = event.currentTarget.selectionEnd ?? start;
              const next = clean(value.slice(0, start) + inserted + value.slice(end));
              event.preventDefault();
              changeInput(input.current, next);
              const position = Math.min(size, start + inserted.length);
              input.current?.setSelectionRange(position, position);
              setCursor(position);
            }}
          />,
          unstyled,
        )}
      </div>,
      unstyled,
      tooltip,
    );
  },
);

PinInput.displayName = 'PinInput';
