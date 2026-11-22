import * as React from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHandle, SheetHeader, SheetTitle, SheetClose } from './sheet';
import { useTranslation } from './i18n';
import { useStyles } from './style-context';

interface SelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExited: () => void;
  title: React.ReactNode;
  titleId: string;
  content: React.ReactElement;
  unstyled?: boolean;
}

/** Vaul owns panel motion/drag; the nested Radix Select retains its selection and form engine. */
export function SelectSheet({
  open,
  onOpenChange,
  onExited,
  title,
  titleId,
  content,
  unstyled,
}: SelectSheetProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const child = content as React.ReactElement<{ children?: React.ReactNode }>;
  return (
    <Sheet
      side="bottom"
      open={open}
      onOpenChange={onOpenChange}
      maxWidth={640}
      handleOnly
      repositionInputs={false}
    >
      <SheetContent
        asChild
        showHandle={false}
        showClose={false}
        unstyled={unstyled}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onExited();
        }}
      >
        {styles.tooltip(
          React.cloneElement(
            content,
            undefined,
            <>
              <SheetHandle
                unstyled={unstyled}
                style={!(unstyled ?? styles.unstyled) ? { marginBlock: '12px 0' } : undefined}
              />
              <SheetHeader
                unstyled={unstyled}
                {...styles('select.sheet-header', '', undefined, unstyled)}
                style={
                  !(unstyled ?? styles.unstyled)
                    ? { flexShrink: 0, margin: 0, padding: '12px 20px', paddingInlineEnd: 56 }
                    : undefined
                }
              >
                <SheetTitle id={titleId} unstyled={unstyled}>
                  {title}
                </SheetTitle>
              </SheetHeader>
              {child.props.children}
              <SheetClose
                unstyled={unstyled}
                aria-label={t('panel.close')}
                {...styles(
                  'select.sheet-close',
                  'ui-interactive absolute top-3 end-3 flex size-11 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted hover:text-foreground',
                  undefined,
                  unstyled,
                )}
              >
                <X size={16} aria-hidden="true" />
              </SheetClose>
            </>,
          ),
          unstyled,
        )}
      </SheetContent>
    </Sheet>
  );
}
