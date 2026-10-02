import * as React from 'react';
import { Check, X } from 'lucide-react';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';
import { useTranslation } from './i18n';

interface ChipContextValue {
  values: readonly string[];
  change: (value: string) => void;
  disabled?: boolean;
}
const ChipContext = React.createContext<ChipContextValue | null>(null);
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, PlainStyleProps {
  value?: string;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  behavior?: 'action' | 'selection';
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showCheck?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      value,
      selected,
      defaultSelected = false,
      onSelectedChange,
      behavior = 'selection',
      variant = 'outlined',
      size = 'md',
      startIcon,
      endIcon,
      showCheck = true,
      onRemove,
      removeLabel,
      className,
      unstyled,
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const group = React.useContext(ChipContext);
    const [local, setLocal] = React.useState(defaultSelected);
    const active =
      selected ?? (group && value !== undefined ? group.values.includes(value) : local);
    const blocked = disabled || group?.disabled;
    const button = (
      <button
        ref={ref}
        type="button"
        {...styles('chip.root', 'ui-chip ui-interactive', className, unstyled)}
        data-variant={variant}
        data-size={size}
        data-selected={active || undefined}
        aria-pressed={behavior === 'selection' ? active : undefined}
        disabled={blocked}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || behavior === 'action') return;
          if (group && value !== undefined) group.change(value);
          else setLocal(!active);
          onSelectedChange?.(!active);
        }}
      >
        {startIcon ??
          (showCheck && active && behavior === 'selection' ? <Check aria-hidden="true" /> : null)}
        <span {...styles('chip.label', 'ui-chip-label', undefined, unstyled)}>{children}</span>
        {endIcon}
      </button>
    );
    return onRemove ? (
      <span {...styles('chip.container', 'ui-chip-container', undefined, unstyled)}>
        {button}
        <button
          type="button"
          disabled={blocked}
          aria-label={
            removeLabel ??
            t('common.remove', { label: typeof children === 'string' ? children : (value ?? '') })
          }
          {...styles('chip.remove', 'ui-chip-remove ui-interactive', undefined, unstyled)}
          onClick={onRemove}
        >
          <X aria-hidden="true" />
        </button>
      </span>
    ) : (
      button
    );
  },
);
Chip.displayName = 'Chip';
export interface ChipGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>, PlainStyleProps {
  type?: 'single' | 'multiple';
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
}
export const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  (
    {
      type = 'multiple',
      value,
      defaultValue = [],
      onValueChange,
      disabled,
      className,
      unstyled,
      dir,
      children,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
    const [local, setLocal] = React.useState<readonly string[]>(defaultValue);
    const values = value ?? local;
    const change = (item: string) => {
      const next = values.includes(item)
        ? values.filter((v) => v !== item)
        : type === 'single'
          ? [item]
          : [...values, item];
      if (value === undefined) setLocal(next);
      onValueChange?.(next);
    };
    return (
      <StyleProvider unstyled={unstyled}>
        <ChipContext.Provider value={{ values, change, disabled }}>
          <div
            ref={ref}
            role="group"
            dir={direction}
            {...styles('chip-group.root', 'ui-chip-group', className, unstyled)}
            {...props}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (
                event.defaultPrevented ||
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return;
              const buttons = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  'button[aria-pressed]:not(:disabled)',
                ),
              );
              const index = buttons.indexOf(event.target as HTMLButtonElement);
              if (index < 0 || !buttons.length) return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? buttons.length - 1
                    : (index +
                        ((event.key === 'ArrowRight') === (direction !== 'rtl') ? 1 : -1) +
                        buttons.length) %
                      buttons.length;
              buttons[next]?.focus();
            }}
          >
            {children}
          </div>
        </ChipContext.Provider>
      </StyleProvider>
    );
  },
);
ChipGroup.displayName = 'ChipGroup';
