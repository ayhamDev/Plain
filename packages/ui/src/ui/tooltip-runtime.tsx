import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { TooltipContent } from './tooltip';
import { useTooltipProviderSettings } from './tooltip-provider';
import type { TooltipOptions } from './tooltip-types';

type TriggerEvents = Pick<
  React.HTMLAttributes<HTMLElement>,
  'onPointerMove' | 'onPointerLeave' | 'onPointerDown' | 'onFocus' | 'onBlur' | 'onClick'
>;
export interface TooltipIntent {
  prevented: Record<string, boolean>;
  fromPointer?: boolean;
  pointerType?: string;
  events?: TriggerEvents;
}
interface ExistingAnchorProps extends TriggerEvents {
  anchor: Element;
  intent: React.RefObject<TooltipIntent>;
  'aria-describedby'?: string;
  description?: string;
}
const useClientLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

// Adopt the existing DOM anchor: loading tooltip code never replaces a native control.
const ExistingAnchor = /* @__PURE__ */ React.forwardRef<HTMLElement, ExistingAnchorProps>(
  (
    {
      anchor,
      intent,
      'aria-describedby': description,
      description: originalDescription,
      ...events
    },
    ref,
  ) => {
    React.useImperativeHandle(ref, () => anchor as HTMLElement, [anchor]);
    const focusFrame = React.useRef<number | undefined>(undefined);
    const focusHandler = React.useRef(events.onFocus);
    const [focused, setFocused] = React.useState<Element | null>(() => {
      const current = anchor.ownerDocument.activeElement;
      return current && anchor.contains(current) ? current : null;
    });
    useClientLayoutEffect(
      () => () => {
        if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
        focusFrame.current = undefined;
      },
      [anchor],
    );
    useClientLayoutEffect(() => {
      focusHandler.current = events.onFocus;
      const cancelFocus = () => {
        if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
        focusFrame.current = undefined;
      };
      // Slot runs the consumer's handler first. Keep dispatch in that React event
      // path: native-listener microtasks can run before React's delegated handler.
      const handlers: TriggerEvents = {
        ...events,
        onFocus: (event) => {
          setFocused(event.target);
          cancelFocus();
          // Native keyboard focus may scroll its target into view. Open after
          // that scroll, so the engine does not immediately dismiss the new hint.
          focusFrame.current = requestAnimationFrame(() => {
            focusFrame.current = undefined;
            if (anchor.contains(anchor.ownerDocument.activeElement) && !intent.current.fromPointer)
              focusHandler.current?.(event);
          });
        },
        onBlur: (event) => {
          cancelFocus();
          setFocused(null);
          events.onBlur?.(event);
        },
        onPointerDown: (event) => {
          cancelFocus();
          events.onPointerDown?.(event);
        },
        onClick: (event) => {
          cancelFocus();
          events.onClick?.(event);
        },
      };
      intent.current.events = handlers;
      return () => {
        if (intent.current.events === handlers) delete intent.current.events;
      };
    }, [
      anchor,
      events.onPointerMove,
      events.onPointerLeave,
      events.onPointerDown,
      events.onFocus,
      events.onBlur,
      events.onClick,
    ]);
    useClientLayoutEffect(() => {
      const focused = anchor.ownerDocument.activeElement;
      if (focused && anchor.contains(focused)) setFocused(focused);
      if (
        focused &&
        anchor.contains(focused) &&
        !intent.current.prevented.focusin &&
        !intent.current.fromPointer
      )
        intent.current.events?.onFocus?.({
          target: focused,
          currentTarget: anchor,
          defaultPrevented: false,
        } as React.FocusEvent<HTMLElement>);
      else if (
        anchor.matches(':hover') &&
        !intent.current.prevented.pointermove &&
        !intent.current.fromPointer &&
        intent.current.pointerType !== 'touch'
      )
        events.onPointerMove?.({
          target: anchor,
          currentTarget: anchor,
          pointerType: 'mouse',
          defaultPrevented: false,
        } as unknown as React.PointerEvent<HTMLElement>);
      // This replays only an interaction that preceded the optional module loading.
    }, [anchor]);
    useClientLayoutEffect(() => {
      if (!description) return;
      const targets =
        focused && focused !== anchor && anchor.contains(focused) ? [anchor, focused] : [anchor];
      const cleanups = targets.map((target) => {
        const added = new Set<string>();
        const sync = () => {
          const existing = (target.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter(Boolean);
          const missing = description.split(/\s+/).filter((id) => id && !existing.includes(id));
          if (!missing.length) return;
          missing.forEach((id) => added.add(id));
          target.setAttribute('aria-describedby', [...existing, ...missing].join(' '));
        };
        // A compound control may update its own descriptions while the hint is open.
        const observer = new MutationObserver(sync);
        observer.observe(target, { attributes: true, attributeFilter: ['aria-describedby'] });
        sync();
        return () => {
          observer.disconnect();
          const retained = (target.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter((id) => id && !added.has(id));
          if (retained.length) target.setAttribute('aria-describedby', retained.join(' '));
          else target.removeAttribute('aria-describedby');
        };
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    }, [anchor, description, originalDescription, focused]);
    return null;
  },
);
ExistingAnchor.displayName = 'TooltipExistingAnchor';

function Runtime({
  anchor,
  settings,
  unstyled,
  intent,
  description,
}: {
  anchor: Element;
  settings: TooltipOptions;
  unstyled?: boolean;
  intent: React.RefObject<TooltipIntent>;
  description?: string;
}) {
  const {
    content,
    label: _label,
    disabled = false,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    delayDuration,
    disableHoverableContent,
    unstyled: contentUnstyled,
    ...contentProps
  } = settings;
  const enabled =
    !disabled &&
    content !== undefined &&
    content !== null &&
    content !== false &&
    content !== true &&
    content !== '';
  const [localOpen, setLocalOpen] = React.useState(defaultOpen);
  const open = enabled && (controlledOpen ?? localOpen);
  void _label;
  return (
    <TooltipPrimitive.Root
      open={open}
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
      onOpenChange={(next) => {
        if (next && !enabled) return;
        if (controlledOpen === undefined) setLocalOpen(next);
        onOpenChange?.(next);
      }}
    >
      <TooltipPrimitive.Trigger asChild>
        <ExistingAnchor anchor={anchor} intent={intent} description={description} />
      </TooltipPrimitive.Trigger>
      <TooltipContent {...contentProps} unstyled={contentUnstyled ?? unstyled}>
        {content}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}
export default function TooltipRuntime(props: React.ComponentProps<typeof Runtime>) {
  const scope = useTooltipProviderSettings();
  return scope.provided ? (
    <Runtime {...props} />
  ) : (
    <TooltipPrimitive.Provider {...scope.options}>
      <Runtime {...props} />
    </TooltipPrimitive.Provider>
  );
}
