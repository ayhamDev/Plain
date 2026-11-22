import * as React from 'react';
import {
  type PlainStyleProps,
  useStyles,
  useDirection,
  StyleProvider,
  DirectionProvider,
} from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { type SelectionPresentation, useSelectionPresentation } from './selection-presentation';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { X, ChevronDown, Check } from 'lucide-react';
import { SelectionPanel } from './selection-panel';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface MultiSelectProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'size'>,
    PlainStyleProps {
  variant?: InputVariant;
  options: readonly MultiSelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (values: string[]) => void;
  maxSelected?: number;
  selectionDisplay?: 'tags' | 'summary';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  emptyLabel?: string;
  presentation?: SelectionPresentation;
  sheetTitle?: React.ReactNode;
}

export const MultiSelect = /* @__PURE__ */ React.forwardRef<HTMLInputElement, MultiSelectProps>(
  (
    {
      options,
      value: controlled,
      variant = 'outlined',
      defaultValue = [],
      onValueChange,
      maxSelected = Infinity,
      selectionDisplay = 'tags',
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      emptyLabel: emptyLabelProp,
      presentation = 'popover',
      sheetTitle,
      name,
      form,
      required,
      disabled,
      readOnly,
      className,
      unstyled,
      id: suppliedId,
      dir,
      onKeyDown,
      onChange,
      onFocus,
      onClick,
      onBeforeInput,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t, locale } = useTranslation();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const input = React.useRef<HTMLInputElement>(null);
    const ignoreNextFocus = React.useRef(false);
    React.useImperativeHandle(ref, () => input.current!, []);
    const generated = React.useId();
    const id = suppliedId ?? `multiselect-${generated}`;
    const listId = `${id}-options`;
    const panelId = `${id}-panel`;
    const summaryId = `${id}-selection`;
    const [values, setValues, reset] = useValue<readonly string[]>(
      controlled,
      defaultValue,
      (next) => onValueChange?.([...next]),
    );
    const [open, setOpen] = useValue(controlledOpen, defaultOpen, onOpenChange);
    const availableOpen = open && !disabled && !readOnly;
    const { mode, ready, sheet } = useSelectionPresentation(presentation, availableOpen);
    const selectionSummary = values
      .map((value) => options.find((option) => option.value === value)?.label ?? value)
      .join(', ');
    const [query, setQuery] = React.useState('');
    const [active, setActive] = React.useState<string | null>(null);
    const resetAll = React.useCallback(() => {
      reset();
      setQuery('');
      setActive(null);
    }, [reset]);
    useFormReset(input, resetAll);
    React.useEffect(() => {
      input.current?.setCustomValidity(required && !values.length ? t('select.required') : '');
    }, [required, values.length, t]);
    const filtered = options.filter((option) =>
      option.label.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)),
    );
    const unavailable = (option: MultiSelectOption) =>
      !!option.disabled || (!values.includes(option.value) && values.length >= maxSelected);
    const enabled = filtered.filter((option) => !unavailable(option));
    const activeValue = enabled.some((option) => option.value === active)
      ? active
      : enabled[0]?.value;
    const optionId = (value: string) => `${listId}-${encodeURIComponent(value)}`;
    React.useEffect(() => {
      if (open && activeValue)
        document
          .getElementById(`${listId}-${encodeURIComponent(activeValue)}`)
          ?.scrollIntoView({ block: 'nearest' });
    }, [open, activeValue, listId]);
    const toggle = (value: string) => {
      const option = options.find((option) => option.value === value);
      if (!option || unavailable(option) || disabled || readOnly) return;
      setValues(
        values.includes(value) ? values.filter((current) => current !== value) : [...values, value],
      );
      if (!sheet) input.current?.focus();
    };
    const changeQuery: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      onChange?.(event);
      if (event.defaultPrevented) return;
      setQuery(event.currentTarget.value);
      setActive(null);
      setOpen(true);
    };
    const navigate: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.nativeEvent.isComposing || readOnly || disabled) return;
      if (sheet && !open && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const index = enabled.findIndex((option) => option.value === activeValue);
        const next = !open
          ? event.key === 'ArrowDown'
            ? 0
            : enabled.length - 1
          : Math.max(0, Math.min(enabled.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
        setActive(enabled[next]?.value ?? null);
        setOpen(true);
      } else if ((event.key === 'Enter' || (event.key === ' ' && !query)) && open) {
        event.preventDefault();
        if (activeValue) toggle(activeValue);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'Tab' && !sheet) setOpen(false);
      else if (event.key === 'Backspace' && !query && values.length) setValues(values.slice(0, -1));
    };
    return (
      <StyleProvider unstyled={unstyled}>
        <DirectionProvider dir={direction}>
          <PopoverPrimitive.Root
            open={availableOpen && ready && mode === 'popover'}
            onOpenChange={setOpen}
          >
            <PopoverPrimitive.Anchor asChild>
              <div
                {...styles(
                  'multi-select.root',
                  `ui-tags-input ui-multi-select ${inputVariantClass(variant)}`,
                  undefined,
                  unstyled,
                )}
                dir={direction}
                data-variant={variant}
                data-disabled={disabled || undefined}
                data-selection-display={selectionDisplay}
                data-has-value={values.length > 0 || undefined}
              >
                {selectionDisplay === 'tags' &&
                  values.map((value, index) => (
                    <span
                      key={`${value}-${index}`}
                      {...styles('multi-select.tag', 'ui-input-tag', undefined, unstyled)}
                    >
                      <span
                        {...styles(
                          'multi-select.tag-label',
                          'ui-input-tag-label',
                          undefined,
                          unstyled,
                        )}
                      >
                        {options.find((option) => option.value === value)?.label ?? value}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          disabled={disabled}
                          aria-label={t('common.remove', {
                            label: options.find((option) => option.value === value)?.label ?? value,
                          })}
                          {...styles('multi-select.remove', 'ui-tag-remove', undefined, unstyled)}
                          onClick={() => {
                            setValues(values.filter((current) => current !== value));
                            input.current?.focus();
                          }}
                        >
                          <X
                            {...styles(
                              'multi-select.remove-icon',
                              'ui-control-icon',
                              undefined,
                              unstyled,
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </span>
                  ))}
                {name &&
                  values.map((value, index) => (
                    <input
                      key={`${value}-${index}`}
                      type="hidden"
                      name={name}
                      form={form}
                      value={value}
                      disabled={disabled}
                    />
                  ))}
                {selectionDisplay === 'summary' && (
                  <span
                    id={summaryId}
                    {...styles('multi-select.summary', 'ui-visually-hidden', undefined, unstyled)}
                  >
                    {selectionSummary}
                  </span>
                )}
                {styles.tooltip(
                  <input
                    ref={input}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-label={t('select.options')}
                    aria-autocomplete={sheet ? 'none' : 'list'}
                    aria-haspopup={sheet ? 'dialog' : 'listbox'}
                    aria-expanded={open && !disabled && !readOnly}
                    aria-controls={availableOpen ? (sheet ? panelId : listId) : undefined}
                    aria-activedescendant={
                      !sheet && open && activeValue ? optionId(activeValue) : undefined
                    }
                    value={sheet ? '' : query}
                    form={form}
                    required={required && !values.length}
                    disabled={disabled}
                    readOnly={readOnly}
                    {...styles('multi-select.input', 'ui-tags-native', className, unstyled)}
                    {...props}
                    inputMode={sheet ? 'none' : props.inputMode}
                    placeholder={
                      selectionDisplay === 'summary' && values.length
                        ? selectionSummary
                        : props.placeholder
                    }
                    aria-describedby={
                      [
                        props['aria-describedby'],
                        selectionDisplay === 'summary' && values.length ? summaryId : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    onFocus={(event) => {
                      onFocus?.(event);
                      if (ignoreNextFocus.current) {
                        ignoreNextFocus.current = false;
                        return;
                      }
                      if (!event.defaultPrevented && !readOnly && !sheet) setOpen(true);
                    }}
                    onClick={(event) => {
                      onClick?.(event);
                      if (!event.defaultPrevented && sheet && !readOnly && !disabled) setOpen(true);
                    }}
                    onBeforeInput={(event) => {
                      onBeforeInput?.(event);
                      if (sheet) event.preventDefault();
                    }}
                    onChange={sheet ? undefined : changeQuery}
                    onKeyDown={navigate}
                  />,
                  unstyled,
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled || readOnly}
                  aria-label={t('select.toggle')}
                  title={t('select.toggle')}
                  aria-expanded={open}
                  {...styles('multi-select.toggle', 'ui-input-action', undefined, unstyled)}
                  onClick={() => {
                    setOpen(!open);
                    if (!open) input.current?.focus();
                  }}
                >
                  <ChevronDown
                    {...styles('multi-select.toggle-icon', 'ui-control-icon', undefined, unstyled)}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </PopoverPrimitive.Anchor>
            <SelectionPanel
              id={panelId}
              open={availableOpen}
              onOpenChange={setOpen}
              mode={mode}
              ready={ready}
              title={sheetTitle ?? props['aria-label'] ?? t('select.options')}
              returnFocusRef={input}
              multiple
              onReturnFocus={() => {
                ignoreNextFocus.current = true;
                input.current?.focus({ preventScroll: true });
              }}
              popoverProps={{
                dir: direction,
                align: 'start',
                sideOffset: 4,
                collisionPadding: 8,
                ...styles('multi-select.content', 'ui-multi-select-content', undefined, unstyled),
                onOpenAutoFocus: (event) => event.preventDefault(),
                onCloseAutoFocus: (event) => event.preventDefault(),
                onInteractOutside: (event) => {
                  if (input.current?.parentElement?.contains(event.target as Node))
                    event.preventDefault();
                },
              }}
            >
              {mode === 'sheet' && (
                <input
                  data-selection-search
                  type="search"
                  role="combobox"
                  aria-expanded="true"
                  aria-autocomplete="list"
                  aria-label={t('select.search')}
                  placeholder={t('select.search')}
                  value={query}
                  aria-controls={listId}
                  aria-activedescendant={activeValue ? optionId(activeValue) : undefined}
                  {...styles('multi-select.search', 'ui-selection-search', undefined, unstyled)}
                  onChange={changeQuery}
                  onKeyDown={navigate}
                />
              )}
              <div
                id={listId}
                role="listbox"
                aria-label={props['aria-label'] ?? t('common.options')}
                aria-multiselectable="true"
                {...styles('multi-select.list', 'ui-multi-select-list', undefined, unstyled)}
                style={
                  mode === 'sheet' && !(unstyled ?? styles.unstyled)
                    ? { maxHeight: 'none', minHeight: 0, flex: '1 1 auto', overflowY: 'auto' }
                    : undefined
                }
              >
                {!filtered.length && (
                  <div
                    {...styles('multi-select.empty', 'ui-multi-select-empty', undefined, unstyled)}
                  >
                    {emptyLabelProp ?? t('common.noResults')}
                  </div>
                )}
                {filtered.map((option) => (
                  <div
                    key={option.value}
                    id={optionId(option.value)}
                    role="option"
                    aria-selected={values.includes(option.value)}
                    aria-disabled={unavailable(option) || undefined}
                    data-active={activeValue === option.value || undefined}
                    {...styles(
                      'multi-select.option',
                      'ui-multi-select-option',
                      undefined,
                      unstyled,
                    )}
                    onPointerDown={(event) => {
                      if (event.pointerType === 'mouse') event.preventDefault();
                    }}
                    onPointerMove={() => {
                      if (!unavailable(option)) setActive(option.value);
                    }}
                    onClick={() => toggle(option.value)}
                  >
                    <span
                      {...styles(
                        'multi-select.option-check',
                        'ui-multi-select-check',
                        undefined,
                        unstyled,
                      )}
                      aria-hidden="true"
                    >
                      {values.includes(option.value) && <Check size={16} />}
                    </span>
                    {option.icon && <span aria-hidden="true">{option.icon}</span>}
                    {option.label}
                  </div>
                ))}
              </div>
            </SelectionPanel>
          </PopoverPrimitive.Root>
        </DirectionProvider>
      </StyleProvider>
    );
  },
);

MultiSelect.displayName = 'MultiSelect';
