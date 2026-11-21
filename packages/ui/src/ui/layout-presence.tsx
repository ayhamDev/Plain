import * as React from 'react';
import { Slot } from 'radix-ui';
import { useMotionSettings } from './motion-policy';
import { useStyles, type PlainStyleProps } from './styling';

export interface LayoutPresenceOptions {
  /** Animate children on first mount. Defaults to true. */
  initial?: boolean;
  preset?: 'fade' | 'slide' | 'scale';
  /** Milliseconds; defaults to the scope's normal/fast motion tokens. */
  duration?: number;
  exitDuration?: number;
  easing?: string;
  distance?: number;
  /** Milliseconds between entrances; total delay is capped at 200ms. */
  stagger?: number;
  /** Animate changed positions on child updates. Adds batched layout measurements. */
  layout?: boolean;
  /** Bound concurrent animations and retained exits. Defaults to 50. */
  maxItems?: number;
  onExitComplete?: () => void;
}
export interface LayoutPresenceProps {
  /** Opt into keyed child entrance/exit animation, without adding DOM wrappers. */
  presence?: boolean | LayoutPresenceOptions;
}
type Item = { key: string; child: React.ReactNode; exiting: boolean };
type Snapshot = { source: React.ReactNode; enabled: boolean; items: Item[] };
type Running = { node: HTMLElement; phase: 'enter' | 'exit' | 'layout'; stop: () => void };
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const bounded = (value: number | undefined, fallback: number, maximum = 10000) =>
  Number.isFinite(value) ? Math.max(0, Math.min(maximum, value!)) : fallback;
function itemsFrom(children: React.ReactNode): Item[] {
  return React.Children.toArray(children).map((child, index) => ({
    key: React.isValidElement(child) ? String(child.key) : `text:${index}`,
    child,
    exiting: false,
  }));
}
function reconcile(previous: Item[], next: Item[], retain: boolean, limit: number) {
  if (!retain) return next;
  const keys = new Set(next.map((item) => item.key));
  const result = [...next];
  let exits = 0;
  previous.forEach((item, index) => {
    if (!keys.has(item.key) && React.isValidElement(item.child) && exits++ < limit)
      result.splice(Math.min(index, result.length), 0, { ...item, exiting: true });
  });
  return result;
}
function tokenTime(value: string, fallback: number) {
  const number = parseFloat(value);
  return Number.isFinite(number)
    ? Math.max(0, number * (value.trim().endsWith('ms') ? 1 : 1000))
    : fallback;
}
function frames(
  opacity: string,
  preset: LayoutPresenceOptions['preset'],
  distance: number,
  exit: boolean,
): Keyframe[] {
  const shown: Keyframe = { opacity };
  const hidden: Keyframe = { opacity: 0 };
  // Individual transforms leave application/engine-owned transform styles intact.
  if (preset === 'slide') {
    hidden.translate = `0 ${exit ? -distance / 2 : distance}px`;
    shown.translate = '0 0';
  } else if (preset === 'scale') {
    hidden.scale = '0.98';
    shown.scale = '1';
  }
  return exit ? [shown, hidden] : [hidden, shown];
}

/** Internal shared controller; React owns retained elements and their state throughout exit. */
export function useLayoutPresence<T extends HTMLElement>(
  children: React.ReactNode,
  presence: LayoutPresenceProps['presence'],
  forwardedRef?: React.Ref<T>,
  asChild = false,
) {
  const options = typeof presence === 'object' ? presence : {};
  const motion = useMotionSettings(!!presence);
  const enabled = !!presence && motion.enabled;
  const limit = Math.floor(bounded(options.maxItems, 50, 1000));
  const slot =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? children
      : undefined;
  const source = slot ? slot.props.children : children;
  const next = React.useMemo(() => itemsFrom(source), [source]);
  const [snapshot, setSnapshot] = React.useState<Snapshot>(() => ({
    source,
    enabled,
    items: next,
  }));
  let items = snapshot.items;
  if (snapshot.source !== source || snapshot.enabled !== enabled) {
    items = reconcile(snapshot.items, next, enabled, limit);
    setSnapshot({ source, enabled, items });
  }
  const root = React.useRef<T | null>(null);
  const activeRoot = React.useRef<T | null>(null);
  const [element, setElement] = React.useState<T | null>(null);
  const mounted = React.useRef(false);
  const seen = React.useRef(new Set<string>());
  const running = React.useRef(new Map<string, Running>());
  const positions = React.useRef(new Map<string, { x: number; y: number }>());
  const callback = React.useRef(options.onExitComplete);
  const hadExits = React.useRef(false);
  const restoreFocusTarget = React.useRef<(() => void) | undefined>(undefined);
  const committed = React.useRef<Snapshot>(snapshot);
  const complete = React.useCallback((key?: string) => {
    setSnapshot((state) => {
      // Async completions can be rebased against an earlier render-phase update.
      const latest = committed.current;
      const base =
        state.source === latest.source && state.enabled === latest.enabled ? state : latest;
      const remaining = base.items.filter(
        (item) => !item.exiting || (key !== undefined && item.key !== key),
      );
      return remaining.length === base.items.length ? base : { ...base, items: remaining };
    });
  }, []);
  const nodeRef = React.useCallback(
    (node: T | null) => {
      root.current = node;
      if (enabled) setElement(node);
    },
    [enabled],
  );
  React.useImperativeHandle(forwardedRef, () => root.current!);
  const signature = items.map((item) => `${item.key}:${item.exiting}`).join('|');
  useLayoutEffect(() => {
    callback.current = options.onExitComplete;
    committed.current = { source, enabled, items };
  });
  useLayoutEffect(() => {
    const node = root.current;
    if (activeRoot.current !== node) {
      restoreFocusTarget.current?.();
      for (const animation of running.current.values()) animation.stop();
      running.current.clear();
      mounted.current = false;
      seen.current.clear();
      positions.current.clear();
      activeRoot.current = node;
    }
    if (!node) return;
    const first = !mounted.current;
    mounted.current = true;
    const activeKeys = new Set(items.map((item) => item.key));
    const flush = () => complete();
    if (!enabled) {
      for (const animation of running.current.values()) animation.stop();
      running.current.clear();
      positions.current.clear();
      seen.current = activeKeys;
      flush();
      return;
    }
    // Read the actual preference before the first animation, including hydration.
    const reduce = node.ownerDocument.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const nodes = [...node.childNodes].filter(
      (child) => child.nodeType === 1 || child.nodeType === 3,
    );
    const canAnimate =
      enabled && !reduce && typeof node.animate === 'function' && nodes.length === items.length;
    const keyed = new Map(items.map((item) => [item.key, item]));
    let kept = 0;
    for (const [key, animation] of running.current) {
      const item = keyed.get(key);
      if (
        !canAnimate ||
        !activeKeys.has(key) ||
        (animation.phase === 'exit' && !item?.exiting) ||
        kept >= limit
      ) {
        animation.stop();
        running.current.delete(key);
        if (item?.exiting) complete(key);
      } else {
        kept++;
      }
    }
    if (!canAnimate) {
      positions.current.clear();
      seen.current = activeKeys;
      flush();
      return;
    }
    const style = getComputedStyle(node);
    const scale = bounded(parseFloat(style.getPropertyValue('--ui-motion-scale')), 1, 10);
    const duration =
      bounded(options.duration, tokenTime(style.getPropertyValue('--ui-duration-normal'), 200)) *
      scale;
    const exitDuration =
      bounded(options.exitDuration, tokenTime(style.getPropertyValue('--ui-duration-fast'), 120)) *
      scale;
    const easing =
      options.easing ??
      (style.getPropertyValue('--ui-ease-out').trim() || 'cubic-bezier(0.2, 0, 0, 1)');
    const newPositions = new Map<string, { x: number; y: number }>();
    const rootBox = options.layout ? node.getBoundingClientRect() : undefined;
    let frameReads = 0;
    // Batch geometry reads before animation writes; no per-frame React updates.
    const plans = items.map((item, index) => {
      const child = nodes[index];
      const HTMLElementType = node.ownerDocument.defaultView?.HTMLElement;
      if (!HTMLElementType || !(child instanceof HTMLElementType)) return { item };
      if (rootBox && !item.exiting) {
        const box = child.getBoundingClientRect();
        newPositions.set(item.key, {
          x: box.x - rootBox.x + node.scrollLeft,
          y: box.y - rootBox.y + node.scrollTop,
        });
      }
      const entering =
        !item.exiting && !seen.current.has(item.key) && (!first || options.initial !== false);
      const opacity =
        (item.exiting || entering) && frameReads++ < limit ? getComputedStyle(child).opacity : '1';
      return { item, child, opacity };
    });
    let entrances = 0;
    for (const { item, child, opacity } of plans) {
      if (!child) {
        if (item.exiting) complete(item.key);
        continue;
      }
      if (running.current.get(item.key)?.phase === 'exit') continue;
      const enter =
        !item.exiting && !seen.current.has(item.key) && (!first || options.initial !== false);
      const previous = positions.current.get(item.key),
        current = newPositions.get(item.key);
      const move =
        !enter &&
        !item.exiting &&
        previous &&
        current &&
        (Math.abs(previous.x - current.x) > 1 || Math.abs(previous.y - current.y) > 1);
      if (!enter && !item.exiting && !move) continue;
      const finishExit = () => complete(item.key);
      running.current.get(item.key)?.stop();
      running.current.delete(item.key);
      if (running.current.size >= limit || (item.exiting ? !exitDuration : !duration)) {
        if (item.exiting) finishExit();
        continue;
      }
      const phase = item.exiting ? 'exit' : enter ? 'enter' : 'layout';
      const ms = item.exiting ? exitDuration : duration;
      const delay = enter ? Math.min(200, entrances++ * bounded(options.stagger, 0, 1000)) : 0;
      const oldState = child.getAttribute('data-ui-presence');
      const hidden = child.getAttribute('aria-hidden'),
        inert = child.hasAttribute('inert');
      const pointerEvents = child.style.pointerEvents;
      const disabled: { node: HTMLInputElement; value: boolean }[] = [];
      if (item.exiting) {
        hadExits.current = true;
        if (child.contains(child.ownerDocument.activeElement)) {
          const tabindex = node.getAttribute('tabindex');
          if (tabindex === null) {
            node.setAttribute('tabindex', '-1');
            const restore = () => {
              node.removeEventListener('blur', restore);
              if (node.getAttribute('tabindex') === '-1') node.removeAttribute('tabindex');
              restoreFocusTarget.current = undefined;
            };
            node.addEventListener('blur', restore, { once: true });
            restoreFocusTarget.current = restore;
          }
          node.focus({ preventScroll: true });
        }
        child.setAttribute('aria-hidden', 'true');
        child.setAttribute('inert', '');
        child.style.pointerEvents = 'none';
        const selector = 'button,input,select,textarea,fieldset,option,optgroup';
        const controls = [
          ...(child.matches(selector) ? [child] : []),
          ...child.querySelectorAll(selector),
        ];
        for (const control of controls) {
          const field = control as HTMLInputElement;
          disabled.push({ node: field, value: field.disabled });
          field.disabled = true;
        }
      }
      child.setAttribute('data-ui-presence', phase);
      let animation: Animation | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let stopped = false;
      const stop = () => {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        animation?.cancel();
        if (oldState === null) child.removeAttribute('data-ui-presence');
        else child.setAttribute('data-ui-presence', oldState);
        if (item.exiting) {
          if (hidden === null) child.removeAttribute('aria-hidden');
          else child.setAttribute('aria-hidden', hidden);
          if (!inert) child.removeAttribute('inert');
          child.style.pointerEvents = pointerEvents;
          for (const field of disabled) field.node.disabled = field.value;
        }
      };
      let completed = false;
      const done = () => {
        if (stopped || completed) return;
        completed = true;
        clearTimeout(timer);
        if (item.exiting) {
          // Keep the leaving node inert (and out of forms) until React removes it.
          finishExit();
        } else {
          stop();
          running.current.delete(item.key);
        }
      };
      running.current.set(item.key, { node: child, phase, stop });
      try {
        animation = child.animate(
          move
            ? [
                { translate: `${previous!.x - current!.x}px ${previous!.y - current!.y}px` },
                { translate: '0 0' },
              ]
            : frames(
                opacity ?? '1',
                options.preset ?? 'fade',
                bounded(options.distance, 8, 100),
                item.exiting,
              ),
          { duration: ms, delay, easing, fill: 'both' },
        );
        void animation.finished.then(done, done);
        timer = setTimeout(done, ms + delay + 80);
      } catch {
        done();
      }
    }
    seen.current = activeKeys;
    positions.current = newPositions;
    // Only child membership/order or motion settings schedule work, never each animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    signature,
    enabled,
    element,
    options.initial,
    options.preset,
    options.duration,
    options.exitDuration,
    options.easing,
    options.distance,
    options.stagger,
    options.layout,
    limit,
  ]);
  useLayoutEffect(() => {
    if (hadExits.current && !items.some((item) => item.exiting)) {
      hadExits.current = false;
      callback.current?.();
    }
  });
  useLayoutEffect(
    () => () => {
      restoreFocusTarget.current?.();
      for (const animation of running.current.values()) animation.stop();
      running.current.clear();
      mounted.current = false;
      seen.current.clear();
      positions.current.clear();
    },
    [],
  );
  // Preserve an absent children prop on void elements used through asChild.
  const rendered = !items.length && source == null ? source : items.map((item) => item.child);
  return {
    ref: nodeRef,
    children: slot ? React.cloneElement(slot, undefined, rendered) : rendered,
  };
}

export type LayoutPresenceContainerProps = React.HTMLAttributes<HTMLDivElement> &
  LayoutPresenceProps &
  PlainStyleProps & { asChild?: boolean };
/** Give any native/ref-forwarding container the same keyed-child behavior. */
export const LayoutPresence = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  LayoutPresenceContainerProps
>(({ children, presence = true, asChild, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const scope = useLayoutPresence(children, presence, ref, asChild);
  const Element = asChild ? Slot.Root : 'div';
  return styles.tooltip(
    <Element {...props} ref={scope.ref}>
      {scope.children}
    </Element>,
    unstyled,
  );
});
LayoutPresence.displayName = 'LayoutPresence';
