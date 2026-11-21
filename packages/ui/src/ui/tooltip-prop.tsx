import * as React from 'react';
import { Slot } from 'radix-ui';
import type { TooltipOptions, TooltipValue } from './tooltip-types';
import type { TooltipIntent } from './tooltip-runtime';

const LazyTooltipRuntime = /* @__PURE__ */ React.lazy(() => import('./tooltip-runtime'));
// Give a nested hint priority without stopping the consumer's event propagation.
const claimedEvents = /* @__PURE__ */ new WeakSet<Event>();

class OptionalTooltipBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function textContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(' ');
  if (
    React.isValidElement<{
      children?: React.ReactNode;
      'aria-hidden'?: boolean | 'true' | 'false';
    }>(node)
  )
    return node.props['aria-hidden'] === true || node.props['aria-hidden'] === 'true'
      ? ''
      : textContent(node.props.children);
  return '';
}

interface TooltipTargetProps extends React.HTMLAttributes<HTMLElement> {
  node: React.ReactElement<Record<string, unknown>>;
  value: TooltipValue;
  unstyled?: boolean;
  wrapperProps?: React.HTMLAttributes<HTMLSpanElement>;
}
const TooltipTarget = /* @__PURE__ */ React.forwardRef<HTMLElement, TooltipTargetProps>(
  function TooltipTarget({ node, value, unstyled, wrapperProps, ...injectedProps }, forwardedRef) {
    const settings: TooltipOptions =
      value && typeof value === 'object' && !React.isValidElement(value) && 'content' in value
        ? (value as TooltipOptions)
        : { content: value as React.ReactNode };
    const [rootAnchor, setRootAnchor] = React.useState<Element | null>(null);
    const [controlAnchor, setControlAnchor] = React.useState<Element | null>(null);
    const intent = React.useRef<TooltipIntent>({ prevented: {} });
    const enabled =
      !settings.disabled &&
      settings.content !== undefined &&
      settings.content !== null &&
      settings.content !== false &&
      settings.content !== true &&
      settings.content !== '' &&
      node.props['aria-hidden'] !== true &&
      node.props['aria-hidden'] !== 'true';
    const attributes: Record<string, unknown> = { ...injectedProps, ...node.props };
    const isDisabled = Boolean(
      attributes.disabled ||
      attributes['aria-disabled'] === true ||
      attributes['aria-disabled'] === 'true',
    );
    const anchor = isDisabled ? rootAnchor : controlAnchor;
    React.useEffect(() => {
      if (!anchor || !enabled || anchor.hasAttribute('tabindex')) return;
      // Primitive parts can resolve to a span, heading or group rather than a control.
      const focusable =
        'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]';
      if (
        anchor.matches(focusable) ||
        anchor.querySelector(focusable) ||
        anchor.closest('[aria-hidden="true"],[inert]')
      )
        return;
      anchor.setAttribute('tabindex', '0');
      return () => {
        if (anchor.getAttribute('tabindex') === '0') anchor.removeAttribute('tabindex');
      };
    }, [anchor, enabled]);
    const control =
      (typeof node.type !== 'string' &&
        !['label', 'avatar', 'separator', 'progress'].includes(String(attributes['data-ui']))) ||
      ['button', 'input', 'select', 'textarea', 'summary'].includes(String(node.type)) ||
      attributes['data-ui'] === 'button' ||
      [
        'button',
        'link',
        'textbox',
        'combobox',
        'checkbox',
        'radio',
        'switch',
        'slider',
        'spinbutton',
        'menuitem',
        'menuitemcheckbox',
        'menuitemradio',
        'tab',
        'treeitem',
        'gridcell',
      ].includes(String(attributes.role));
    const iconLabel = settings.label ?? textContent(settings.content).trim();
    const unnamedIcon =
      (node.type === 'button' || attributes['data-ui'] === 'button') &&
      !attributes['aria-label'] &&
      !attributes['aria-labelledby'] &&
      !textContent(attributes.children as React.ReactNode).trim();
    const child = (
      <Slot.Root {...injectedProps} ref={forwardedRef}>
        <Slot.Root ref={setControlAnchor}>
          {React.cloneElement(node, {
            ...(unnamedIcon && iconLabel ? { 'aria-label': iconLabel } : {}),
            ...(enabled &&
            !control &&
            attributes.tabIndex === undefined &&
            !(node.type === 'a' && attributes.href)
              ? { tabIndex: 0 }
              : {}),
          })}
        </Slot.Root>
      </Slot.Root>
    );
    // Keep this wrapper stable when a control switches between enabled/loading/disabled.
    const wrapDisabled = 'disabled' in attributes || isDisabled;
    const target = wrapDisabled ? (
      <span
        {...wrapperProps}
        role={isDisabled ? 'group' : undefined}
        tabIndex={isDisabled && enabled ? 0 : undefined}
        aria-label={
          isDisabled
            ? String(
                attributes['aria-label'] ??
                  (textContent(attributes.children as React.ReactNode).trim() || iconLabel),
              ) || undefined
            : undefined
        }
        aria-labelledby={
          isDisabled ? (attributes['aria-labelledby'] as string | undefined) : undefined
        }
        aria-describedby={
          isDisabled ? (attributes['aria-describedby'] as string | undefined) : undefined
        }
        aria-disabled={isDisabled || undefined}
        style={{
          // Enabled controls keep their own grid/flex sizing and positioning.
          display: isDisabled ? 'inline-flex' : 'contents',
          maxInlineSize: '100%',
          verticalAlign: 'middle',
          ...(node.type === 'input' ||
          node.type === 'textarea' ||
          /\bw-full\b/.test(String(attributes.className ?? ''))
            ? { inlineSize: '100%' }
            : {}),
        }}
      >
        {child}
      </span>
    ) : (
      child
    );
    return (
      <>
        <Slot.Root
          ref={setRootAnchor}
          onFocus={(event) => {
            const suppressed = event.defaultPrevented || claimedEvents.has(event.nativeEvent);
            intent.current.prevented.focusin = suppressed;
            if (enabled && !suppressed) {
              claimedEvents.add(event.nativeEvent);
              intent.current.events?.onFocus?.(event);
            }
          }}
          onPointerMove={(event) => {
            const suppressed = event.defaultPrevented || claimedEvents.has(event.nativeEvent);
            intent.current.prevented.pointermove = suppressed;
            intent.current.pointerType = event.pointerType;
            if (enabled && !suppressed) {
              claimedEvents.add(event.nativeEvent);
              intent.current.events?.onPointerMove?.(event);
            }
          }}
          onBlur={(event) => {
            intent.current.prevented.focusout = event.defaultPrevented;
            intent.current.fromPointer = false;
            if (!event.defaultPrevented) intent.current.events?.onBlur?.(event);
          }}
          onPointerLeave={(event) => {
            intent.current.prevented.pointerleave = event.defaultPrevented;
            if (!event.defaultPrevented) intent.current.events?.onPointerLeave?.(event);
          }}
          onPointerDown={(event) => {
            intent.current.prevented.pointerdown = event.defaultPrevented;
            intent.current.fromPointer = true;
            intent.current.pointerType = event.pointerType;
            if (!event.defaultPrevented) intent.current.events?.onPointerDown?.(event);
          }}
          onKeyDown={() => {
            intent.current.fromPointer = false;
          }}
          onClick={(event) => {
            intent.current.prevented.click = event.defaultPrevented;
            if (!event.defaultPrevented) intent.current.events?.onClick?.(event);
          }}
        >
          {target}
        </Slot.Root>
        {anchor && enabled && (
          <OptionalTooltipBoundary>
            <React.Suspense fallback={null}>
              <LazyTooltipRuntime
                anchor={anchor}
                settings={settings}
                unstyled={unstyled}
                intent={intent}
                description={attributes['aria-describedby'] as string | undefined}
              />
            </React.Suspense>
          </OptionalTooltipBoundary>
        )}
      </>
    );
  },
);

/** Internal rendered-element adapter. No tooltip means no wrapper, hooks or tooltip-engine code. */
export function wrapTooltip<P>(
  element: React.ReactElement<P>,
  unstyled?: boolean,
  value?: TooltipValue,
  wrapperProps?: React.HTMLAttributes<HTMLSpanElement>,
): React.ReactElement {
  const props =
    value === undefined
      ? (element.props as Record<string, unknown>)
      : { ...element.props, tooltip: value };
  if (!Object.prototype.hasOwnProperty.call(props, 'tooltip')) return element;
  const { tooltip, ...nativeProps } = props;
  const ref = 'ref' in props ? props.ref : Object.getOwnPropertyDescriptor(element, 'ref')?.value;
  const node = React.createElement(element.type, {
    ...nativeProps,
    key: element.key,
    ...(ref !== undefined ? { ref } : {}),
  });
  return (
    <TooltipTarget
      key={element.key}
      node={node}
      value={tooltip as TooltipValue}
      unstyled={unstyled}
      wrapperProps={wrapperProps}
    />
  );
}
