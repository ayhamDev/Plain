import * as React from 'react';
import { useMotionSettings } from './motion-policy';
import type { TextDirection } from './styling';

/** Desktop wheel feedback only. Native scrolling owns the scroll position. */
export function useScrollAreaElastic(
  viewport: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  orientation: 'vertical' | 'horizontal' | 'both',
  direction: TextDirection,
) {
  const { reduced } = useMotionSettings();
  const receive = React.useRef<((event: React.WheelEvent<HTMLDivElement>) => void) | null>(null);
  const onWheel = React.useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    receive.current?.(event);
  }, []);

  React.useEffect(() => {
    const node = viewport.current;
    if (!node || !enabled || reduced) return;
    const desktop = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    let active = false;
    let frame = 0;
    let last = 0;
    let x = 0,
      y = 0,
      vx = 0,
      vy = 0;
    let pending: React.WheelEvent<HTMLDivElement>[] = [];
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = last = x = y = vx = vy = 0;
      pending = [];
      node.style.removeProperty('--ui-scroll-elastic-x');
      node.style.removeProperty('--ui-scroll-elastic-y');
      node.removeAttribute('data-elastic-active');
    };
    const sync = () => {
      active = desktop.matches;
      node.toggleAttribute('data-elastic', active);
      if (!active) reset();
    };
    const nested = (target: EventTarget | null) => {
      let element = target instanceof Element ? target : null;
      while (element && element !== node) {
        if (
          element.matches(
            '[data-radix-scroll-area-viewport], textarea, select, input[type="number"], [data-no-elastic]',
          )
        )
          return true;
        if (
          element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1
        ) {
          const css = getComputedStyle(element);
          if (/(auto|scroll)/.test(`${css.overflowX} ${css.overflowY}`)) return true;
        }
        element = element.parentElement;
      }
      return false;
    };
    const pull = (value: number, delta: number, limit: number) =>
      limit > 0
        ? value -
          Math.sign(delta) *
            (limit - Math.abs(value)) *
            (1 - Math.exp((-Math.abs(delta) * 0.12) / limit))
        : 0;
    // Critically damped return, integrated analytically so timing survives frame-rate changes.
    const spring = (value: number, velocity: number, dt: number) => {
      const omega = 22;
      const decay = Math.exp(-omega * dt);
      const c = velocity + omega * value;
      const next = (value + c * dt) * decay;
      const speed = (velocity - omega * c * dt) * decay;
      return Math.sign(next) !== Math.sign(value) || (Math.abs(next) < 0.1 && Math.abs(speed) < 1)
        ? [0, 0]
        : [next, speed];
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(64, now - last) / 1000 : 0;
      last = now;
      const maxX = Math.max(0, node.scrollWidth - node.clientWidth);
      const maxY = Math.max(0, node.scrollHeight - node.clientHeight);
      const atX = Math.max(
        0,
        Math.min(maxX, direction === 'rtl' ? maxX + node.scrollLeft : node.scrollLeft),
      );
      const atY = Math.max(0, Math.min(maxY, node.scrollTop));
      // Keyboard, scrollbar and programmatic scrolling must not leave content displaced.
      if ((x > 0 && atX > 1) || (x < 0 && maxX - atX > 1)) x = vx = 0;
      if ((y > 0 && atY > 1) || (y < 0 && maxY - atY > 1)) y = vy = 0;
      for (const event of pending) {
        if (
          event.defaultPrevented ||
          event.nativeEvent.defaultPrevented ||
          event.ctrlKey ||
          event.metaKey ||
          nested(event.target)
        )
          continue;
        let dx = event.deltaX,
          dy = event.deltaY;
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue;
        if (event.shiftKey && !dx) {
          dx = dy;
          dy = 0;
        }
        if (event.deltaMode === 1) {
          const css = getComputedStyle(node);
          const line = parseFloat(css.lineHeight) || (parseFloat(css.fontSize) || 16) * 1.2;
          dx *= line;
          dy *= line;
        } else if (event.deltaMode === 2) {
          dx *= node.clientWidth;
          dy *= node.clientHeight;
        }
        if (x * dx > 0) x = vx = 0;
        if (y * dy > 0) y = vy = 0;
        if (
          orientation !== 'vertical' &&
          maxX > 1 &&
          ((atX <= 1 && dx < 0) || (maxX - atX <= 1 && dx > 0))
        ) {
          x = pull(x, dx, Math.min(20, node.clientWidth / 10));
          vx = 0;
        }
        if (
          orientation !== 'horizontal' &&
          maxY > 1 &&
          ((atY <= 1 && dy < 0) || (maxY - atY <= 1 && dy > 0))
        ) {
          y = pull(y, dy, Math.min(20, node.clientHeight / 10));
          vy = 0;
        }
      }
      pending = [];
      [x, vx] = spring(x, vx, dt);
      [y, vy] = spring(y, vy, dt);
      node.style.setProperty('--ui-scroll-elastic-x', `${x.toFixed(3)}px`);
      node.style.setProperty('--ui-scroll-elastic-y', `${y.toFixed(3)}px`);
      node.toggleAttribute('data-elastic-active', !!(x || y));
      if (x || y) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    receive.current = (event) => {
      if (!active || event.ctrlKey || event.metaKey) return;
      // Defer until React's viewport AND root handlers have had a chance to cancel.
      pending.push(event);
      schedule();
    };
    const scroll = () => {
      if (x || y) schedule();
    };
    sync();
    desktop.addEventListener('change', sync);
    node.addEventListener('scroll', scroll, { passive: true });
    node.addEventListener('keydown', reset);
    node.addEventListener('focusin', reset);
    return () => {
      receive.current = null;
      reset();
      node.removeAttribute('data-elastic');
      desktop.removeEventListener('change', sync);
      node.removeEventListener('scroll', scroll);
      node.removeEventListener('keydown', reset);
      node.removeEventListener('focusin', reset);
    };
  }, [viewport, enabled, orientation, direction, reduced]);
  return onWheel;
}
