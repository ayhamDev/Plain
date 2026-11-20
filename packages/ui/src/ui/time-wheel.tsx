import * as React from 'react';
import { useStyles } from './styling';
import { useMotionSettings } from './motion-policy';

type WheelOption = { value: string; label: string };
export interface TimeWheelHandle {
  consumePending: () => string | undefined;
}
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Native touch inertia; wheel deltas accumulate and commit once the gesture settles. */
export const TimeWheel = /* @__PURE__ */ React.forwardRef(function TimeWheel(
  {
    id,
    labelledBy,
    value,
    options,
    onValueChange,
  }: {
    id: string;
    labelledBy: string;
    value: string;
    options: WheelOption[];
    onValueChange: (value: string) => void;
  },
  forwardedRef: React.ForwardedRef<TimeWheelHandle>,
) {
  const styles = useStyles();
  const motion = useMotionSettings();
  const root = React.useRef<HTMLDivElement>(null);
  const viewport = React.useRef<HTMLDivElement>(null);
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [preview, setPreview] = React.useState(selected);
  const latest = React.useRef({ selected, options, onValueChange });
  const previous = React.useRef<{ value: string; signature: string } | undefined>(undefined);
  const scrolling = React.useRef(false);
  const touching = React.useRef(false);
  const dragged = React.useRef(false);
  const touchY = React.useRef(0);
  const suppressClickUntil = React.useRef(0);
  const programmatic = React.useRef<number | undefined>(undefined);
  const consumed = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const restoreFrame = React.useRef<number | undefined>(undefined);
  const signature = options.map((option) => option.value).join(',');
  const rowHeight = React.useCallback(() => {
    const row = viewport.current?.firstElementChild as HTMLElement | null;
    // Scroll offsets use layout pixels, not the popup's animated scale.
    return row
      ? parseFloat(getComputedStyle(row).blockSize || getComputedStyle(row).height) ||
          row.offsetHeight ||
          48
      : 48;
  }, []);
  const align = React.useCallback(() => {
    const index = latest.current.selected;
    scrolling.current = false;
    setPreview(index);
    if (viewport.current) {
      programmatic.current = index * rowHeight();
      viewport.current.scrollTop = programmatic.current;
      viewport.current.style.scrollSnapType = '';
    }
  }, [rowHeight]);
  useLayoutEffect(() => {
    latest.current = { selected, options, onValueChange };
    // A preview render must never reposition a live native scroll gesture.
    if (previous.current?.value !== value || previous.current?.signature !== signature) {
      previous.current = { value, signature };
      clearTimeout(timer.current);
      align();
    }
  });
  const choose = React.useCallback(
    (index: number) => {
      consumed.current = false;
      const state = latest.current;
      const next = Math.max(0, Math.min(state.options.length - 1, index));
      scrolling.current = false;
      clearTimeout(timer.current);
      setPreview(next);
      if (viewport.current) {
        programmatic.current = next * rowHeight();
        viewport.current.scrollTop = programmatic.current;
        viewport.current.style.scrollSnapType = '';
      }
      // Choosing the initial row also accepts an otherwise empty picker.
      state.onValueChange(state.options[next].value);
      // Let React accept a local change before aligning. A rejected controlled
      // proposal returns to its committed value once, after the gesture is over.
      cancelAnimationFrame(restoreFrame.current ?? 0);
      restoreFrame.current = requestAnimationFrame(() => {
        if (!scrolling.current && !touching.current) align();
      });
    },
    [align, rowHeight],
  );
  const settle = React.useCallback(() => {
    if (touching.current || !viewport.current) return;
    choose(Math.round(viewport.current.scrollTop / rowHeight()));
  }, [choose, rowHeight]);
  const schedule = React.useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, 180);
  }, [settle]);
  React.useImperativeHandle(
    forwardedRef,
    () => ({
      consumePending() {
        const dirty = scrolling.current || touching.current;
        consumed.current = true;
        scrolling.current = false;
        touching.current = false;
        clearTimeout(timer.current);
        cancelAnimationFrame(restoreFrame.current ?? 0);
        if (!dirty || !viewport.current) return undefined;
        const state = latest.current;
        const index = Math.max(
          0,
          Math.min(state.options.length - 1, Math.round(viewport.current.scrollTop / rowHeight())),
        );
        setPreview(index);
        programmatic.current = index * rowHeight();
        viewport.current.scrollTop = programmatic.current;
        viewport.current.style.scrollSnapType = '';
        return state.options[index].value;
      },
    }),
    [rowHeight],
  );
  React.useEffect(() => {
    const node = viewport.current;
    const row = node?.firstElementChild;
    if (!node || !row) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      event.preventDefault();
      consumed.current = false;
      root.current?.focus({ preventScroll: true });
      cancelAnimationFrame(restoreFrame.current ?? 0);
      const height = rowHeight();
      const delta =
        event.deltaMode === 1
          ? (event.deltaY * height) / 3
          : event.deltaMode === 2
            ? event.deltaY * height * 5
            : Math.max(-height, Math.min(height, event.deltaY));
      scrolling.current = true;
      programmatic.current = undefined;
      // CSS snapping must not swallow small trackpad deltas on each assignment.
      node.style.scrollSnapType = 'none';
      node.scrollTop = Math.max(
        0,
        Math.min((latest.current.options.length - 1) * height, node.scrollTop + delta),
      );
      setPreview(node.scrollTop / height);
      schedule();
    };
    node.addEventListener('wheel', wheel, { passive: false });
    const observer = new ResizeObserver(() => {
      if (!scrolling.current && !touching.current) align();
    });
    observer.observe(row);
    return () => {
      node.removeEventListener('wheel', wheel);
      observer.disconnect();
      clearTimeout(timer.current);
      cancelAnimationFrame(restoreFrame.current ?? 0);
    };
  }, [align, rowHeight, schedule]);
  const numeric = options.every((option) => Number.isFinite(Number(option.value)));
  return (
    <div
      ref={root}
      id={id}
      role="spinbutton"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuemin={numeric ? Number(options[0].value) : 0}
      aria-valuemax={numeric ? Number(options[options.length - 1].value) : options.length - 1}
      aria-valuenow={numeric ? Number(options[selected].value) : selected}
      aria-valuetext={options[selected].label}
      data-vaul-no-drag=""
      data-ui-motion={motion.reduced ? 'reduced' : undefined}
      {...styles('temporal.wheel', 'ui-time-wheel')}
      onKeyDown={(event) => {
        const index = latest.current.selected;
        const next =
          event.key === 'ArrowUp'
            ? index + 1
            : event.key === 'ArrowDown'
              ? index - 1
              : event.key === 'PageUp'
                ? index + 5
                : event.key === 'PageDown'
                  ? index - 5
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? options.length - 1
                      : undefined;
        if (next === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        choose(next);
      }}
    >
      <div {...styles('temporal.wheel-selection', 'ui-time-wheel-selection')} aria-hidden="true" />
      <div
        ref={viewport}
        {...styles('temporal.wheel-viewport', 'ui-time-wheel-viewport')}
        aria-hidden="true"
        onPointerDown={(event) => {
          if (event.pointerType !== 'touch') root.current?.focus({ preventScroll: true });
        }}
        onTouchStart={(event) => {
          consumed.current = false;
          touching.current = true;
          dragged.current = false;
          touchY.current = event.touches[0]?.clientY ?? 0;
          scrolling.current = true;
          programmatic.current = undefined;
          clearTimeout(timer.current);
          cancelAnimationFrame(restoreFrame.current ?? 0);
          if (viewport.current) viewport.current.style.scrollSnapType = 'none';
        }}
        onTouchMove={(event) => {
          if (Math.abs((event.touches[0]?.clientY ?? touchY.current) - touchY.current) > 6)
            dragged.current = true;
        }}
        onTouchEnd={(event) => {
          touching.current = event.touches.length > 0;
          if (dragged.current) suppressClickUntil.current = Date.now() + 350;
          if (!touching.current) schedule();
        }}
        onTouchCancel={() => {
          touching.current = false;
          suppressClickUntil.current = Date.now() + 350;
          schedule();
        }}
        onScroll={() => {
          const node = viewport.current;
          if (!node || consumed.current) return;
          if (
            programmatic.current !== undefined &&
            Math.abs(node.scrollTop - programmatic.current) < 1
          ) {
            programmatic.current = undefined;
            return;
          }
          if (
            !scrolling.current &&
            Math.abs(node.scrollTop - latest.current.selected * rowHeight()) < 1
          )
            return;
          scrolling.current = true;
          if (touching.current) dragged.current = true;
          setPreview(node.scrollTop / rowHeight());
          if (!touching.current) schedule();
        }}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            {...styles('temporal.wheel-option', 'ui-time-wheel-option')}
            data-selected={index === Math.round(preview) || undefined}
            style={
              {
                '--ui-time-wheel-offset': Math.max(-3, Math.min(3, index - preview)),
              } as React.CSSProperties
            }
            onClick={() => {
              if (Date.now() >= suppressClickUntil.current) choose(index);
            }}
          >
            <span {...styles('temporal.wheel-text', 'ui-time-wheel-text')}>{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
