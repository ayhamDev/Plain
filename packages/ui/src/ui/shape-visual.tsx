import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { SHAPE_PATHS, type ShapeName } from './shape-geometry';
import { useMotionSettings } from './motion-policy';

export interface ShapeProps extends React.SVGProps<SVGSVGElement>, PlainStyleProps {
  shape?: ShapeName;
  size?: number | string;
  /** Animate shape changes with the shared motion policy. */
  morph?: boolean;
}

export const Shape = /* @__PURE__ */ React.forwardRef<SVGSVGElement, ShapeProps>(
  (
    { shape = 'circle', size = 48, morph = true, className, style, unstyled, children, ...props },
    ref,
  ) => {
    const styles = useStyles();
    const motion = useMotionSettings(morph);
    const named = !!(props['aria-label'] || props['aria-labelledby']);
    const path = SHAPE_PATHS[shape];
    return styles.tooltip(
      <svg
        ref={ref}
        viewBox="0 0 100 100"
        fill="currentColor"
        focusable="false"
        role={named ? 'img' : undefined}
        aria-hidden={named ? undefined : true}
        data-shape={shape}
        data-morph={(morph && motion.enabled) || undefined}
        {...styles('shape.root', 'ui-shape', className, unstyled)}
        {...props}
        style={{ width: size, height: size, ...style }}
      >
        {children}
        <path
          d={path}
          {...styles('shape.path', 'ui-shape-path', undefined, unstyled)}
          style={{ d: `path('${path}')` } as React.CSSProperties}
        />
      </svg>,
      unstyled,
    );
  },
);
Shape.displayName = 'Shape';

export const ShapedIcon = Shape;
export type ShapedIconProps = ShapeProps;
