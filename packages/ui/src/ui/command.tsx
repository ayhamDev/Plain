import {
  DirectionProvider,
  StyleProvider,
  useDirection,
  useStyles,
  type PlainStyleProps,
} from './styling';
import * as React from 'react';
import { inputClass, inputVariantClass, type InputVariant } from './input-variants';
import { useTranslation } from './i18n';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from './utils';
import { Popover, PopoverTrigger, PopoverContent } from './overlays';
import { SelectionPanel } from './selection-panel';
import { useSelectionPresentation, type SelectionPresentation } from './selection-presentation';
export const Command = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  return styles.tooltip(
    <CommandPrimitive
      ref={ref}
      label={props['aria-label'] ?? t('search.title')}
      {...styles(
        'command.root',
        'flex w-full flex-col overflow-hidden rounded-ui bg-surface text-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});
Command.displayName = 'Command';
export const CommandInput = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> &
    PlainStyleProps & { variant?: InputVariant }
>(({ className, unstyled, variant, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <div
      {...styles(
        'command.wrapper',
        variant
          ? `ui-input-control ${inputVariantClass(variant)} m-2 w-[calc(100%_-_16px)]`
          : 'flex items-center gap-2 border-b px-3',
        undefined,
        unstyled,
      )}
      data-variant={variant}
      data-disabled={props.disabled || undefined}
    >
      <Search
        {...styles(
          'command.input-icon',
          'size-4 shrink-0 text-muted-foreground',
          undefined,
          unstyled,
        )}
        aria-hidden="true"
      />
      {styles.tooltip(
        <CommandPrimitive.Input
          ref={ref}
          placeholder={t('common.search')}
          {...styles(
            'command.input',
            variant
              ? 'ui-advanced-input'
              : 'h-11 w-full min-w-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50',
            className,
            unstyled,
          )}
          {...props}
        />,
        unstyled,
      )}
    </div>
  );
});
CommandInput.displayName = 'CommandInput';
export const CommandList = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  return styles.tooltip(
    <CommandPrimitive.List
      ref={ref}
      label={props['aria-label'] ?? t('search.results')}
      {...styles(
        'command.list',
        'max-h-72 overflow-x-hidden overflow-y-auto p-1',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});
CommandList.displayName = 'CommandList';
export const CommandEmpty = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <CommandPrimitive.Empty
      ref={ref}
      {...styles(
        'command.empty',
        'px-4 py-8 text-center text-sm text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});
CommandEmpty.displayName = 'CommandEmpty';
export const CommandGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <CommandPrimitive.Group
      ref={ref}
      {...styles(
        'command.group',
        'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});
CommandGroup.displayName = 'CommandGroup';
export const CommandItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <CommandPrimitive.Item
      ref={ref}
      {...styles(
        'command.item',
        'relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-[min(var(--ui-radius),4px)] px-3 py-2 text-sm outline-none data-[selected=true]:bg-muted data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});
CommandItem.displayName = 'CommandItem';
export const CommandSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <CommandPrimitive.Separator
      ref={ref}
      role="presentation"
      aria-hidden="true"
      {...styles('command.separator', 'my-1 h-px bg-border', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
CommandSeparator.displayName = 'CommandSeparator';
export function CommandShortcut({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'span'> & PlainStyleProps) {
  const styles = useStyles();
  return styles.tooltip(
    <span
      {...styles('command.shortcut', 'ms-auto text-xs text-muted-foreground', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}
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
