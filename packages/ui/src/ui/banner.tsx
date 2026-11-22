import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { useTranslation } from './i18n';
import { useValue } from './input-state';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, PlainStyleProps {
  title?: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  action?: React.ReactNode;
  dismissible?: boolean;
  dismissLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
}

export const Banner = /* @__PURE__ */ React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      title,
      variant = 'info',
      action,
      dismissible,
      dismissLabel: dismissLabelProp,
      open: controlled,
      defaultOpen = true,
      onOpenChange,
      onDismiss,
      children,
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();

    const [open, setOpen] = useValue(controlled, defaultOpen, onOpenChange);
    if (!open) return null;
    return styles.tooltip(
      <div
        ref={ref}
        role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
        data-variant={variant}
        {...styles('banner.root', 'ui-banner', className, unstyled)}
        {...props}
      >
        {variant === 'success' ? (
          <Check
            {...styles('banner.success-icon', 'ui-banner-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        ) : variant === 'warning' || variant === 'danger' ? (
          <AlertCircle
            {...styles('banner.alert-icon', 'ui-banner-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        ) : (
          <Info
            {...styles('banner.info-icon', 'ui-banner-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        )}
        <div {...styles('banner.content', 'ui-banner-content', undefined, unstyled)}>
          {title && (
            <div {...styles('banner.title', 'ui-banner-title', undefined, unstyled)}>{title}</div>
          )}
          {children && (
            <div {...styles('banner.description', 'ui-banner-description', undefined, unstyled)}>
              {children}
            </div>
          )}
        </div>
        {action && (
          <div {...styles('banner.action', 'ui-banner-action', undefined, unstyled)}>{action}</div>
        )}
        {dismissible && (
          <button
            type="button"
            aria-label={dismissLabelProp ?? t('banner.dismiss')}
            title={dismissLabelProp ?? t('banner.dismiss')}
            {...styles('banner.dismiss', 'ui-input-action', undefined, unstyled)}
            onClick={() => {
              setOpen(false);
              onDismiss?.();
            }}
          >
            <X
              {...styles('banner.dismiss-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
      </div>,
      unstyled,
    );
  },
);

Banner.displayName = 'Banner';
