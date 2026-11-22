import * as React from 'react';
import { useMediaQuery } from './media-query';
import { Button } from './button';
import { useTranslation } from './i18n';
import { useStyles } from './style-context';
import { cn } from './utils';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetFooter, SheetClose } from './sheet';

export type TableMenuPresentation = 'auto' | 'popover' | 'sheet';
const query = '(max-width: 640px)';

export function TableMenu({
  label,
  trigger,
  children,
  presentation = 'auto',
  contentProps = {},
}: {
  label: string;
  trigger: React.ReactElement;
  children: React.ReactNode;
  presentation?: TableMenuPresentation;
  contentProps?: React.ComponentProps<typeof PopoverContent>;
}) {
  const compact = useMediaQuery(query, presentation === 'auto');
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();
  const { unstyled } = useStyles();
  if (presentation === 'sheet' || (presentation === 'auto' && compact)) {
    return (
      <Sheet side="bottom" open={open} onOpenChange={setOpen} maxWidth={640}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          className={unstyled ? undefined : 'ui-table-mobile-panel overflow-hidden max-h-[85dvh]'}
          aria-describedby={undefined}
        >
          <SheetTitle className={unstyled ? undefined : 'ui-visually-hidden'}>{label}</SheetTitle>
          <div className={cn(!unstyled && 'ui-table-mobile-panel-body', contentProps.className)}>
            {children}
          </div>
          <SheetFooter className={unstyled ? undefined : 'ui-table-mobile-panel-footer'}>
            <SheetClose asChild>
              <Button>{t('common.done')}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent aria-label={label} align="start" {...contentProps}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
