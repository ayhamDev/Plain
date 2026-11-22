import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import { type LayoutPresenceProps, useLayoutPresence } from './layout-presence';

export const Collapsible = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> &
    PlainStyleProps &
    LayoutPresenceProps
>(({ className, children, unstyled, presence, asChild, ...props }, ref) => {
  const styles = useStyles();
  const scope = useLayoutPresence(children, presence, ref, asChild);

  return (
    <StyleProvider unstyled={unstyled}>
      {styles.tooltip(
        <CollapsiblePrimitive.Root
          ref={scope.ref}
          asChild={asChild}
          {...styles('collapsible.root', '', className, unstyled)}
          {...props}
        >
          {scope.children}
        </CollapsiblePrimitive.Root>,
        unstyled,
      )}
    </StyleProvider>
  );
});

Collapsible.displayName = 'Collapsible';

export const CollapsibleTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <CollapsiblePrimitive.Trigger
      ref={ref}
      {...styles('collapsible.trigger', 'ui-interactive', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export const CollapsibleContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> &
    PlainStyleProps &
    LayoutPresenceProps
>(({ className, unstyled, presence, children, asChild, ...props }, ref) => {
  const styles = useStyles();
  const scope = useLayoutPresence(children, presence, ref, asChild);

  return styles.tooltip(
    <CollapsiblePrimitive.Content
      ref={scope.ref}
      children={scope.children}
      asChild={asChild}
      {...styles('collapsible.content', 'ui-collapsible overflow-hidden', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

CollapsibleContent.displayName = 'CollapsibleContent';
