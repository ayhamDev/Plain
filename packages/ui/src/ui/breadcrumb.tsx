import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { useTranslation } from './i18n';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

export function Breadcrumb({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'nav'> & PlainStyleProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  return styles.tooltip(
    <nav
      aria-label={t('navigation.breadcrumb')}
      {...styles('breadcrumb.root', 'text-sm text-muted-foreground', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}

export function BreadcrumbList({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'ol'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <ol
      {...styles('breadcrumb.list', 'flex flex-wrap items-center gap-2', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}

export function BreadcrumbItem({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'li'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <li
      {...styles('breadcrumb.item', 'inline-flex items-center gap-2', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}

export const BreadcrumbLink = /* @__PURE__ */ React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <a
      ref={ref}
      {...styles(
        'breadcrumb.link',
        'rounded-sm transition-colors hover:text-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

BreadcrumbLink.displayName = 'BreadcrumbLink';

export function BreadcrumbPage({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'span'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <span
      aria-current="page"
      {...styles('breadcrumb.page', 'font-medium text-foreground', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}

export function BreadcrumbSeparator({ children, ...props }: React.ComponentProps<'li'>) {
  return (
    <li role="presentation" aria-hidden="true" {...props}>
      {children ?? <ChevronRight className="size-3.5 rtl:rotate-180" />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'span'> & PlainStyleProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return styles.tooltip(
    <span
      {...styles(
        'breadcrumb.ellipsis',
        'flex size-5 items-center justify-center',
        className,
        unstyled,
      )}
      aria-label={t('navigation.moreLevels')}
      role="img"
      {...props}
    >
      <MoreHorizontal className="size-4" aria-hidden="true" />
    </span>,
    unstyled,
  );
}
