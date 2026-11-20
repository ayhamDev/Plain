import { StyleProvider, useStyles, useDirection, type PlainStyleProps } from './styling';
import * as React from 'react';
import { useTranslation, numberFormatter } from './i18n';
import {
  Slot,
  Avatar as AvatarPrimitive,
  Separator as SeparatorPrimitive,
  Progress as ProgressPrimitive,
  AspectRatio as AspectRatioPrimitive,
} from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle, Info, CircleCheck, TriangleAlert, Inbox, X } from 'lucide-react';
import { cn } from './utils';
export const buttonVariants = /* @__PURE__ */ cva(
  'ui-interactive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ui-button-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--ui-button-border,var(--ui-border))] bg-[var(--ui-button-background,var(--ui-foreground))] text-[var(--ui-button-foreground,var(--ui-background))] hover:opacity-85',
        accent: 'border-accent bg-accent text-accent-foreground hover:brightness-95',
        secondary: 'border-transparent bg-muted text-foreground hover:bg-border',
        outline: 'border-border bg-surface text-foreground hover:bg-muted',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted',
        destructive:
          'border-danger bg-danger text-[var(--ui-danger-foreground,var(--ui-background))] hover:brightness-95',
        link: 'border-transparent bg-transparent text-accent underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3',
        md: 'min-h-[var(--ui-button-height,var(--ui-control-height))] px-4 py-2',
        lg: 'h-12 px-5',
        icon: 'size-9 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    PlainStyleProps {
  asChild?: boolean;
  loading?: boolean;
}
export const Button = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  ButtonProps & PlainStyleProps
>(
  (
    {
      className,
      variant,
      size,
      asChild,
      loading,
      disabled,
      children,
      onClick,
      type = 'button',
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();

    const Component = asChild ? Slot.Root : 'button';
    const isDisabled = disabled || loading;
    const slottedChild =
      asChild && isDisabled && React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
        ? React.cloneElement(children, {
            tabIndex: -1,
            'aria-disabled': true,
            onClick: (event) => {
              event.preventDefault();
              event.stopPropagation();
            },
          })
        : children;
    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-variant={variant === null ? undefined : (variant ?? 'primary')}
        data-size={size === null ? undefined : (size ?? 'md')}
        {...styles(
          'button.root',
          cn(buttonVariants({ variant, size }), isDisabled && 'pointer-events-none opacity-45'),
          className,
          unstyled,
        )}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...props}
        tabIndex={asChild && isDisabled ? -1 : props.tabIndex}
      >
        {asChild ? (
          slottedChild
        ) : (
          <>
            {loading && (
              <LoaderCircle
                {...styles('button.spinner', 'animate-spin', undefined, unstyled)}
                aria-hidden="true"
              />
            )}
            {children}
          </>
        )}
      </Component>
    );
  },
);
Button.displayName = 'Button';
export const badgeVariants = /* @__PURE__ */ cva(
  'inline-flex items-center gap-1.5 rounded-[var(--ui-badge-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] px-2 py-0.5 text-xs font-medium [&_svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-border bg-[var(--ui-badge-background,var(--ui-muted))] text-[var(--ui-badge-foreground,var(--ui-foreground))]',
        accent: 'border-transparent bg-accent-soft text-accent-soft-foreground',
        outline: 'border-border text-muted-foreground',
        solid: 'border-transparent bg-foreground text-background',
        destructive:
          'border-transparent bg-danger-soft text-[var(--ui-danger-soft-foreground,var(--ui-danger))]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, unstyled, ...props }: BadgeProps & PlainStyleProps) {
  const styles = useStyles();

  return (
    <span
      data-variant={variant === null ? undefined : (variant ?? 'default')}
      {...styles('badge.root', badgeVariants({ variant }), className, unstyled)}
      {...props}
    />
  );
}
export interface CardProps extends React.ComponentPropsWithoutRef<'div'>, PlainStyleProps {
  asChild?: boolean;
  variant?: 'outlined' | 'filled' | 'elevated' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  selected?: boolean;
}
export const Card = /* @__PURE__ */ React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      unstyled,
      asChild,
      variant = 'outlined',
      size = 'md',
      interactive = false,
      selected = false,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';

    return (
      <StyleProvider unstyled={unstyled}>
        <Element
          ref={ref}
          data-variant={variant}
          data-size={size}
          data-interactive={interactive || undefined}
          data-selected={selected || undefined}
          {...styles(
            'card.root',
            'ui-card rounded-[var(--ui-card-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-card-border,var(--ui-border))] bg-[var(--ui-card-background,var(--ui-surface))] text-[var(--ui-card-foreground,var(--ui-foreground))]',
            className,
            unstyled,
          )}
          {...props}
        />
      </StyleProvider>
    );
  },
);
Card.displayName = 'Card';
export function CardHeader({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <div
      {...styles('card.header', 'ui-card-header flex flex-col gap-1.5', className, unstyled)}
      {...props}
    />
  );
}
export function CardTitle({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'h3'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <h3
      {...styles('card.title', 'text-base font-semibold leading-6', className, unstyled)}
      {...props}
    />
  );
}
export function CardDescription({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'p'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <p
      {...styles(
        'card.description',
        'text-sm leading-6 text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export function CardContent({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();

  return <div {...styles('card.content', 'ui-card-content', className, unstyled)} {...props} />;
}
export function CardFooter({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <div
      {...styles(
        'card.footer',
        'ui-card-footer flex flex-wrap items-center gap-2',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export const Avatar = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  (React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: 'sm' | 'md' | 'lg';
  }) &
    PlainStyleProps
>(({ className, size = 'md', unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AvatarPrimitive.Root
      ref={ref}
      {...styles(
        'avatar.root',
        cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full border border-border',
          { sm: 'size-7 text-xs', md: 'size-9 text-xs', lg: 'size-12 text-base' }[size],
        ),
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
Avatar.displayName = 'Avatar';
export const AvatarImage = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AvatarPrimitive.Image
      ref={ref}
      {...styles('avatar.image', 'size-full object-cover', className, unstyled)}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';
export const AvatarFallback = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      {...styles(
        'avatar.fallback',
        'flex size-full items-center justify-center bg-muted font-medium text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
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
      <div
        role="alert"
        data-variant={variant}
        data-appearance={appearance}
        {...styles('alert.root', 'ui-alert', className, unstyled)}
        {...props}
      >
        {icon !== null && (
          <span {...styles('alert.icon', 'ui-alert-icon', undefined, unstyled)} aria-hidden="true">
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
      </div>
    </StyleProvider>
  );
}
export function AlertTitle({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'h3'> & PlainStyleProps) {
  const styles = useStyles();

  return <h3 {...styles('alert.title', 'font-medium leading-6', className, unstyled)} {...props} />;
}
export function AlertDescription({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <div
      {...styles(
        'alert.description',
        'ui-alert-description text-sm leading-6',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export const Separator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & PlainStyleProps
>(({ className, orientation = 'horizontal', decorative = true, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      {...styles(
        'separator.root',
        cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'),
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
Separator.displayName = 'Separator';
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, PlainStyleProps {
  size?: 'sm' | 'md' | 'lg';
  segments?: readonly ProgressSegment[];
  showLegend?: boolean;
  formatValue?: (value: number, max: number) => string;
}
export interface ProgressSegment {
  id: string;
  label: string;
  value: number;
  color?: React.CSSProperties['backgroundColor'];
}
// Keep the name assignment tree-shakable with the component and its locale formatter.
export const Progress = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    (
      {
        className,
        value,
        max = 100,
        size = 'md',
        segments,
        showLegend = true,
        formatValue,
        unstyled,
        ...props
      },
      ref,
    ) => {
      const styles = useStyles();
      const { locale } = useTranslation();

      const direction = useDirection(
        props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : undefined,
      );
      const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
      const parts = segments?.map((segment, index) => ({
        ...segment,
        value: Number.isFinite(segment.value) ? Math.max(0, segment.value) : 0,
        color: segment.color ?? `var(--ui-chart-${(index % 8) + 1})`,
      }));
      const total = parts?.reduce((sum, segment) => sum + segment.value, 0);
      const resolvedValue = total === Infinity ? safeMax : (total ?? value);
      const safeValue =
        resolvedValue == null || !Number.isFinite(resolvedValue)
          ? null
          : Math.max(0, Math.min(safeMax, resolvedValue));
      const formatter = numberFormatter(locale, { style: 'percent', maximumFractionDigits: 1 });
      const formatted = (amount: number) =>
        formatValue?.(amount, safeMax) ?? formatter.format(amount / safeMax);
      // Normalize before summing when finite allocations exceed Number.MAX_VALUE.
      const scale =
        total === Infinity ? parts!.reduce((largest, part) => Math.max(largest, part.value), 1) : 1;
      const denominator = Math.max(
        safeMax / scale,
        parts?.reduce((sum, part) => sum + part.value / scale, 0) ?? 0,
      );
      return (
        <>
          <ProgressPrimitive.Root
            ref={ref}
            dir={direction}
            value={safeValue}
            max={safeMax}
            {...(parts
              ? {
                  'aria-valuetext': parts
                    .map((part) => `${part.label}: ${formatted(part.value)}`)
                    .join('; '),
                }
              : {})}
            data-segmented={!!parts || undefined}
            {...styles(
              'progress.root',
              cn(
                'ui-progress relative w-full overflow-hidden rounded-full bg-muted',
                { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size],
              ),
              className,
              unstyled,
            )}
            {...props}
          >
            {parts ? (
              parts.map((part) => (
                <span
                  key={part.id}
                  aria-hidden="true"
                  title={`${part.label}: ${formatted(part.value)}`}
                  {...styles('progress.segment', 'ui-progress-segment', undefined, unstyled)}
                  style={{
                    width: `${(part.value / scale / denominator) * 100}%`,
                    backgroundColor: part.color,
                  }}
                />
              ))
            ) : (
              <ProgressPrimitive.Indicator
                {...styles(
                  'progress.indicator',
                  cn(
                    'ui-progress-indicator h-full rounded-full bg-accent',
                    safeValue === null && 'ui-progress-indeterminate',
                  ),
                  undefined,
                  unstyled,
                )}
                style={{
                  width: safeValue === null ? '40%' : `${(safeValue / safeMax) * 100}%`,
                  marginInlineStart: 0,
                }}
              />
            )}
          </ProgressPrimitive.Root>
          {parts && showLegend && (
            <ul {...styles('progress.legend', 'ui-progress-legend', undefined, unstyled)}>
              {parts.map((part) => (
                <li key={part.id}>
                  <span
                    aria-hidden="true"
                    {...styles('progress.swatch', 'ui-progress-swatch', undefined, unstyled)}
                    style={{ backgroundColor: part.color }}
                  />
                  <bdi>{part.label}</bdi>
                  <bdi>{formatted(part.value)}</bdi>
                </li>
              ))}
            </ul>
          )}
        </>
      );
    },
  ),
  { displayName: 'Progress' },
);
export const Skeleton = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      {...styles(
        'skeleton.root',
        'ui-skeleton h-4 w-full rounded-[var(--ui-skeleton-radius,var(--ui-radius))] bg-[var(--ui-skeleton-background,var(--ui-border))]',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
Skeleton.displayName = 'Skeleton';
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
  return (
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
    </span>
  );
}
export const AspectRatio = AspectRatioPrimitive.Root;
export function Kbd({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'kbd'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <kbd
      {...styles(
        'kbd.root',
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1 font-sans text-xs text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, PlainStyleProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'center' | 'start';
  orientation?: 'vertical' | 'horizontal';
}
export const EmptyState = /* @__PURE__ */ React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      action,
      children,
      align = 'center',
      orientation = 'vertical',
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();

    return (
      <StyleProvider unstyled={unstyled}>
        <div
          ref={ref}
          {...styles('empty-state.root', 'ui-empty-state', className, unstyled)}
          data-align={align}
          data-orientation={orientation}
          {...props}
        >
          {children ?? (
            <>
              <EmptyStateIcon>{icon ?? <Inbox size={22} aria-hidden="true" />}</EmptyStateIcon>
              <EmptyStateContent>
                {title != null && <EmptyStateTitle>{title}</EmptyStateTitle>}
                {description != null && (
                  <EmptyStateDescription>{description}</EmptyStateDescription>
                )}
                {action != null && <EmptyStateActions>{action}</EmptyStateActions>}
              </EmptyStateContent>
            </>
          )}
        </div>
      </StyleProvider>
    );
  },
);
EmptyState.displayName = 'EmptyState';
export const EmptyStateIcon = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <div
      ref={ref}
      {...styles('empty-state.icon-wrapper', 'ui-empty-state-icon', className, unstyled)}
      {...props}
    />
  );
});
EmptyStateIcon.displayName = 'EmptyStateIcon';
export const EmptyStateContent = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <div
      ref={ref}
      {...styles('empty-state.content', 'ui-empty-state-content', className, unstyled)}
      {...props}
    />
  );
});
EmptyStateContent.displayName = 'EmptyStateContent';
export const EmptyStateTitle = /* @__PURE__ */ React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <h3
      ref={ref}
      {...styles('empty-state.title', 'ui-empty-state-title', className, unstyled)}
      {...props}
    />
  );
});
EmptyStateTitle.displayName = 'EmptyStateTitle';
export const EmptyStateDescription = /* @__PURE__ */ React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <p
      ref={ref}
      {...styles('empty-state.description', 'ui-empty-state-description', className, unstyled)}
      {...props}
    />
  );
});
EmptyStateDescription.displayName = 'EmptyStateDescription';
export const EmptyStateActions = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <div
      ref={ref}
      {...styles('empty-state.action', 'ui-empty-state-actions', className, unstyled)}
      {...props}
    />
  );
});
EmptyStateActions.displayName = 'EmptyStateActions';
