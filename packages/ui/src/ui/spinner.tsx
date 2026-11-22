import type * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { useTranslation } from './i18n';
import { LoaderCircle } from 'lucide-react';

export function Spinner({
  className,
  label: labelProp,
  unstyled,
  ...props
}: (React.ComponentProps<'span'> & {
  label?: string;
}) &
  PlainStyleProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const label = labelProp ?? t('common.loading');
  return styles.tooltip(
    <span
      role="status"
      {...styles(
        'spinner.root',
        'inline-flex items-center gap-2 text-sm text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    >
      <LoaderCircle
        {...styles('spinner.icon', 'size-4 animate-spin', undefined, unstyled)}
        aria-hidden="true"
      />
      <span {...styles('spinner.label', 'sr-only', undefined, unstyled)}>{label}</span>
    </span>,
    unstyled,
  );
}
