import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { cn } from './utils';

export const Avatar = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  (React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: 'sm' | 'md' | 'lg';
  }) &
    PlainStyleProps
>(({ className, size = 'md', unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    />,
    unstyled,
  );
});

Avatar.displayName = 'Avatar';

export const AvatarImage = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <AvatarPrimitive.Image
      ref={ref}
      {...styles('avatar.image', 'size-full object-cover', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <AvatarPrimitive.Fallback
      ref={ref}
      {...styles(
        'avatar.fallback',
        'flex size-full items-center justify-center bg-muted font-medium text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

AvatarFallback.displayName = 'AvatarFallback';
