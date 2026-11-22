import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { EyeOff, Eye } from 'lucide-react';

export interface PasswordInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'>,
    PlainStyleProps {
  variant?: InputVariant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const PasswordInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      value: controlled,
      variant = 'outlined',
      defaultValue = '',
      onValueChange,
      visible: controlledVisible,
      defaultVisible = false,
      onVisibilityChange,
      className,
      unstyled,
      disabled,
      onChange,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [value, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const [visible, setVisible] = useValue(controlledVisible, defaultVisible, onVisibilityChange);
    useFormReset(input, reset);
    return (
      <div
        {...styles(
          'password-input.root',
          `ui-input-control ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
      >
        {styles.tooltip(
          <input
            ref={input}
            type={visible ? 'text' : 'password'}
            aria-label={t('input.password')}
            autoComplete="current-password"
            value={value}
            disabled={disabled}
            {...styles('password-input.input', 'ui-advanced-input', className, unstyled)}
            {...props}
            onChange={(event) => {
              setValue(event.currentTarget.value);
              onChange?.(event);
            }}
          />,
          unstyled,
        )}
        <button
          type="button"
          disabled={disabled}
          aria-label={t(visible ? 'input.hidePassword' : 'input.showPassword')}
          title={t(visible ? 'input.hidePassword' : 'input.showPassword')}
          aria-pressed={visible}
          {...styles('password-input.toggle', 'ui-input-action', undefined, unstyled)}
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <EyeOff
              {...styles('password-input.hide-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          ) : (
            <Eye
              {...styles('password-input.show-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
