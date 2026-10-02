import * as React from 'react';

export type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'error';
export interface ElasticScrollOptions {
  elastic?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshThreshold?: number;
  onRefreshError?: (error: unknown) => void;
}
export function useElasticScroll(
  viewport: React.RefObject<HTMLDivElement | null>,
  content: React.RefObject<HTMLDivElement | null>,
  { elastic, onRefresh, refreshThreshold = 72, onRefreshError }: ElasticScrollOptions,
) {
  const [state, setState] = React.useState<RefreshState>('idle');
  const callbacks = React.useRef({ onRefresh, onRefreshError });
  React.useEffect(() => {
    callbacks.current = { onRefresh, onRefreshError };
  }, [onRefresh, onRefreshError]);
  const refreshable = !!onRefresh;
  const busy = React.useRef(false);
  const mounted = React.useRef(true);
  const refresh = React.useCallback(async () => {
    if (busy.current || !callbacks.current.onRefresh) return;
    busy.current = true;
    setState('refreshing');
    content.current?.style.setProperty('--ui-elastic-offset', '40px');
    content.current?.setAttribute('data-settling', '');
    try {
      await callbacks.current.onRefresh();
      if (mounted.current) setState('idle');
    } catch (error) {
      callbacks.current.onRefreshError?.(error);
      if (mounted.current) setState('error');
    } finally {
      busy.current = false;
      content.current?.style.setProperty('--ui-elastic-offset', '0px');
    }
  }, [content]);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  React.useEffect(() => {
    const root = viewport.current;
    const body = content.current;
    if (!root || !body || (!elastic && !refreshable)) return;
    let origin: { x: number; y: number; edge: 'top' | 'bottom' } | null = null;
    let distance = 0;
    let frame = 0;
    let phase: RefreshState = 'idle';
    const threshold = Math.max(24, refreshThreshold);
    const phaseChange = (next: RefreshState) => {
      if (phase !== next) {
        phase = next;
        setState(next);
      }
    };
    const reset = () => {
      origin = null;
      distance = 0;
      cancelAnimationFrame(frame);
      body.setAttribute('data-settling', '');
      body.style.setProperty('--ui-elastic-offset', '0px');
      if (!busy.current) phaseChange('idle');
    };
    const start = (event: TouchEvent) => {
      if (busy.current || event.touches.length !== 1) {
        origin = null;
        return;
      }
      let target = event.target as HTMLElement | null;
      while (target && target !== root) {
        if (
          target.scrollHeight > target.clientHeight + 1 &&
          /(auto|scroll)/.test(getComputedStyle(target).overflowY)
        )
          return;
        target = target.parentElement;
      }
      const edge =
        root.scrollTop <= 0
          ? 'top'
          : root.scrollTop + root.clientHeight >= root.scrollHeight - 1
            ? 'bottom'
            : null;
      if (!edge || (edge === 'bottom' && !elastic)) return;
      origin = { x: event.touches[0].clientX, y: event.touches[0].clientY, edge };
      distance = 0;
    };
    const move = (event: TouchEvent) => {
      if (!origin) return;
      if (event.touches.length !== 1) {
        reset();
        return;
      }
      const dy = event.touches[0].clientY - origin.y;
      const dx = event.touches[0].clientX - origin.x;
      if (Math.abs(dx) > Math.abs(dy) || (origin.edge === 'top' ? dy < 0 : dy > 0)) {
        reset();
        return;
      }
      if (!event.cancelable) return;
      event.preventDefault();
      distance = Math.sign(dy) * Math.min(threshold + 32, Math.abs(dy) * 0.45);
      body.removeAttribute('data-settling');
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        body.style.setProperty('--ui-elastic-offset', `${distance}px`),
      );
      if (origin.edge === 'top' && callbacks.current.onRefresh)
        phaseChange(distance >= threshold ? 'ready' : 'pulling');
    };
    const end = () => {
      const ready = origin?.edge === 'top' && distance >= threshold && callbacks.current.onRefresh;
      reset();
      if (ready) void refresh();
    };
    root.addEventListener('touchstart', start, { passive: true });
    root.addEventListener('touchmove', move, { passive: false });
    root.addEventListener('touchend', end);
    root.addEventListener('touchcancel', reset);
    return () => {
      cancelAnimationFrame(frame);
      body.style.removeProperty('--ui-elastic-offset');
      root.removeEventListener('touchstart', start);
      root.removeEventListener('touchmove', move);
      root.removeEventListener('touchend', end);
      root.removeEventListener('touchcancel', reset);
    };
  }, [viewport, content, elastic, refreshable, refreshThreshold, refresh]);
  return { state, refresh };
}
