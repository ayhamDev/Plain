import * as React from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection, usePortalContainer } from './style-context';
import { buttonVariants } from './button';

export const AlertDialog = AlertDialogPrimitive.Root;

export const AlertDialogTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<AlertDialogPrimitive.Trigger {...props} ref={ref} />, unstyled);
});

AlertDialogTrigger.displayName = 'AlertDialogTrigger';

export const AlertDialogContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, dir: localDirection, ...props }, ref) => {
  const styles = useStyles();
  const dir = useDirection(
    localDirection === 'rtl' || localDirection === 'ltr' ? localDirection : undefined,
  );
  return (
    <AlertDialogPrimitive.Portal container={usePortalContainer()}>
      <AlertDialogPrimitive.Overlay
        {...styles(
          'alert-dialog.overlay',
          'ui-overlay fixed inset-0 z-[var(--ui-layer-overlay)] bg-[var(--ui-overlay,#00000066)]',
          undefined,
          unstyled,
        )}
      />
      {styles.tooltip(
        <AlertDialogPrimitive.Content
          ref={ref}
          dir={localDirection ?? dir}
          {...styles(
            'alert-dialog.content',
            'ui-dialog fixed top-1/2 left-1/2 z-[var(--ui-layer-dialog)] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[var(--ui-dialog-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-dialog-border,var(--ui-border))] bg-[var(--ui-dialog-background,var(--ui-surface))] p-5 text-[var(--ui-dialog-foreground,var(--ui-foreground))] shadow-[var(--ui-dialog-shadow,var(--ui-shadow))] sm:p-6',
            className,
            unstyled,
          )}
          {...props}
        />,
        unstyled,
      )}
    </AlertDialogPrimitive.Portal>
  );
});

AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogTitle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <AlertDialogPrimitive.Title
      ref={ref}
      {...styles('alert-dialog.title', 'mb-2 text-lg font-semibold', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <AlertDialogPrimitive.Description
      ref={ref}
      {...styles(
        'alert-dialog.description',
        'text-sm leading-6 text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

AlertDialogDescription.displayName = 'AlertDialogDescription';

export const AlertDialogAction = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <AlertDialogPrimitive.Action
      ref={ref}
      {...styles('alert-dialog.action', buttonVariants(), className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

AlertDialogAction.displayName = 'AlertDialogAction';

export const AlertDialogCancel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <AlertDialogPrimitive.Cancel
      ref={ref}
      {...styles(
        'alert-dialog.cancel',
        buttonVariants({ variant: 'outline' }),
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

AlertDialogCancel.displayName = 'AlertDialogCancel';
