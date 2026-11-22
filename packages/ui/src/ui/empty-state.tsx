import * as React from 'react';
import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import { Inbox } from 'lucide-react';
import { Slot } from 'radix-ui';

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, PlainStyleProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Replaces the default icon with arbitrary media. Null hides the media. */
  media?: React.ReactNode;
  /** Any number of buttons, links or custom actions. Takes precedence over action. */
  actions?: React.ReactNode;
  /** @deprecated Prefer actions. Retained for backwards compatibility. */
  action?: React.ReactNode;
  footer?: React.ReactNode;
  align?: 'center' | 'start';
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'outlined';
}

export const EmptyState = /* @__PURE__ */ React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      media,
      action,
      actions,
      footer,
      children,
      align = 'center',
      orientation = 'vertical',
      size = 'md',
      variant = 'default',
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const resolvedActions = actions !== undefined ? actions : action;

    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
          <div
            ref={ref}
            {...styles('empty-state.root', 'ui-empty-state', className, unstyled)}
            data-align={align}
            data-orientation={orientation}
            data-size={size}
            data-variant={variant}
            {...props}
          >
            {children ?? (
              <>
                {media !== undefined ? (
                  media != null && media !== false ? (
                    <EmptyStateMedia>{media}</EmptyStateMedia>
                  ) : null
                ) : icon !== null && icon !== false ? (
                  <EmptyStateIcon>{icon ?? <Inbox size={22} aria-hidden="true" />}</EmptyStateIcon>
                ) : null}
                <EmptyStateContent>
                  {title != null && <EmptyStateTitle>{title}</EmptyStateTitle>}
                  {description != null && (
                    <EmptyStateDescription>{description}</EmptyStateDescription>
                  )}
                  {resolvedActions != null && resolvedActions !== false && (
                    <EmptyStateActions>{resolvedActions}</EmptyStateActions>
                  )}
                  {footer != null && footer !== false && (
                    <EmptyStateFooter>{footer}</EmptyStateFooter>
                  )}
                </EmptyStateContent>
              </>
            )}
          </div>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export interface EmptyStateMediaProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  variant?: 'plain' | 'icon';
  shape?: 'rounded' | 'circle' | 'square';
}

/** An unframed illustration by default; icon adds the standard neutral container. */
export const EmptyStateMedia = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  EmptyStateMediaProps
>(({ className, unstyled, variant = 'plain', shape = 'rounded', ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <div
      ref={ref}
      {...styles('empty-state.media', 'ui-empty-state-media', className, unstyled)}
      data-variant={variant}
      data-shape={shape}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateMedia.displayName = 'EmptyStateMedia';

export const EmptyStateIcon = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <div
      ref={ref}
      {...styles('empty-state.icon-wrapper', 'ui-empty-state-icon', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateIcon.displayName = 'EmptyStateIcon';

export const EmptyStateContent = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <div
      ref={ref}
      {...styles('empty-state.content', 'ui-empty-state-content', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateContent.displayName = 'EmptyStateContent';

export const EmptyStateTitle = /* @__PURE__ */ React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & PlainStyleProps & { asChild?: boolean }
>(({ className, unstyled, asChild, ...props }, ref) => {
  const styles = useStyles();
  const Element = asChild ? Slot.Root : 'h3';

  return styles.tooltip(
    <Element
      ref={ref}
      {...styles('empty-state.title', 'ui-empty-state-title', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateTitle.displayName = 'EmptyStateTitle';

export const EmptyStateDescription = /* @__PURE__ */ React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & PlainStyleProps & { asChild?: boolean }
>(({ className, unstyled, asChild, ...props }, ref) => {
  const styles = useStyles();
  const Element = asChild ? Slot.Root : 'p';

  return styles.tooltip(
    <Element
      ref={ref}
      {...styles('empty-state.description', 'ui-empty-state-description', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateDescription.displayName = 'EmptyStateDescription';

export interface EmptyStateActionsProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  layout?: 'row' | 'column';
  align?: 'inherit' | 'start' | 'center' | 'end';
}

export const EmptyStateActions = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  EmptyStateActionsProps
>(({ className, unstyled, layout = 'row', align = 'inherit', ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <div
      ref={ref}
      {...styles(
        'empty-state.action',
        'ui-empty-state-actions [&_button]:whitespace-normal [&_a]:whitespace-normal',
        className,
        unstyled,
      )}
      data-layout={layout}
      data-align={align}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateActions.displayName = 'EmptyStateActions';

export const EmptyStateFooter = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <div
      ref={ref}
      {...styles('empty-state.footer', 'ui-empty-state-footer', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

EmptyStateFooter.displayName = 'EmptyStateFooter';
