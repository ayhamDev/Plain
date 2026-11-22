import * as React from 'react';
import { PopoverContent } from './popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetHandle } from './sheet';
import { Button } from './button';
import { useTranslation } from './i18n';
import { useStyles } from './style-context';
import { useSelectionViewport, type SelectionMode } from './selection-presentation';

interface SelectionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SelectionMode;
  ready: boolean;
  title: React.ReactNode;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onReturnFocus?: () => void;
  id?: string;
  children: React.ReactNode;
  multiple?: boolean;
  popoverProps?: React.ComponentProps<typeof PopoverContent>;
}

/** Shared selection shell: the caller keeps its trigger mounted in the original form. */
export function SelectionPanel({
  open,
  onOpenChange,
  mode,
  ready,
  title,
  returnFocusRef,
  onReturnFocus,
  id,
  children,
  multiple,
  popoverProps,
}: SelectionPanelProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [panel, setPanel] = React.useState<HTMLDivElement | null>(null);
  const panelNode = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useCallback((node: HTMLDivElement | null) => {
    panelNode.current = node;
    setPanel(node);
  }, []);
  useSelectionViewport(panel, mode === 'sheet' && !styles.unstyled);
  if (mode === 'popover') {
    const { className, style, ...props } = popoverProps ?? {};
    return (
      <PopoverContent
        data-presentation="popover"
        id={id}
        align="start"
        aria-label={typeof title === 'string' ? title : t('select.options')}
        {...props}
        {...styles('selection.content', 'ui-selection-content overflow-hidden p-0', className)}
        style={{
          ...(!styles.unstyled
            ? ({
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                maxHeight: 'min(384px, var(--radix-popover-content-available-height))',
              } as React.CSSProperties)
            : {}),
          ...style,
        }}
      >
        {children}
      </PopoverContent>
    );
  }
  return (
    <Sheet
      side="bottom"
      maxWidth={640}
      open={open && ready}
      onOpenChange={onOpenChange}
      repositionInputs={false}
    >
      <SheetContent
        data-presentation="sheet"
        id={id}
        ref={panelRef}
        {...styles('selection.sheet', 'ui-selection-sheet overflow-hidden p-0')}
        aria-describedby={undefined}
        style={
          !styles.unstyled
            ? {
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                height: 'auto',
                maxHeight:
                  'min(640px, calc(var(--_ui-selection-height, 100dvh) * 0.85), calc(var(--_ui-selection-height, 100dvh) - 8px))',
                bottom: 'var(--_ui-selection-bottom, 0px)',
              }
            : undefined
        }
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const keyboard = returnFocusRef.current?.matches(':focus-visible');
          const search = panelNode.current?.querySelector<HTMLInputElement>(
            '[cmdk-input], [data-selection-search]',
          );
          if (keyboard && search) search.focus({ preventScroll: true });
          else panelNode.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (onReturnFocus) onReturnFocus();
          else returnFocusRef.current?.focus({ preventScroll: true });
        }}
      >
        <SheetHandle
          {...styles('selection.handle', 'ui-selection-handle')}
          style={!styles.unstyled ? { marginBlock: '12px 0' } : undefined}
        />
        <SheetHeader
          {...styles('selection.header', 'ui-selection-header')}
          style={
            !styles.unstyled ? { margin: 0, padding: '12px 20px', paddingInlineEnd: 64 } : undefined
          }
        >
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div {...styles('selection.body', 'ui-selection-body')}>{children}</div>
        {multiple && (
          <div {...styles('selection.footer', 'ui-selection-footer')}>
            <SheetClose asChild>
              <Button>{t('common.done')}</Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
