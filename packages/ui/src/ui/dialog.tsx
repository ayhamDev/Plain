import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, usePortalContainer, useDirection } from './style-context';
import { useTranslation } from './i18n';
import { cn } from './utils';
import { X } from 'lucide-react';

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<DialogPrimitive.Trigger {...props} ref={ref} />, unstyled);
});

DialogTrigger.displayName = 'DialogTrigger';

export const DialogClose = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<DialogPrimitive.Close {...props} ref={ref} />, unstyled);
});

DialogClose.displayName = 'DialogClose';

export function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const container = usePortalContainer();
  return <DialogPrimitive.Portal container={container} {...props} />;
}

export const DialogOverlay = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <DialogPrimitive.Overlay
      ref={ref}
      {...styles(
        'dialog.overlay',
        'ui-overlay fixed inset-0 z-[var(--ui-layer-overlay)] bg-[var(--ui-overlay,#00000066)]',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  (React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
  }) &
    PlainStyleProps
>(({ className, children, showClose = true, unstyled, dir: localDirection, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const dir = useDirection(
    localDirection === 'rtl' || localDirection === 'ltr' ? localDirection : undefined,
  );
  return (
    <DialogPortal>
      <DialogOverlay unstyled={unstyled} />
      {styles.tooltip(
        <DialogPrimitive.Content
          ref={ref}
          dir={localDirection ?? dir}
          {...styles(
            'dialog.content',
            cn(
              'ui-dialog fixed top-1/2 left-1/2 z-[var(--ui-layer-dialog)] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[var(--ui-dialog-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-dialog-border,var(--ui-border))] bg-[var(--ui-dialog-background,var(--ui-surface))] p-5 text-[var(--ui-dialog-foreground,var(--ui-foreground))] shadow-[var(--ui-dialog-shadow,var(--ui-shadow))] sm:p-6',
              showClose && '[&_[data-slot=header]]:pe-8',
            ),
            className,
            unstyled,
          )}
          {...props}
        >
          {children}
          {showClose && (
            <DialogClose
              {...styles(
                'dialog.close',
                'ui-interactive absolute top-4 end-4 flex size-8 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted hover:text-foreground',
                undefined,
                unstyled,
              )}
              aria-label={t('dialog.close')}
            >
              <X
                {...styles('dialog.close-icon', 'size-4', undefined, unstyled)}
                aria-hidden="true"
              />
            </DialogClose>
          )}
        </DialogPrimitive.Content>,
        unstyled,
      )}
    </DialogPortal>
  );
});

DialogContent.displayName = 'DialogContent';

export function DialogHeader({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();
  return styles.tooltip(
    <div
      {...styles('dialog.header', 'mb-5 flex flex-col gap-1.5 text-start', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}

export function DialogFooter({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();
  return styles.tooltip(
    <div
      {...styles(
        'dialog.footer',
        'mt-5 flex flex-wrap items-center justify-end gap-2',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
}

export const DialogTitle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <DialogPrimitive.Title
      ref={ref}
      {...styles('dialog.title', 'text-lg font-semibold leading-7', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <DialogPrimitive.Description
      ref={ref}
      {...styles(
        'dialog.description',
        'text-sm leading-6 text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

DialogDescription.displayName = 'DialogDescription';
