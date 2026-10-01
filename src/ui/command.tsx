import { StyleProvider, useStyles, type PlainStyleProps } from './styling';
import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from './utils';
import { Button } from './primitives';
import { Popover, PopoverTrigger, PopoverContent } from './overlays';
export const Command = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CommandPrimitive
      ref={ref}
      {...styles(
        'command.root',
        'flex w-full flex-col overflow-hidden rounded-ui bg-surface text-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
Command.displayName = 'Command';
export const CommandInput = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <div
      {...styles('command.wrapper', 'flex items-center gap-2 border-b px-3', undefined, unstyled)}
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
      <CommandPrimitive.Input
        ref={ref}
        {...styles(
          'command.input',
          'h-11 w-full min-w-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50',
          className,
          unstyled,
        )}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = 'CommandInput';
export const CommandList = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CommandPrimitive.List
      ref={ref}
      {...styles(
        'command.list',
        'max-h-72 overflow-x-hidden overflow-y-auto p-1',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
CommandList.displayName = 'CommandList';
export const CommandEmpty = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CommandPrimitive.Empty
      ref={ref}
      {...styles(
        'command.empty',
        'px-4 py-8 text-center text-sm text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
CommandEmpty.displayName = 'CommandEmpty';
export const CommandGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CommandPrimitive.Group
      ref={ref}
      {...styles(
        'command.group',
        'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
CommandGroup.displayName = 'CommandGroup';
export const CommandItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CommandPrimitive.Item
      ref={ref}
      {...styles(
        'command.item',
        'relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-[min(var(--ui-radius),4px)] px-3 py-2 text-sm outline-none data-[selected=true]:bg-muted data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
CommandItem.displayName = 'CommandItem';
export const CommandSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CommandPrimitive.Separator
      ref={ref}
      role="presentation"
      aria-hidden="true"
      {...styles('command.separator', 'my-1 h-px bg-border', className, unstyled)}
      {...props}
    />
  );
});
CommandSeparator.displayName = 'CommandSeparator';
export function CommandShortcut({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'span'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <span
      {...styles('command.shortcut', 'ms-auto text-xs text-muted-foreground', className, unstyled)}
      {...props}
    />
  );
}
export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  keywords?: string[];
}
export interface ComboboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  name?: string;
}
export const Combobox = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  ComboboxProps & PlainStyleProps
>(
  (
    {
      options,
      value,
      defaultValue = '',
      onValueChange,
      placeholder = 'Select an option',
      searchPlaceholder = 'Search options...',
      emptyMessage = 'No options found.',
      name,
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const current = value ?? internalValue;
    const selected = options.find((option) => option.value === current);
    return (
      <StyleProvider unstyled={unstyled}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-label={props['aria-label'] ?? placeholder}
              {...styles(
                'combobox.root',
                cn(
                  'w-full justify-between border-input-border font-normal',
                  !selected && 'text-muted-foreground',
                ),
                className,
                unstyled,
              )}
              {...props}
            >
              {selected?.label ?? placeholder}
              <ChevronsUpDown
                {...styles('combobox.icon', 'opacity-60', undefined, unstyled)}
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            {...styles(
              'combobox.content',
              'w-[var(--radix-popover-trigger-width)] p-0',
              undefined,
              unstyled,
            )}
          >
            <Command>
              <CommandInput placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      keywords={option.keywords}
                      disabled={option.disabled}
                      onSelect={() => {
                        if (value === undefined) setInternalValue(option.value);
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
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
          {name && <input type="hidden" name={name} value={current} disabled={props.disabled} />}
        </Popover>
      </StyleProvider>
    );
  },
);
Combobox.displayName = 'Combobox';
