import * as React from 'react';
import { useDirection } from './styling';

const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Measure only when selection or layout changes; CSS owns every animation frame. */
export function useSelectionIndicator<T extends HTMLElement>(
  root: React.RefObject<T | null>,
  selector: string,
  enabled: boolean,
) {
  const direction = useDirection();
  useLayoutEffect(() => {
    const container = root.current;
    if (!container || !enabled) return;
    const indicator = container.querySelector<HTMLElement>(':scope > .ui-selection-indicator');
    if (!indicator) return;
    let frame = 0;
    let readyFrame = 0;
    let disposed = false;
    let initialized = false;
    const measure = () => {
      if (disposed) return;
      const selected = container.querySelector<HTMLElement>(selector);
      if (!selected || !selected.getClientRects().length) {
        delete container.dataset.hasIndicator;
        indicator.hidden = true;
        return;
      }
      const box = selected.getBoundingClientRect();
      const parent = container.getBoundingClientRect();
      indicator.hidden = false;
      indicator.style.setProperty(
        '--ui-selection-x',
        `${box.left - parent.left - container.clientLeft + container.scrollLeft}px`,
      );
      indicator.style.setProperty(
        '--ui-selection-y',
        `${box.top - parent.top - container.clientTop + container.scrollTop}px`,
      );
      indicator.style.setProperty('--ui-selection-width', `${box.width}px`);
      indicator.style.setProperty('--ui-selection-height', `${box.height}px`);
      container.dataset.hasIndicator = '';
      if (!initialized) {
        initialized = true;
        readyFrame = requestAnimationFrame(() => {
          indicator.dataset.ready = '';
        });
      }
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
    const observeSizes = () => {
      resize?.disconnect();
      resize?.observe(container);
      container
        .querySelectorAll<HTMLElement>('[role="tab"], [role="radio"], .ui-bottom-navigation-item')
        .forEach((item) => resize?.observe(item));
    };
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => record.type === 'childList')) observeSizes();
      schedule();
    });
    mutations.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-state', 'aria-current', 'dir', 'data-variant'],
    });
    const ancestor = container.parentElement;
    if (ancestor) mutations.observe(ancestor, { attributes: true, attributeFilter: ['dir'] });
    observeSizes();
    measure();
    container.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    void document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(readyFrame);
      resize?.disconnect();
      mutations.disconnect();
      container.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      delete container.dataset.hasIndicator;
      delete indicator.dataset.ready;
    };
  }, [root, selector, enabled, direction]);
}
