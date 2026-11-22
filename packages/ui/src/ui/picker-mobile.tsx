import * as React from 'react';
import { useMediaQuery } from './media-query';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from './sheet';
import { useStyles } from './style-context';

const query = '(max-width: 767px)';

/** Callers freeze this choice at open so rotation never swaps an active focus trap. */
export const useCompactPicker = () => useMediaQuery(query);

interface PickerMobileProps extends Omit<React.ComponentProps<typeof SheetContent>, 'title'> {
  temporal?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  summary?: React.ReactNode;
  steps?: React.ReactNode;
  footer: React.ReactNode;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}
export const PickerMobileContent = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  PickerMobileProps
>(
  (
    {
      temporal,
      title,
      description,
      summary,
      steps,
      footer,
      returnFocusRef,
      children,
      className,
      unstyled,
      onOpenAutoFocus,
      onCloseAutoFocus,
      ...props
    },
    forwardedRef,
  ) => {
    const styles = useStyles();
    const descriptionId = React.useId();
    const panelRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => panelRef.current!);
    return styles.tooltip(
      <SheetContent
        {...props}
        ref={panelRef}
        {...(temporal
          ? styles('temporal.mobile-panel', 'ui-picker-sheet', className, unstyled)
          : styles('picker.mobile-content', 'ui-picker-sheet', className, unstyled))}
        unstyled={unstyled}
        aria-describedby={description ? descriptionId : undefined}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          const panel = panelRef.current;
          const target =
            panel?.querySelector<HTMLElement>('.rdp-day_button[tabindex="0"]') ??
            panel?.querySelector<HTMLElement>('.rdp-selected .rdp-day_button:not(:disabled)') ??
            panel?.querySelector<HTMLElement>(
              '.rdp-day:not(.rdp-outside) .rdp-day_button:not(:disabled)',
            ) ??
            panel?.querySelector<HTMLElement>('[role="spinbutton"], [role="combobox"]');
          target?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          returnFocusRef.current?.focus({ preventScroll: true });
        }}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription id={descriptionId}>{description}</SheetDescription>}
        </SheetHeader>
        {steps}
        {summary && (
          <div {...styles('picker.summary', 'ui-picker-summary', undefined, unstyled)}>
            {summary}
          </div>
        )}
        <div
          {...(temporal
            ? styles(
                'temporal.mobile-body',
                'ui-picker-body ui-temporal-sheet-body',
                undefined,
                unstyled,
              )
            : styles('picker.body', 'ui-picker-body', undefined, unstyled))}
          data-vaul-no-drag
        >
          {children}
        </div>
        <div
          {...(temporal
            ? styles('temporal.done', 'ui-picker-footer ui-temporal-done', undefined, unstyled)
            : styles('picker.footer', 'ui-picker-footer', undefined, unstyled))}
        >
          {footer}
        </div>
      </SheetContent>,
      unstyled,
    );
  },
);
PickerMobileContent.displayName = 'PickerMobileContent';
