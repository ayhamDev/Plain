import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import * as React from 'react';
import { type InputVariant, inputClass, inputVariantClass } from './input-variants';
import { type CalendarProps, Calendar } from './calendar-view';
import { useTranslation, dateFormatter } from './i18n';
import { useCompactPicker, PickerMobileContent } from './picker-mobile';
import { Sheet, SheetTrigger } from './sheet';
import { Popover, PopoverTrigger } from './popover';
import { cn } from './utils';
import { CalendarDays } from 'lucide-react';
import { Button } from './button';
import { dateMatchModifiers } from 'react-day-picker';
import { PickerPopoverContent } from './picker-popover';

export interface DatePickerProps
  extends
    PlainStyleProps,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'value' | 'defaultValue' | 'onChange' | 'children'
    > {
  variant?: InputVariant;
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date | undefined) => void;
  placeholder?: string;
  name?: string;
  clearable?: boolean;
  calendarProps?: Omit<CalendarProps, 'mode' | 'selected' | 'onSelect' | 'required'>;
  locale?: string;
  clearLabel?: string;
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const DatePicker = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  DatePickerProps & PlainStyleProps
>((allProps, ref) => {
  const {
    variant = 'outlined',
    value,
    defaultValue,
    onValueChange,
    placeholder: placeholderProp,
    name,
    clearable = true,
    calendarProps,
    locale: localeProp,
    clearLabel: clearLabelProp,
    className,
    unstyled,
    ...props
  } = allProps;
  const language = useTranslation();
  const locale = localeProp ?? language.locale;
  const placeholder = placeholderProp ?? language.t('picker.chooseDate'),
    clearLabel = clearLabelProp ?? language.t('picker.clearDate');
  const isControlled = Object.prototype.hasOwnProperty.call(allProps, 'value');
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const compactScreen = useCompactPicker();
  const [openedCompact, setOpenedCompact] = React.useState(false);
  const compact = open ? openedCompact : compactScreen;
  const [draft, setDraft] = React.useState<Date>();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(ref, () => buttonRef.current!);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const candidate = isControlled ? value : internalValue;
  const current = candidate && Number.isFinite(candidate.getTime()) ? candidate : undefined;
  const setPickerOpen = (next: boolean) => {
    if (props.disabled) return;
    if (next && !open) {
      setOpenedCompact(compactScreen);
      setDraft(current);
    }
    setOpen(next);
  };
  const valueId = React.useId();
  const formattedValue = current
    ? dateFormatter(locale, {
        calendar: 'gregory',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(current)
    : placeholder;
  const select = (date: Date | undefined) => {
    if (!isControlled) setInternalValue(date);
    onValueChange?.(date);
    setOpen(false);
  };
  React.useEffect(() => {
    if (props.disabled) setOpen(false);
  }, [props.disabled]);
  React.useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (!isControlled) setInternalValue(defaultValue);
        setOpen(false);
      });
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [isControlled, defaultValue, props.form]);
  const PickerRoot = compact ? Sheet : Popover;
  const Trigger = compact ? SheetTrigger : PopoverTrigger;
  const calendar = (
    <Calendar
      localeCode={locale}
      mode="single"
      selected={compact ? draft : current}
      onSelect={compact ? setDraft : select}
      defaultMonth={(compact ? draft : current) ?? current}
      autoFocus={!compact}
      {...calendarProps}
    />
  );
  return (
    <StyleProvider unstyled={unstyled}>
      <PickerRoot
        open={open}
        onOpenChange={setPickerOpen}
        {...(compact
          ? { side: 'bottom' as const, maxWidth: 480, handleOnly: true, repositionInputs: false }
          : {})}
      >
        <Trigger asChild>
          {styles.tooltip(
            <button
              ref={buttonRef}
              type="button"
              data-variant={variant}
              {...styles(
                'date-picker.trigger',
                cn(
                  inputClass,
                  inputVariantClass(variant),
                  'items-center justify-start gap-2 font-normal text-start',
                  !current && 'text-muted-foreground',
                ),
                className,
                unstyled,
              )}
              aria-label={props['aria-label'] ?? placeholder}
              {...props}
              aria-describedby={[props['aria-describedby'], valueId].filter(Boolean).join(' ')}
            >
              <CalendarDays
                {...styles(
                  'date-picker.icon',
                  'size-4 shrink-0 text-muted-foreground',
                  undefined,
                  unstyled,
                )}
                aria-hidden="true"
              />
              {formattedValue}
            </button>,
            unstyled,
          )}
        </Trigger>
        <span id={valueId} hidden>
          {formattedValue}
        </span>
        {compact ? (
          <PickerMobileContent
            title={props['aria-label'] ?? placeholder}
            description={language.t('picker.dateHint')}
            returnFocusRef={buttonRef}
            unstyled={unstyled}
            summary={
              draft
                ? dateFormatter(locale, {
                    calendar: 'gregory',
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(draft)
                : placeholder
            }
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  {language.t('common.cancel')}
                </Button>
                <Button
                  disabled={
                    !draft ||
                    Boolean(
                      calendarProps?.disabled && dateMatchModifiers(draft, calendarProps.disabled),
                    )
                  }
                  onClick={() => select(draft)}
                >
                  {language.t('common.done')}
                </Button>
              </>
            }
          >
            {calendar}
            {clearable && current && (
              <Button variant="ghost" size="sm" onClick={() => select(undefined)}>
                {clearLabel}
              </Button>
            )}
          </PickerMobileContent>
        ) : (
          <PickerPopoverContent
            anchorRef={buttonRef}
            align="start"
            aria-label={props['aria-label'] ?? placeholder}
            aria-labelledby={props['aria-labelledby']}
            {...styles('date-picker.content', 'p-3', undefined, unstyled)}
          >
            {calendar}
            {clearable && current && (
              <div {...styles('date-picker.footer', 'mt-2 border-t pt-2', undefined, unstyled)}>
                <Button
                  variant="ghost"
                  size="sm"
                  {...styles('date-picker.clear', 'w-full', undefined, unstyled)}
                  onClick={() => select(undefined)}
                >
                  {clearLabel}
                </Button>
              </div>
            )}
          </PickerPopoverContent>
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            value={current ? localDateString(current) : ''}
            disabled={props.disabled}
            form={props.form}
          />
        )}
      </PickerRoot>
    </StyleProvider>
  );
});

DatePicker.displayName = 'DatePicker';
