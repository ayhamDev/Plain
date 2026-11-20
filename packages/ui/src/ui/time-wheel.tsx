import * as React from 'react';
import { useStyles } from './styling';
import { useMotionSettings } from './motion-policy';

type WheelOption = { value: string; label: string };
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Internal time column: native scrolling supplies touch inertia and CSS snap points. */
export function TimeWheel({
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
}) {
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
  const proposed = React.useRef(selected);
  const scrolling = React.useRef(false);
  const initialized = React.useRef(false);
  const previousOptions = React.useRef('');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const signature = options.map((option) => option.value).join(',');
  const rowHeight = React.useCallback(
    () => (viewport.current?.firstElementChild as HTMLElement | null)?.offsetHeight || 48,
    [],
  );
  const align = React.useCallback(() => {
    const index = latest.current.selected;
    proposed.current = index;
    setPreview(index);
    if (viewport.current) viewport.current.scrollTop = index * rowHeight();
  }, [rowHeight]);
  useLayoutEffect(() => {
    latest.current = { selected, options, onValueChange };
    const followingScroll =
      initialized.current &&
      scrolling.current &&
      proposed.current === selected &&
      previousOptions.current === signature;
    previousOptions.current = signature;
    initialized.current = true;
    if (!followingScroll) align();
  });
  React.useEffect(() => {
    const node = viewport.current?.firstElementChild;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      if (!scrolling.current) align();
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimeout(timer.current);
    };
  }, [align]);
  const choose = (index: number) => {
    const state = latest.current;
    const next = Math.max(0, Math.min(state.options.length - 1, index));
    scrolling.current = false;
    clearTimeout(timer.current);
    proposed.current = next;
    setPreview(next);
    if (next !== state.selected) state.onValueChange(state.options[next].value);
    // Controlled proposals remain at the committed value until their parent accepts them.
    if (viewport.current) viewport.current.scrollTop = latest.current.selected * rowHeight();
  };
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
        onScroll={() => {
          const node = viewport.current;
          if (!node) return;
          const state = latest.current;
          const next = Math.max(
            0,
            Math.min(state.options.length - 1, Math.round(node.scrollTop / rowHeight())),
          );
          scrolling.current = true;
          setPreview(next);
          if (next !== proposed.current) {
            proposed.current = next;
            if (next !== state.selected) state.onValueChange(state.options[next].value);
          }
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            scrolling.current = false;
            align();
          }, 160);
        }}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            {...styles('temporal.wheel-option', 'ui-time-wheel-option')}
            data-selected={index === selected || undefined}
            style={
              {
                '--ui-time-wheel-offset': Math.max(-3, Math.min(3, index - preview)),
              } as React.CSSProperties
            }
            onClick={() => choose(index)}
          >
            <span {...styles('temporal.wheel-text', 'ui-time-wheel-text')}>{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
