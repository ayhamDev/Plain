import * as React from 'react';
import { Slot } from 'radix-ui';

// Protect entire composite controls, including their tracks and decorative children.
const controls = [
  'input',
  'textarea',
  'select',
  'option',
  'button',
  'a[href]',
  'label',
  'summary',
  'video',
  'audio',
  'iframe',
  'canvas',
  '[contenteditable]:not([contenteditable="false"])',
  '[draggable="true"]',
  '[tabindex]',
  '[data-vaul-no-drag]',
  '[data-ui="slider"]',
  '[data-ui="color-picker"]',
  '[data-ui="resizable"][data-slot="handle"]',
  ...[
    'button',
    'link',
    'slider',
    'scrollbar',
    'spinbutton',
    'checkbox',
    'radio',
    'switch',
    'textbox',
    'combobox',
    'listbox',
    'option',
    'tab',
    'menuitem',
    'treeitem',
    'grid',
  ].map((role) => `[role="${role}"]`),
].join(',');

type Start = {
  target: EventTarget | null;
  pointerType: string;
  button?: number;
  isPrimary?: boolean;
};
function selectedText(panel: HTMLElement) {
  const selection = panel.ownerDocument.getSelection();
  return !!selection && !selection.isCollapsed && selection.toString().length > 0;
}
function clearInputSelection(panel: HTMLElement) {
  const selection = panel.ownerDocument.getSelection();
  if (selection?.isCollapsed && selection.toString()) selection.removeAllRanges();
}
function mayDrag(panel: HTMLElement, event: Start) {
  const target = event.target;
  if (
    !(target instanceof Element) ||
    !panel.contains(target) ||
    event.button! > 0 ||
    event.isPrimary === false
  )
    return false;
  // An explicit handle remains usable even when it is a keyboard-accessible button.
  if (target.closest('[data-vaul-handle]')) return true;
  const control = target.closest(controls);
  if (control && control !== panel && panel.contains(control)) return false;
  // Mouse drags on reading text select that text; touch drags can still swipe the panel.
  if (event.pointerType !== 'touch' && target.closest('p, pre, code, blockquote')) return false;
  if (selectedText(panel)) return false;
  for (let element = target; element && element !== panel; element = element.parentElement!) {
    if (!(element instanceof HTMLElement)) continue;
    if (
      element.scrollHeight <= element.clientHeight + 1 &&
      element.scrollWidth <= element.clientWidth + 1
    )
      continue;
    const style = element.ownerDocument.defaultView!.getComputedStyle(element);
    if (/(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY)) return false;
  }
  return true;
}

type PointerHandlers = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
>;
type TouchGesture = {
  x: number;
  y: number;
  vertical: boolean;
  handle: boolean;
  top: number;
  bottom: number;
  choice?: 'drag' | 'scroll';
};
function chooseTouchGesture(gesture: TouchGesture | undefined, x: number, y: number) {
  if (!gesture || gesture.choice) return;
  const dx = x - gesture.x,
    dy = y - gesture.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 2) return;
  const inAxis = gesture.vertical ? Math.abs(dy) >= Math.abs(dx) : Math.abs(dx) >= Math.abs(dy);
  const canScroll =
    gesture.vertical && (dy < 0 ? gesture.top < gesture.bottom - 1 : gesture.top > 0);
  gesture.choice = inAxis && (gesture.handle || !canScroll) ? 'drag' : 'scroll';
}

/** Vaul's asChild boundary: one real dialog node, with filtering before engine capture. */
export const PanelDragSurface = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
    consumerHandlers: PointerHandlers;
    touchGesture: React.RefObject<TouchGesture | undefined>;
  }
>(
  (
    {
      asChild,
      consumerHandlers,
      touchGesture,
      onPointerDown,
      onPointerMove,
      onPointerMoveCapture,
      onPointerUp,
      onPointerCancel,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const allowed = React.useRef(false);
    const Surface = asChild ? Slot.Root : 'div';
    const slotted = asChild ? React.Children.toArray(children) : [];
    return (
      <Surface
        {...props}
        ref={ref}
        style={{ touchAction: 'auto', ...style }}
        onPointerDown={(event) => {
          consumerHandlers.onPointerDown?.(event);
          allowed.current = !event.defaultPrevented && mayDrag(event.currentTarget, event);
          if (allowed.current) {
            // Autofocused inputs can leave text in getSelection() even with a collapsed
            // DOM range. Clear that stale range before Vaul checks for selected prose.
            event.currentTarget.ownerDocument.getSelection()?.removeAllRanges();
            if (event.pointerType === 'mouse') {
              event.currentTarget.focus({ preventScroll: true });
              event.preventDefault();
            }
            onPointerDown?.(event);
          }
        }}
        onPointerMove={(event) => {
          consumerHandlers.onPointerMove?.(event);
          if (
            allowed.current &&
            !event.defaultPrevented &&
            !selectedText(event.currentTarget) &&
            (event.pointerType !== 'touch' || touchGesture.current?.choice === 'drag')
          ) {
            clearInputSelection(event.currentTarget);
            onPointerMove?.(event);
          }
        }}
        onPointerMoveCapture={(event) => {
          onPointerMoveCapture?.(event);
          if (event.pointerType === 'touch')
            chooseTouchGesture(touchGesture.current, event.clientX, event.clientY);
          if (allowed.current && !event.defaultPrevented) clearInputSelection(event.currentTarget);
        }}
        onPointerUp={(event) => {
          consumerHandlers.onPointerUp?.(event);
          if (allowed.current) clearInputSelection(event.currentTarget);
          onPointerUp?.(event);
          allowed.current = false;
        }}
        onPointerCancel={(event) => {
          consumerHandlers.onPointerCancel?.(event);
          if (allowed.current) clearInputSelection(event.currentTarget);
          onPointerCancel?.(event);
          // Native scrolling cancels pointer delivery; release the engine's pending press too.
          onPointerUp?.(event);
          allowed.current = false;
        }}
      >
        {asChild && slotted.length === 1 ? slotted[0] : children}
      </Surface>
    );
  },
);
PanelDragSurface.displayName = 'PanelDragSurface';

/** Keep native touch scrolling/zoom, reserving only an eligible single-finger panel swipe. */
export function usePanelTouchGestures(panel: HTMLElement | null, handleOnly: boolean) {
  const gesture = React.useRef<TouchGesture | undefined>(undefined);
  React.useEffect(() => {
    if (!panel) return;
    const start = (event: TouchEvent) => {
      gesture.current = undefined;
      if (
        event.touches.length !== 1 ||
        !mayDrag(panel, { target: event.target, pointerType: 'touch' })
      )
        return;
      const handle = !!(event.target as Element).closest('[data-vaul-handle]');
      if (handleOnly && !handle) return;
      gesture.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        vertical: !['left', 'right'].includes(panel.dataset.side ?? 'bottom'),
        handle,
        top: panel.scrollTop,
        bottom: panel.scrollHeight - panel.clientHeight,
      };
    };
    const move = (event: TouchEvent) => {
      if (!gesture.current || event.touches.length !== 1) {
        gesture.current = undefined;
        return;
      }
      chooseTouchGesture(gesture.current, event.touches[0].clientX, event.touches[0].clientY);
      if (gesture.current.choice === 'drag' && event.cancelable) event.preventDefault();
    };
    const end = () => {
      gesture.current = undefined;
    };
    panel.addEventListener('touchstart', start, { passive: true });
    panel.addEventListener('touchmove', move, { passive: false });
    panel.addEventListener('touchend', end);
    panel.addEventListener('touchcancel', end);
    return () => {
      panel.removeEventListener('touchstart', start);
      panel.removeEventListener('touchmove', move);
      panel.removeEventListener('touchend', end);
      panel.removeEventListener('touchcancel', end);
    };
  }, [panel, handleOnly]);
  return gesture;
}
