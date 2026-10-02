import * as React from 'react';
import {
  LazyMotion,
  MotionConfig,
  AnimatePresence,
  m,
  type HTMLMotionProps,
  type Variants,
} from 'motion/react';
import { useMotionSettings } from './motion-policy';
import { useStyles, type PlainStyleProps } from './styling';

const loadFeatures = () => import('./motion-features').then((module) => module.default);
export const motionPresets = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slide: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
} satisfies Record<string, Variants>;
export const springPresets = {
  gentle: { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 },
  snappy: { type: 'spring', stiffness: 420, damping: 36, mass: 0.7 },
} as const;

export function MotionProvider({
  children,
  duration = 0.2,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const { enabled } = useMotionSettings();
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig
        reducedMotion={enabled ? 'never' : 'always'}
        transition={{ duration: enabled ? duration : 0, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
export type MotionProps = HTMLMotionProps<'div'> &
  PlainStyleProps & { preset?: keyof typeof motionPresets };
export const Motion = React.forwardRef<HTMLDivElement, MotionProps>(
  ({ preset = 'fade', initial, animate, exit, transition, className, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const { enabled } = useMotionSettings();
    const variants = motionPresets[preset];
    return (
      <m.div
        ref={ref}
        {...styles('motion.root', '', className, unstyled)}
        initial={enabled ? (initial ?? variants.initial) : false}
        animate={animate ?? variants.animate}
        exit={enabled ? (exit ?? variants.exit) : undefined}
        transition={enabled ? transition : { duration: 0 }}
        {...props}
      />
    );
  },
);
Motion.displayName = 'Motion';
export const Presence = AnimatePresence;
