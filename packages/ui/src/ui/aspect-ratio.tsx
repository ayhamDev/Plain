import * as React from 'react';
import { AspectRatio as AspectRatioPrimitive } from 'radix-ui';
import { type LayoutPresenceProps, useLayoutPresence } from './layout-presence';
import { type PlainStyleProps, useStyles } from './style-context';

export type AspectRatioProps = React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> &
  LayoutPresenceProps &
  PlainStyleProps;

export const AspectRatio = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<HTMLDivElement, AspectRatioProps>(
    ({ presence, children, asChild, unstyled, ...props }, ref) => {
      const styles = useStyles();
      const scope = useLayoutPresence(children, presence, ref, asChild);
      return styles.tooltip(
        <AspectRatioPrimitive.Root {...props} asChild={asChild} ref={scope.ref}>
          {scope.children}
        </AspectRatioPrimitive.Root>,
        unstyled,
      );
    },
  ),
  { displayName: 'AspectRatio' },
);
