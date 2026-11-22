import type * as React from 'react';
import { type ToasterProps as SonnerToasterProps, Toaster as Sonner } from 'sonner';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { useTranslation } from './i18n';

export type ToasterProps = SonnerToasterProps & Omit<PlainStyleProps, 'tooltip'>;

export function Toaster({
  toastOptions,
  unstyled,
  dir: localDirection,
  invert = true,
  style,
  ...props
}: ToasterProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const dir = useDirection(localDirection === 'auto' ? undefined : localDirection);
  const isUnstyled = unstyled ?? styles.unstyled;
  const toastUnstyled = toastOptions?.unstyled ?? isUnstyled;
  // Resolve appearance from each toast's effective inversion, including native
  // per-toast overrides, while leaving caller inline styles last.
  const background = 'var(--ui-toast-current-background)';
  const foreground = 'var(--ui-toast-current-foreground)';
  return (
    <Sonner
      dir={dir}
      invert={invert}
      position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
      closeButton
      gap={12}
      containerAriaLabel={t('toast.notifications')}
      style={{ zIndex: 'var(--ui-layer-toast)', ...style }}
      toastOptions={{
        unstyled: isUnstyled,
        ...toastOptions,
        className: styles('toast.root', 'ui-toast', toastOptions?.className, toastUnstyled)
          .className,
        closeButtonAriaLabel: toastOptions?.closeButtonAriaLabel ?? t('common.close'),
        style: toastUnstyled
          ? toastOptions?.style
          : ({
              '--normal-bg': background,
              '--normal-text': foreground,
              '--normal-border': 'var(--ui-toast-border,var(--ui-border))',
              background,
              color: foreground,
              border: 'var(--ui-border-width,1px) solid var(--ui-toast-border,var(--ui-border))',
              borderRadius: 'var(--ui-toast-radius,var(--ui-radius))',
              boxShadow: 'var(--ui-toast-shadow,var(--ui-shadow))',
              fontFamily: 'var(--ui-font)',
              ...toastOptions?.style,
            } as React.CSSProperties),
      }}
      {...props}
    />
  );
}
export { toast } from 'sonner';
