import * as React from 'react';
import {
  type PlainStyleProps,
  useStyles,
  useDirection,
  StyleProvider,
  DirectionProvider,
} from './style-context';
import { type InputVariant, inputClass, inputVariantClass } from './input-variants';
import { type PopoverContent, Popover, PopoverTrigger } from './popover';
import { type SelectionPresentation, useSelectionPresentation } from './selection-presentation';
import { useTranslation } from './i18n';
import { cn } from './utils';
import { ChevronsUpDown, Check } from 'lucide-react';
import { SelectionPanel } from './selection-panel';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './command-parts';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  keywords?: string[];
  description?: string;
}

export interface ComboboxProps
  extends
    PlainStyleProps,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'value' | 'defaultValue' | 'onChange' | 'children'
    > {
  variant?: InputVariant;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  name?: string;
  contentProps?: React.ComponentProps<typeof PopoverContent>;
  presentation?: SelectionPresentation;
  sheetTitle?: React.ReactNode;
}

export const Combobox = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  ComboboxProps & PlainStyleProps
>((allProps, ref) => {
  const {
    options,
    variant = 'outlined',
    value,
    defaultValue = '',
    onValueChange,
    placeholder: placeholderProp,
    searchPlaceholder: searchPlaceholderProp,
    emptyMessage: emptyMessageProp,
    name,
    className,
    unstyled,
    contentProps,
    presentation = 'popover',
    sheetTitle,
    dir,
    ...props
  } = allProps;
  const styles = useStyles();
  const direction = useDirection(dir === 'rtl' || dir === 'ltr' ? dir : undefined);
  const { t } = useTranslation();
  const placeholder = placeholderProp ?? t('select.option'),
    searchPlaceholder = searchPlaceholderProp ?? t('select.search'),
    emptyMessage = emptyMessageProp ?? t('select.empty');
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value');
  const [open, setOpen] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const panelId = React.useId();
  const availableOpen = open && !props.disabled;
  const { mode, ready } = useSelectionPresentation(presentation, availableOpen);
  React.useImperativeHandle(ref, () => trigger.current!, []);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const current = controlled ? (value ?? '') : internalValue;
  const selected = options.find((option) => option.value === current);
  const { className: contentClassName, ...contentRest } = contentProps ?? {};
  return (
    <StyleProvider unstyled={unstyled}>
      <DirectionProvider dir={direction}>
        <Popover open={availableOpen && ready && mode === 'popover'} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {styles.tooltip(
              <button
                ref={trigger}
                dir={direction}
                type="button"
                data-variant={variant}
                role="combobox"
                aria-expanded={availableOpen}
                aria-haspopup="dialog"
                aria-controls={availableOpen ? panelId : undefined}
                aria-label={props['aria-label'] ?? placeholder}
                {...styles(
                  'combobox.root',
                  cn(
                    inputClass,
                    inputVariantClass(variant),
                    'items-center justify-between gap-2 font-normal text-start',
                    !selected && 'text-muted-foreground',
                  ),
                  className,
                  unstyled,
                )}
                {...props}
              >
                <span {...styles('combobox.value', 'min-w-0 truncate', undefined, unstyled)}>
                  {selected?.label ?? placeholder}
                </span>
                <ChevronsUpDown
                  {...styles('combobox.icon', 'size-4 shrink-0 opacity-60', undefined, unstyled)}
                  aria-hidden="true"
                />
              </button>,
              unstyled,
            )}
          </PopoverTrigger>
          <SelectionPanel
            id={panelId}
            open={availableOpen}
            onOpenChange={setOpen}
            mode={mode}
            ready={ready}
            title={sheetTitle ?? props['aria-label'] ?? placeholder}
            returnFocusRef={trigger}
            popoverProps={{
              ...contentRest,
              ...styles(
                'combobox.content',
                'w-[var(--radix-popover-trigger-width)] min-w-48 max-w-[calc(100vw-32px)] p-0',
                contentClassName,
                unstyled,
              ),
            }}
          >
            <Command label={searchPlaceholder} defaultValue={current}>
              <CommandInput placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
              <CommandList
                style={
                  !(unstyled ?? styles.unstyled)
                    ? { maxHeight: mode === 'sheet' ? 'none' : 288 }
                    : undefined
                }
              >
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, ...(option.keywords ?? [])]}
                      disabled={option.disabled}
                      onSelect={() => {
                        if (!controlled) setInternalValue(option.value);
                        onValueChange?.(option.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        aria-hidden="true"
                        {...styles(
                          'combobox.selected-icon',
                          cn(current === option.value ? 'opacity-100' : 'opacity-0'),
                          undefined,
                          unstyled,
                        )}
                      />
                      <span
                        {...styles(
                          'combobox.option-label',
                          'min-w-0 whitespace-normal break-words',
                          undefined,
                          unstyled,
                        )}
                      >
                        {option.label}
                        {option.description && (
                          <span
                            {...styles(
                              'combobox.option-description',
                              'block text-xs text-muted-foreground',
                              undefined,
                              unstyled,
                            )}
                          >
                            {option.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </SelectionPanel>
          {name && (
            <input
              type="hidden"
              name={name}
              form={props.form}
              value={current}
              disabled={props.disabled}
            />
          )}
        </Popover>
      </DirectionProvider>
    </StyleProvider>
  );
});

Combobox.displayName = 'Combobox';
