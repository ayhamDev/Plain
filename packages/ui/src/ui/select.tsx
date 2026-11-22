import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import {
  type SelectionPresentation,
  useSelectionPresentation,
  useSelectionViewport,
} from './selection-presentation';
import { useModalInert } from './modal-accessibility';
import { type PlainStyleProps, useStyles, usePortalContainer } from './style-context';
import { type InputVariant, inputClass, inputVariantClass } from './input-variants';
import { cn } from './utils';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useTranslation } from './i18n';

const SelectSheet = /* @__PURE__ */ React.lazy(() =>
  import('./select-sheet').then((module) => ({ default: module.SelectSheet })),
);

export type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
  presentation?: SelectionPresentation;
  sheetTitle?: React.ReactNode;
};

const SelectPresentationContext = /* @__PURE__ */ React.createContext<{
  sheet: boolean;
  open: boolean;
  title?: React.ReactNode;
  setOpen: (open: boolean) => void;
  clickActivation: boolean;
}>({ sheet: false, open: false, setOpen: () => {}, clickActivation: false });

export function Select({
  open,
  defaultOpen = false,
  onOpenChange,
  presentation = 'popover',
  sheetTitle,
  ...props
}: SelectProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const { sheet, ready } = useSelectionPresentation(presentation, isOpen);
  const pendingRequest = React.useRef<boolean | null>(null);
  const setOpen = (next: boolean) => {
    if (pendingRequest.current === next) return;
    pendingRequest.current = next;
    queueMicrotask(() => {
      pendingRequest.current = null;
    });
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  useModalInert(isOpen && ready);
  return (
    <SelectPresentationContext.Provider
      value={{
        sheet,
        open: isOpen && ready,
        title: sheetTitle,
        setOpen,
        clickActivation: presentation !== 'popover',
      }}
    >
      <SelectPrimitive.Root open={isOpen && ready} onOpenChange={setOpen} {...props} />
    </SelectPresentationContext.Provider>
  );
}

export const SelectGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<SelectPrimitive.Group {...props} ref={ref} />, unstyled);
});

SelectGroup.displayName = 'SelectGroup';

export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
    PlainStyleProps & { variant?: InputVariant }
>(
  (
    { className, children, unstyled, variant = 'outlined', onClick, onPointerDown, ...props },
    ref,
  ) => {
    const styles = useStyles();
    const { sheet, setOpen, clickActivation } = React.useContext(SelectPresentationContext);
    const cancelledPointer = React.useRef(false);
    return styles.tooltip(
      <SelectPrimitive.Trigger
        ref={ref}
        {...(sheet ? { 'aria-haspopup': 'dialog' as const } : {})}
        data-variant={variant}
        {...styles(
          'select.trigger',
          cn(
            inputClass,
            inputVariantClass(variant),
            'items-center justify-between gap-2 border-[color:var(--_ui-input-border,var(--ui-select-border))] bg-[var(--_ui-input-background,var(--ui-select-background))] text-[var(--_ui-input-foreground,var(--ui-select-foreground))] rounded-[var(--ui-select-radius)] min-h-[var(--ui-select-height)] focus-visible:outline-[var(--ui-select-focus)] text-start data-[placeholder]:text-[var(--ui-select-placeholder)] [&>span]:truncate',
          ),
          className,
          unstyled,
        )}
        {...props}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          cancelledPointer.current = event.defaultPrevented;
          // A sheet opens after release, rather than carrying the trigger's
          // pointer-down position into an asynchronously mounted listbox.
          if (
            clickActivation &&
            !event.defaultPrevented &&
            event.pointerType === 'mouse' &&
            event.button === 0 &&
            !event.ctrlKey
          )
            event.preventDefault();
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!clickActivation || event.defaultPrevented) return;
          event.preventDefault();
          if (!cancelledPointer.current && !event.ctrlKey) {
            event.currentTarget.focus();
            setOpen(true);
          }
          cancelledPointer.current = false;
        }}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            {...styles('select.icon', 'size-4 shrink-0 text-muted-foreground', undefined, unstyled)}
            aria-hidden="true"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>,
      unstyled,
    );
  },
);

SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & PlainStyleProps
>(({ className, children, position = 'popper', sideOffset = 6, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { sheet, open, title, setOpen } = React.useContext(SelectPresentationContext);
  const [sheetActive, setSheetActive] = React.useState(false);
  if (sheet && open && !sheetActive) setSheetActive(true);
  const [panel, setPanel] = React.useState<HTMLDivElement | null>(null);
  const panelRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setPanel(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useSelectionViewport(panel, sheet && open && !(unstyled ?? styles.unstyled));
  const portal = usePortalContainer();
  const titleId = React.useId();
  const content = (
    <SelectPrimitive.Content
      ref={panelRef}
      position={sheet ? 'item-aligned' : position}
      sideOffset={sideOffset}
      {...styles(
        'select.content',
        sheet
          ? 'min-w-0 overflow-hidden'
          : 'z-[var(--ui-layer-dropdown)] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] text-[var(--ui-popover-foreground,var(--ui-foreground))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))]',
        cn(sheet ? 'ui-select-sheet' : 'ui-popup', className),
        unstyled,
      )}
      {...props}
      {...(sheet ? { role: 'dialog' as const, 'aria-modal': true } : {})}
      aria-labelledby={
        props['aria-labelledby'] ?? (sheet && !props['aria-label'] ? titleId : undefined)
      }
      aria-label={
        props['aria-label'] ??
        (sheet ? (typeof title === 'string' ? title : t('select.options')) : undefined)
      }
      style={{
        ...(sheet && !(unstyled ?? styles.unstyled)
          ? ({
              position: 'fixed',
              insetInline: 0,
              top: 'auto',
              bottom: 'var(--_ui-selection-bottom, 0px)',
              width: 'min(100vw, 640px)',
              maxWidth: '100vw',
              marginInline: 'auto',
              maxHeight: 'min(85dvh, calc(var(--_ui-selection-height, 100dvh) - 16px))',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
            } as React.CSSProperties)
          : {}),
        ...props.style,
      }}
    >
      {!sheet && (
        <SelectPrimitive.ScrollUpButton
          {...styles('select.scroll-up', 'flex justify-center py-1', undefined, unstyled)}
        >
          <ChevronUp {...styles('select.scroll-icon', 'size-4', undefined, unstyled)} />
        </SelectPrimitive.ScrollUpButton>
      )}
      <SelectPrimitive.Viewport
        tabIndex={sheet ? 0 : undefined}
        {...(sheet ? { role: 'listbox', 'aria-labelledby': titleId } : {})}
        {...styles('select.viewport', 'min-h-0 p-1', undefined, unstyled)}
        onScroll={
          sheet
            ? (event) => {
                // The Sheet owns sizing. Cancel Radix's item-aligned popup expansion,
                // which otherwise rewrites scrollTop when keyboard focus moves to an edge.
                // The native scroll event is not cancelable; scrolling itself is preserved.
                event.preventDefault();
              }
            : undefined
        }
        style={
          sheet && !(unstyled ?? styles.unstyled)
            ? {
                maxHeight: 'calc(var(--_ui-selection-height, 100dvh) * 0.75 - 48px)',
                paddingBlockEnd: 'max(8px, env(safe-area-inset-bottom))',
              }
            : undefined
        }
      >
        {children}
      </SelectPrimitive.Viewport>
      {!sheet && (
        <SelectPrimitive.ScrollDownButton
          {...styles('select.scroll-down', 'flex justify-center py-1', undefined, unstyled)}
        >
          <ChevronDown {...styles('select.scroll-icon', 'size-4', undefined, unstyled)} />
        </SelectPrimitive.ScrollDownButton>
      )}
    </SelectPrimitive.Content>
  );
  if (sheet && sheetActive)
    return (
      <React.Suspense fallback={null}>
        <SelectSheet
          open={open}
          onOpenChange={setOpen}
          onExited={() => setSheetActive(false)}
          title={title ?? t('select.options')}
          titleId={titleId}
          content={content}
          unstyled={unstyled}
        />
      </React.Suspense>
    );
  return (
    <>
      <SelectPrimitive.Portal container={portal}>
        {styles.tooltip(content, unstyled)}
      </SelectPrimitive.Portal>
    </>
  );
});

SelectContent.displayName = 'SelectContent';

export const SelectItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <SelectPrimitive.Item
      ref={ref}
      {...styles(
        'select.item',
        'ui-interactive relative flex min-h-9 cursor-default select-none items-center rounded-[min(var(--ui-radius),4px)] py-2 pe-8 ps-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        {...styles('select.indicator', 'absolute end-2 flex items-center', undefined, unstyled)}
      >
        <Check {...styles('select.icon', 'size-4', undefined, unstyled)} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>,
    unstyled,
  );
});

SelectItem.displayName = 'SelectItem';

export const SelectLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <SelectPrimitive.Label
      ref={ref}
      {...styles(
        'select.label',
        'px-3 py-2 text-xs font-medium text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

SelectLabel.displayName = 'SelectLabel';

export const SelectSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <SelectPrimitive.Separator
      ref={ref}
      {...styles('select.separator', 'my-1 h-px bg-border', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

SelectSeparator.displayName = 'SelectSeparator';
