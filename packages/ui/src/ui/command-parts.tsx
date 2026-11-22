import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { type PlainStyleProps, useStyles } from './style-context';
import { useTranslation } from './i18n';
import { type InputVariant, inputVariantClass } from './input-variants';
import { Search } from 'lucide-react';

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
