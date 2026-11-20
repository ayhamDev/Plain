import * as React from 'react';
import type { TextDirection } from './styling';

export type ScrollAreaFadeEdge = 'top' | 'bottom' | 'start' | 'end';
export interface ScrollAreaFadeOptions {
  /** Defaults to the scrolling axes. Start/end follow the text direction. */
  edges?: readonly ScrollAreaFadeEdge[];
  /** Fade distance. Numbers are pixels; CSS lengths such as rem are supported. */
  size?: number | string;
  /** 0 keeps the edge opaque; 1 fades it completely. Defaults to 1. */
  intensity?: number;
  /** Scroll-aware by default; always keeps the configured edges faded. */
  mode?: 'scroll' | 'always';
  /** Scroll boundary tolerance in pixels. Defaults to 1. */
  threshold?: number;
}

export function scrollAreaLength(value: number | string | undefined) {
  return typeof value === 'number'
    ? Number.isFinite(value)
      ? `${Math.max(0, value)}px`
      : undefined
    : value || undefined;
}
export function fadeIntensity(value: number | undefined) {
  return value === undefined
    ? undefined
    : Number.isFinite(value)
      ? Math.max(0, Math.min(1, value))
      : 1;
}
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const edges = ['top', 'bottom', 'start', 'end'] as const;

/** Scroll events schedule one measurement, with DOM writes only at edge changes. */
export function useScrollAreaFades(
  viewport: React.RefObject<HTMLDivElement | null>,
  content: React.RefObject<HTMLDivElement | null>,
  direction: TextDirection,
  enabled: boolean,
  edgeKey: string,
  mode: 'scroll' | 'always',
  threshold: number,
) {
  useLayoutEffect(() => {
    const node = viewport.current;
    const body = content.current;
    if (!node || !body || !enabled) return;
    const selected = new Set(edgeKey.split(' '));
    const clear = () => edges.forEach((edge) => node.removeAttribute(`data-fade-${edge}`));
    if (mode === 'always') {
      edges.forEach((edge) => node.toggleAttribute(`data-fade-${edge}`, selected.has(edge)));
      return clear;
    }
    let frame = 0;
    let previous = -1;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const maxX = Math.max(0, node.scrollWidth - node.clientWidth);
      const maxY = Math.max(0, node.scrollHeight - node.clientHeight);
      const x = Math.min(
        maxX,
        Math.max(0, direction === 'rtl' ? -node.scrollLeft : node.scrollLeft),
      );
      const y = Math.min(maxY, Math.max(0, node.scrollTop));
      const available = [y > threshold, maxY - y > threshold, x > threshold, maxX - x > threshold];
      const next = edges.reduce(
        (bits, edge, index) => bits | (selected.has(edge) && available[index] ? 1 << index : 0),
        0,
      );
      if (next === previous) return;
      previous = next;
      edges.forEach((edge, index) =>
        node.toggleAttribute(`data-fade-${edge}`, !!(next & (1 << index))),
      );
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
    resize?.observe(node);
    resize?.observe(body);
    const mutations = new MutationObserver(schedule);
    mutations.observe(body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });
    node.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutations.disconnect();
      node.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      clear();
    };
  }, [viewport, content, direction, enabled, edgeKey, mode, threshold]);
}
