import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { type PlainStyleProps, useStyles } from './style-context';
import { Shape } from './shape-visual';
import { type ShapeName, getShapeClipPath } from './shape-geometry';
import { useMotionSettings } from './motion-policy';

interface ShapedSurfaceProps {
  shape?: ShapeName;
  size?: number | string;
  morph?: boolean;
}

export interface ShapedContainerProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps, ShapedSurfaceProps {}
/** Clip decorative content; use ShapedButton to keep interactive focus outside the shape. */
export const ShapedContainer = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  ShapedContainerProps
>(({ shape = 'cookie6', size = 160, morph = true, className, style, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <div
      ref={ref}
      data-shape={shape}
      data-morph={morph || undefined}
      {...styles('shaped-container.root', 'ui-shaped-container', className, unstyled)}
      {...props}
      style={{ width: size, height: size, clipPath: getShapeClipPath(shape), ...style }}
    />,
    unstyled,
  );
});
ShapedContainer.displayName = 'ShapedContainer';

export interface ShapedImageProps
  extends
    Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'size' | 'alt'>,
    PlainStyleProps,
    ShapedSurfaceProps {
  alt: string;
}
export const ShapedImage = /* @__PURE__ */ React.forwardRef<HTMLImageElement, ShapedImageProps>(
  (
    { shape = 'cookie6', size = 160, morph = true, className, style, unstyled, alt, ...props },
    ref,
  ) => {
    const styles = useStyles();
    const motion = useMotionSettings(morph);
    return styles.tooltip(
      <img
        ref={ref}
        alt={alt}
        data-shape={shape}
        data-morph={(morph && motion.enabled) || undefined}
        {...styles('shaped-image.root', 'ui-shaped-image', className, unstyled)}
        {...props}
        style={{ width: size, height: size, clipPath: getShapeClipPath(shape), ...style }}
      />,
      unstyled,
    );
  },
);
ShapedImage.displayName = 'ShapedImage';

export interface ShapedButtonProps extends Omit<ButtonProps, 'asChild' | 'size' | 'variant'> {
  shape?: ShapeName;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  morph?: boolean;
}
export const ShapedButton = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, ShapedButtonProps>(
  (
    {
      shape = 'cookie6',
      size = 'md',
      variant = 'primary',
      morph = true,
      children,
      className,
      style,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const motion = useMotionSettings(morph);
    const dimension = { sm: 44, md: 56, lg: 72 }[size];
    return (
      <Button
        ref={ref}
        variant={variant}
        unstyled={unstyled}
        data-shape={shape}
        data-morph={(morph && motion.enabled) || undefined}
        {...styles('shaped-button.root', 'ui-shaped-button', className, unstyled)}
        {...props}
        style={{
          width: dimension,
          height: dimension,
          padding: 0,
          borderColor: 'transparent',
          borderRadius: 0,
          background: 'transparent',
          ...style,
        }}
      >
        <Shape
          shape={shape}
          size="100%"
          morph={morph}
          unstyled={unstyled}
          {...styles(
            'shaped-button.background',
            'ui-shaped-button-background',
            undefined,
            unstyled,
          )}
        />
        <span {...styles('shaped-button.content', 'ui-shaped-button-content', undefined, unstyled)}>
          {children}
        </span>
      </Button>
    );
  },
);
ShapedButton.displayName = 'ShapedButton';
export const ShapedIconButton = ShapedButton;
export type ShapedIconButtonProps = ShapedButtonProps;

export interface ShapedBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, PlainStyleProps {
  shape?: ShapeName;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'solid' | 'outline';
  morph?: boolean;
}
export const ShapedBadge = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ShapedBadgeProps>(
  (
    {
      shape = 'cookie6',
      size = 'md',
      variant = 'default',
      morph = true,
      className,
      style,
      unstyled,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const dimension = { sm: 32, md: 48, lg: 64 }[size];
    return styles.tooltip(
      <span
        ref={ref}
        data-shape={shape}
        data-variant={variant}
        data-morph={morph || undefined}
        {...styles('shaped-badge.root', 'ui-shaped-badge', className, unstyled)}
        {...props}
        style={{ width: dimension, height: dimension, ...style }}
      >
        <Shape
          shape={shape}
          size="100%"
          morph={morph}
          unstyled={unstyled}
          {...styles('shaped-badge.background', 'ui-shaped-badge-background', undefined, unstyled)}
        />
        <span {...styles('shaped-badge.content', 'ui-shaped-badge-content', undefined, unstyled)}>
          {children}
        </span>
      </span>,
      unstyled,
    );
  },
);
ShapedBadge.displayName = 'ShapedBadge';
