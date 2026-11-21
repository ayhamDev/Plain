import * as React from 'react';
import { PopoverContent } from './overlays';

const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

type PickerPopoverProps = React.ComponentPropsWithoutRef<typeof PopoverContent> & {
  anchorRef: React.RefObject<HTMLElement | null>;
};

// Keep a calendar intact when it fits in the viewport but neither side of its
// trigger has enough room. Radix still owns flipping, portals, focus and dismissal.
export const PickerPopoverContent = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  PickerPopoverProps
>(
  (
    { anchorRef, side = 'bottom', sideOffset = 8, collisionPadding = 8, ...props },
    forwardedRef,
  ) => {
    const [panel, setPanel] = React.useState<HTMLDivElement | null>(null);
    const [placement, setPlacement] = React.useState({ side, sideOffset });
    const ref = React.useCallback(
      (node: HTMLDivElement | null) => {
        setPanel(node);
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    const topPadding =
      typeof collisionPadding === 'number' ? collisionPadding : (collisionPadding.top ?? 0);
    const bottomPadding =
      typeof collisionPadding === 'number' ? collisionPadding : (collisionPadding.bottom ?? 0);
    const fit =
      props.avoidCollisions !== false && !props.collisionBoundary && !props.style?.maxHeight;
    useLayoutEffect(() => {
      if (!panel) return;
      const update = () => {
        const anchor = anchorRef.current;
        let next = { side, sideOffset };
        if (anchor && fit && (side === 'top' || side === 'bottom')) {
          const viewport = window.visualViewport;
          const top = (viewport?.offsetTop ?? 0) + topPadding;
          const bottom =
            (viewport ? viewport.offsetTop + viewport.height : window.innerHeight) - bottomPadding;
          const rect = anchor.getBoundingClientRect();
          const above = Math.max(0, rect.top - top);
          const below = Math.max(0, bottom - rect.bottom);
          const computed = window.getComputedStyle(panel);
          const border =
            parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
          const height = Math.min(panel.scrollHeight + border, Math.max(0, bottom - top));
          const room = Math.max(above, below);
          if (height > room - sideOffset && rect.bottom > top && rect.top < bottom) {
            next = { side: above > below ? 'top' : 'bottom', sideOffset: room - height };
          }
        }
        setPlacement((previous) =>
          previous.side === next.side && Math.abs(previous.sideOffset - next.sideOffset) < 1
            ? previous
            : next,
        );
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(panel);
      const observeContent = () => {
        for (const child of panel.children) observer.observe(child);
        update();
      };
      observeContent();
      const children = new MutationObserver(observeContent);
      children.observe(panel, { childList: true });
      if (anchorRef.current) observer.observe(anchorRef.current);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      window.visualViewport?.addEventListener('resize', update);
      window.visualViewport?.addEventListener('scroll', update);
      return () => {
        observer.disconnect();
        children.disconnect();
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
        window.visualViewport?.removeEventListener('resize', update);
        window.visualViewport?.removeEventListener('scroll', update);
      };
    }, [panel, anchorRef, side, sideOffset, topPadding, bottomPadding, fit]);
    return (
      <PopoverContent
        {...props}
        ref={ref}
        side={placement.side}
        sideOffset={placement.sideOffset}
        collisionPadding={collisionPadding}
      />
    );
  },
);
PickerPopoverContent.displayName = 'PickerPopoverContent';
