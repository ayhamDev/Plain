import type * as React from 'react';
import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import { useTranslation } from './i18n';
import { CircleCheck, TriangleAlert, Info, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
  appearance?: 'subtle' | 'outlined' | 'filled';
  action?: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function Alert({
  className,
  variant = 'info',
  icon,
  appearance = 'subtle',
  action,
  onDismiss,
  dismissLabel,
  children,
  unstyled,
  ...props
}: AlertProps & PlainStyleProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const Icon =
    variant === 'success'
      ? CircleCheck
      : variant === 'warning' || variant === 'destructive'
        ? TriangleAlert
        : Info;
  return (
    <StyleProvider unstyled={unstyled}>
      {styles.tooltip(
        <div
          role="alert"
          data-variant={variant}
          data-appearance={appearance}
          {...styles('alert.root', 'ui-alert', className, unstyled)}
          {...props}
        >
          {icon !== null && (
            <span
              {...styles('alert.icon', 'ui-alert-icon', undefined, unstyled)}
              aria-hidden="true"
            >
              {icon ?? <Icon />}
            </span>
          )}
          <div {...styles('alert.content', 'min-w-0 flex-1', undefined, unstyled)}>{children}</div>
          {action && (
            <div {...styles('alert.action', 'ui-alert-action', undefined, unstyled)}>{action}</div>
          )}
          {onDismiss && (
            <button
              type="button"
              aria-label={dismissLabel ?? t('common.close')}
              onClick={onDismiss}
              {...styles('alert.close', 'ui-alert-close', undefined, unstyled)}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>,
        unstyled,
      )}
    </StyleProvider>
  );
}

export function AlertTitle({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'h3'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <h3 {...styles('alert.title', 'font-medium leading-6', className, unstyled)} {...props} />,
    unstyled,
  );
}

export function AlertDescription({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <div
      {...styles(
        'alert.description',
        'ui-alert-description text-sm leading-6',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
}
