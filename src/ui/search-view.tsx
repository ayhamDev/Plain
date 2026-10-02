import * as React from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './overlays';
import { Command, CommandInput, CommandList } from './command';
import { Button } from './primitives';
import { useTranslation } from './i18n';
import { StyleProvider, useStyles, type PlainStyleProps } from './styling';

export interface SearchViewContext {
  query: string;
  setQuery: (value: string) => void;
  close: () => void;
}
export interface SearchViewProps extends PlainStyleProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (value: string) => void;
  variant?: 'docked' | 'modal' | 'fullscreen';
  trigger?: React.ReactNode;
  placeholder?: string;
  label?: string;
  loading?: boolean;
  /** Disable local filtering when the application supplies remote results. */
  shouldFilter?: boolean;
  children: React.ReactNode | ((context: SearchViewContext) => React.ReactNode);
  footer?: React.ReactNode;
  className?: string;
  contentProps?: React.ComponentProps<typeof DialogContent>;
  popoverProps?: React.ComponentProps<typeof PopoverContent>;
}
export function SearchView({
  value,
  defaultValue = '',
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onSubmit,
  variant = 'modal',
  trigger,
  placeholder,
  label,
  loading,
  shouldFilter = true,
  children,
  footer,
  className,
  unstyled,
  contentProps,
  popoverProps,
}: SearchViewProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [local, setLocal] = React.useState(defaultValue);
  const [localOpen, setOpen] = React.useState(defaultOpen);
  const query = value ?? local,
    open = controlledOpen ?? localOpen;
  const changeOpen = (next: boolean) => {
    if (controlledOpen === undefined) setOpen(next);
    onOpenChange?.(next);
  };
  const setQuery = (next: string) => {
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };
  const triggerNode = trigger ?? (
    <Button variant="outline">
      <Search aria-hidden="true" />
      {label ?? t('search.title')}
    </Button>
  );
  const content = (
    <Command
      label={label ?? t('search.title')}
      shouldFilter={shouldFilter}
      aria-busy={loading || undefined}
    >
      <div className="ui-search-view-input">
        <CommandInput
          aria-label={label ?? t('search.title')}
          placeholder={placeholder ?? t('common.search')}
          value={query}
          onValueChange={setQuery}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.nativeEvent.isComposing &&
              !event.currentTarget
                .closest('[cmdk-root]')
                ?.querySelector('[cmdk-item][data-selected="true"]')
            )
              onSubmit?.(query);
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.close')}
          onClick={() => changeOpen(false)}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <CommandList>
        {typeof children === 'function'
          ? children({ query, setQuery, close: () => changeOpen(false) })
          : children}
      </CommandList>
      {loading && (
        <div role="status" className="ui-search-view-status">
          {t('common.loading')}
        </div>
      )}
      {footer}
    </Command>
  );
  return (
    <StyleProvider unstyled={unstyled}>
      {variant === 'docked' ? (
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>
          <PopoverContent
            align="start"
            aria-label={label ?? t('search.title')}
            {...styles(
              'search-view.root',
              'ui-search-view ui-search-view-docked',
              className,
              unstyled,
            )}
            {...popoverProps}
          >
            {content}
          </PopoverContent>
        </Popover>
      ) : (
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogTrigger asChild>{triggerNode}</DialogTrigger>
          <DialogContent
            showClose={false}
            aria-describedby={undefined}
            data-variant={variant}
            {...styles('search-view.root', 'ui-search-view', className, unstyled)}
            {...contentProps}
          >
            <DialogTitle className="ui-visually-hidden">{label ?? t('search.title')}</DialogTitle>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </StyleProvider>
  );
}
