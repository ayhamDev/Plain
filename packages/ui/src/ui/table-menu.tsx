import * as React from 'react';
import { Button } from './primitives';
import { useTranslation } from './i18n';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from './overlays';

export type TableMenuPresentation = 'auto' | 'popover' | 'sheet';
const query = '(max-width: 640px)';
const subscribe = (update: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
};
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;

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
  const compact = React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();
  if (presentation === 'sheet' || (presentation === 'auto' && compact)) {
    return (
      <Sheet side="bottom" open={open} onOpenChange={setOpen} maxWidth={640}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent className="ui-table-mobile-panel" aria-describedby={undefined}>
          <SheetTitle className="ui-visually-hidden">{label}</SheetTitle>
          <div className={`ui-table-mobile-panel-body ${contentProps.className ?? ''}`}>
            {children}
          </div>
          <SheetFooter className="ui-table-mobile-panel-footer">
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
