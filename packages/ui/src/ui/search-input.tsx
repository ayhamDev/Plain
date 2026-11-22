import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { Search, X } from 'lucide-react';
import { changeInput } from './utils';

export interface SearchInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'>,
    PlainStyleProps {
  variant?: InputVariant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  clearLabel?: string;
}

export const SearchInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlled,
      variant = 'outlined',
      defaultValue = '',
      onValueChange,
      onClear,
      clearLabel: clearLabelProp,
      className,
      unstyled,
      disabled,
      readOnly,
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
    useFormReset(input, reset);
    return (
      <div
        {...styles(
          'search-input.root',
          `ui-input-control ui-search-input ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
      >
        <Search
          {...styles('search-input.icon', 'ui-control-icon', undefined, unstyled)}
          aria-hidden="true"
        />
        {styles.tooltip(
          <input
            ref={input}
            type="search"
            aria-label={t('common.search')}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            {...styles('search-input.input', 'ui-advanced-input', className, unstyled)}
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
          aria-label={clearLabelProp ?? t('input.clear')}
          title={clearLabelProp ?? t('input.clear')}
          tabIndex={value ? 0 : -1}
          disabled={disabled || readOnly || !value}
          data-empty={!value || undefined}
          {...styles('search-input.clear', 'ui-input-action ui-search-clear', undefined, unstyled)}
          onClick={() => {
            changeInput(input.current, '');
            onClear?.();
            input.current?.focus();
          }}
        >
          <X
            {...styles('search-input.clear-icon', 'ui-control-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
