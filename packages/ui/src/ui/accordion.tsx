import * as React from 'react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { ChevronDown } from 'lucide-react';
import { type LayoutPresenceProps, LayoutPresence } from './layout-presence';

export const Accordion = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<AccordionPrimitive.Root {...props} ref={ref} />, unstyled);
});

Accordion.displayName = 'Accordion';

export const AccordionItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <AccordionPrimitive.Item
      ref={ref}
      {...styles('accordion.item', 'border-b border-border last:border-b-0', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AccordionPrimitive.Header {...styles('accordion.header', 'flex', undefined, unstyled)}>
      {styles.tooltip(
        <AccordionPrimitive.Trigger
          ref={ref}
          {...styles(
            'accordion.trigger',
            'ui-interactive group flex min-h-12 flex-1 items-center justify-between gap-4 py-4 text-start text-sm font-medium hover:text-accent disabled:opacity-45',
            className,
            unstyled,
          )}
          {...props}
        >
          {children}
          <ChevronDown
            {...styles(
              'accordion.icon',
              'ui-motion-transform size-4 shrink-0 text-muted-foreground group-data-[state=open]:rotate-180',
              undefined,
              unstyled,
            )}
            aria-hidden="true"
          />
        </AccordionPrimitive.Trigger>,
        unstyled,
      )}
    </AccordionPrimitive.Header>
  );
});

AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> &
    PlainStyleProps &
    LayoutPresenceProps
>(({ className, children, unstyled, presence, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <AccordionPrimitive.Content
      ref={ref}
      {...styles('accordion.content', 'ui-accordion overflow-hidden', className, unstyled)}
      {...props}
    >
      <LayoutPresence asChild presence={presence ?? false}>
        <div
          {...styles(
            'accordion.body',
            'pb-4 text-sm leading-6 text-muted-foreground',
            undefined,
            unstyled,
          )}
        >
          {children}
        </div>
      </LayoutPresence>
    </AccordionPrimitive.Content>,
    unstyled,
  );
});

AccordionContent.displayName = 'AccordionContent';
