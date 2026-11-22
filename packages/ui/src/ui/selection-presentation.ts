import * as React from 'react';
import { useMediaQuery, mediaQueryMatches } from './media-query';

export type SelectionPresentation = 'auto' | 'popover' | 'sheet';
export type SelectionMode = 'popover' | 'sheet';
const query = '(max-width: 767px)';
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Pick a surface before mounting its focus scope; keep it until the next opening. */
export function useSelectionPresentation(presentation: SelectionPresentation, open: boolean) {
  const compact = useMediaQuery(query, presentation === 'auto');
  const candidate: SelectionMode =
    presentation === 'sheet' || (presentation === 'auto' && compact) ? 'sheet' : 'popover';
  const [session, setSession] = React.useState<{ open: boolean; mode: SelectionMode | null }>({
    open: false,
    mode: null,
  });
  useLayoutEffect(() => {
    setSession((previous) => {
      if (previous.open === open) return previous;
      if (!open) return { ...previous, open: false };
      const sheet =
        presentation === 'sheet' || (presentation === 'auto' && mediaQueryMatches(query));
      return { open: true, mode: sheet ? 'sheet' : 'popover' };
    });
  }, [open, presentation]);
  return {
    mode: session.mode ?? candidate,
    ready: !open || session.open,
    sheet: session.open ? session.mode === 'sheet' : candidate === 'sheet',
  };
}

/** Keep a sheet above the visual viewport's keyboard without moving the page. */
export function useSelectionViewport(node: HTMLElement | null, enabled: boolean) {
  useLayoutEffect(() => {
    const view = node?.ownerDocument.defaultView;
    if (!node || !view || !enabled) return;
    const update = () => {
      const viewport = view.visualViewport;
      node.style.setProperty('--_ui-selection-height', `${viewport?.height ?? view.innerHeight}px`);
      node.style.setProperty(
        '--_ui-selection-bottom',
        `${Math.max(0, view.innerHeight - (viewport?.height ?? view.innerHeight) - (viewport?.offsetTop ?? 0))}px`,
      );
    };
    update();
    view.addEventListener('resize', update);
    view.visualViewport?.addEventListener('resize', update);
    view.visualViewport?.addEventListener('scroll', update);
    return () => {
      view.removeEventListener('resize', update);
      view.visualViewport?.removeEventListener('resize', update);
      view.visualViewport?.removeEventListener('scroll', update);
      node.style.removeProperty('--_ui-selection-height');
      node.style.removeProperty('--_ui-selection-bottom');
    };
  }, [node, enabled]);
}
