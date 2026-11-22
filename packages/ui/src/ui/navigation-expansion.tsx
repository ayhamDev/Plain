import * as React from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from './media-query';
import { useStyles } from './style-context';

export interface NavigationExpansionProps {
  /** Temporarily reveal labels on hover or keyboard focus on a fine-pointer device. */
  expandOnHover?: boolean;
  /** Overlay keeps the compact layout width reserved when expanded. */
  expansionMode?: 'inline' | 'overlay';
  /** Delays for fresh pointer previews. Focus and re-entry during closing resume immediately. */
  hoverOpenDelay?: number;
  hoverCloseDelay?: number;
  /** Dim the navigation's enclosing SidebarProvider/AppShell in overlay mode. */
  overlayBackdrop?: boolean;
}

const delay = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(value, 60000)) : 0);
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** A preview never writes the consumer's persistent expanded/collapsed state. */
export function useNavigationExpansion({
  expanded,
  onExpandedChange,
  enabled = true,
  expandOnHover = false,
  expansionMode = 'inline',
  hoverOpenDelay = 120,
  hoverCloseDelay = 180,
}: NavigationExpansionProps & {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  enabled?: boolean;
}) {
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)', enabled && expandOnHover);
  const automatic = enabled && expandOnHover && finePointer;
  const [node, setNode] = React.useState<HTMLElement | null>(null);
  const [preview, setPreview] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointer = React.useRef(false);
  const keyboard = React.useRef(false);
  const dismissed = React.useRef(false);
  const clear = React.useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const hoverExpanded = automatic && !expanded && preview;
  const visible = expanded || hoverExpanded;
  React.useEffect(() => {
    clear();
    setPreview(false);
    pointer.current = false;
    keyboard.current = false;
    return clear;
  }, [automatic, expanded, clear]);
  const dismiss = React.useCallback(() => {
    clear();
    dismissed.current = true;
    setPreview(false);
    if (expanded) onExpandedChange(false);
    const document = node?.ownerDocument;
    if (node && document && node.contains(document.activeElement)) {
      const trigger = [...document.querySelectorAll<HTMLElement>('[aria-controls]')].find(
        (element) => element.getAttribute('aria-controls') === node.id && !node.contains(element),
      );
      (
        trigger ??
        node.querySelector<HTMLElement>(
          '[data-ui="sidebar"][data-slot="item"]:not([disabled]):not([aria-disabled="true"])',
        ) ??
        node.querySelector<HTMLElement>(
          '[data-ui="navigation-rail"][data-slot="item"]:not([disabled]):not([aria-disabled="true"])',
        ) ??
        node.querySelector<HTMLElement>('a[href], button:not(:disabled), [tabindex="0"]')
      )?.focus({ preventScroll: true });
    }
  }, [clear, expanded, onExpandedChange, node]);
  React.useEffect(() => {
    if (!enabled || !visible || (!hoverExpanded && expansionMode !== 'overlay') || !node) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      dismiss();
    };
    node.ownerDocument.addEventListener('keydown', escape);
    return () => node.ownerDocument.removeEventListener('keydown', escape);
  }, [enabled, visible, hoverExpanded, expansionMode, node, dismiss]);
  const events = React.useMemo(
    () => ({
      onPointerEnter(event: React.PointerEvent<HTMLElement>) {
        if (!automatic || event.pointerType !== 'mouse') return;
        pointer.current = true;
        dismissed.current = false;
        clear();
        if (!expanded) {
          const reversing = event.currentTarget
            .getAnimations?.()
            .some(
              (animation) =>
                animation.playState === 'running' &&
                'transitionProperty' in animation &&
                /^(inline-size|width)$/.test(String(animation.transitionProperty)),
            );
          if (reversing) setPreview(true);
          else timer.current = setTimeout(() => setPreview(true), delay(hoverOpenDelay));
        }
      },
      onPointerLeave(event: React.PointerEvent<HTMLElement>) {
        if (!automatic || event.pointerType !== 'mouse') return;
        pointer.current = false;
        clear();
        if (!keyboard.current)
          timer.current = setTimeout(() => setPreview(false), delay(hoverCloseDelay));
      },
      onFocus(event: React.FocusEvent<HTMLElement>) {
        if (!automatic || dismissed.current || !(event.target instanceof HTMLElement)) return;
        if (!event.target.matches(':focus-visible')) return;
        keyboard.current = true;
        clear();
        if (!expanded) setPreview(true);
      },
      onBlur(event: React.FocusEvent<HTMLElement>) {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        )
          return;
        keyboard.current = false;
        dismissed.current = false;
        clear();
        if (!pointer.current) setPreview(false);
      },
    }),
    [automatic, clear, expanded, hoverOpenDelay, hoverCloseDelay],
  );
  return React.useMemo(
    () => ({ node, setNode, expanded: visible, hoverExpanded, dismiss, events }),
    [node, visible, hoverExpanded, dismiss, events],
  );
}

export function navigationExpansionEvents(
  props: React.HTMLAttributes<HTMLElement>,
  events: ReturnType<typeof useNavigationExpansion>['events'],
) {
  return {
    onPointerEnter(event: React.PointerEvent<HTMLElement>) {
      props.onPointerEnter?.(event);
      if (!event.defaultPrevented) events.onPointerEnter(event);
    },
    onPointerLeave(event: React.PointerEvent<HTMLElement>) {
      props.onPointerLeave?.(event);
      if (!event.defaultPrevented) events.onPointerLeave(event);
    },
    onFocus(event: React.FocusEvent<HTMLElement>) {
      props.onFocus?.(event);
      if (!event.defaultPrevented) events.onFocus(event);
    },
    onBlur(event: React.FocusEvent<HTMLElement>) {
      props.onBlur?.(event);
      if (!event.defaultPrevented) events.onBlur(event);
    },
  };
}

/** Only overlay mode introduces a layout frame; the actual landmark/ref stays intact. */
export function NavigationExpansionFrame({
  kind,
  side,
  variant,
  expanded,
  backdrop,
  node,
  dismiss,
  children,
  unstyled,
  style,
  offcanvas,
  hideOnMobile,
  dir,
}: {
  kind: 'sidebar' | 'navigation-rail';
  side: 'start' | 'end';
  variant: string;
  expanded: boolean;
  backdrop: boolean;
  node: HTMLElement | null;
  dismiss: () => void;
  children: React.ReactNode;
  unstyled?: boolean;
  style?: React.CSSProperties;
  offcanvas?: boolean;
  hideOnMobile?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  const styles = useStyles();
  const [paint, setPaint] = React.useState<React.CSSProperties>();
  const [maximumWidth, setMaximumWidth] = React.useState<number>();
  const scope = node?.closest<HTMLElement>(
    '[data-ui="sidebar"][data-slot="provider"], [data-ui="app-shell"][data-slot="root"]',
  );
  useLayoutEffect(() => {
    if (!node || !expanded || (unstyled ?? styles.unstyled)) return;
    // The backdrop may be portaled above a component-local ThemeScope. Resolve
    // only its paint/motion variables on state changes, never during scrolling.
    const view = node.ownerDocument.defaultView;
    if (!view) return;
    const update = () => {
      const css = view.getComputedStyle(node);
      const next = Object.fromEntries(
        [
          '--ui-sidebar-overlay-background',
          '--ui-duration-normal',
          '--ui-duration-slow',
          '--ui-motion-scale',
          '--ui-ease-standard',
        ]
          .map((key) => [key, css.getPropertyValue(key)])
          .filter(([, value]) => value),
      ) as React.CSSProperties;
      setPaint((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
      const frame = node.parentElement?.getBoundingClientRect();
      if (!frame) return;
      const boundary = scope?.getBoundingClientRect();
      const left = Math.max(0, boundary?.left ?? 0);
      const right = Math.min(
        node.ownerDocument.documentElement.clientWidth,
        boundary?.right ?? view.innerWidth,
      );
      const rightAnchored = (side === 'start') === (dir === 'rtl');
      setMaximumWidth(Math.max(0, rightAnchored ? frame.right - left : right - frame.left));
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    observer?.observe(scope ?? node.parentElement ?? node);
    view.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      view.removeEventListener('resize', update);
    };
  }, [node, expanded, unstyled, styles, style, scope, side, dir]);
  const shade = backdrop ? (
    <div
      aria-hidden="true"
      data-active={expanded || undefined}
      data-scoped={!!scope}
      data-hide-on-mobile={hideOnMobile}
      style={paint}
      {...(kind === 'sidebar'
        ? styles('sidebar.backdrop', 'ui-navigation-expansion-backdrop', undefined, unstyled)
        : styles(
            'navigation-rail.backdrop',
            'ui-navigation-expansion-backdrop',
            undefined,
            unstyled,
          ))}
      onClick={dismiss}
    />
  ) : null;
  return (
    <>
      {scope && shade ? createPortal(shade, scope) : shade}
      <div
        data-kind={kind}
        data-side={side}
        data-variant={variant}
        data-active={expanded || undefined}
        data-offcanvas={offcanvas || undefined}
        data-hide-on-mobile={hideOnMobile}
        dir={dir}
        style={
          {
            ...style,
            ...(maximumWidth === undefined
              ? {}
              : { '--_ui-navigation-max-width': `${maximumWidth}px` }),
          } as React.CSSProperties
        }
        {...(kind === 'sidebar'
          ? styles('sidebar.frame', 'ui-navigation-expansion-frame', undefined, unstyled)
          : styles('navigation-rail.frame', 'ui-navigation-expansion-frame', undefined, unstyled))}
      >
        {children}
      </div>
    </>
  );
}
