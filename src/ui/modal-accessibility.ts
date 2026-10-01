import { useEffect } from 'react';

const owners = new WeakMap<HTMLElement, { count: number; previous: boolean }>();

// Preserve Radix's hidden regions while making their descendants natively inert.
export function useModalInert(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const regions = new Set<HTMLElement>();
    const release = (element: HTMLElement) => {
      const owner = owners.get(element);
      if (owner && --owner.count === 0) {
        element.inert = owner.previous;
        owners.delete(element);
      }
      regions.delete(element);
    };
    const sync = () => {
      const hidden = new Set(
        document.querySelectorAll<HTMLElement>('[data-aria-hidden="true"][aria-hidden="true"]'),
      );
      for (const element of regions) if (!hidden.has(element)) release(element);
      for (const element of hidden) {
        if (regions.has(element)) continue;
        const owner = owners.get(element) ?? { count: 0, previous: element.inert };
        owner.count++;
        owners.set(element, owner);
        element.inert = true;
        regions.add(element);
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      childList: true,
      attributeFilter: ['aria-hidden'],
    });
    sync();
    return () => {
      observer.disconnect();
      for (const element of regions) release(element);
    };
  }, [active]);
}
