import * as React from 'react';
import { type PlainStyleProps, useStyles, useDirection, StyleProvider } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import {
  type DateRange,
  type Matcher,
  rangeContainsModifiers,
  dateMatchModifiers,
} from 'react-day-picker';
import {
  type PickerCalendarProps,
  useValue,
  calendarDate,
  matchers,
  formatDay,
  localDate,
  calendarDefaults,
  visuallyHidden,
} from './date-time-internal';
import { useTranslation } from './i18n';
import { useCompactPicker, PickerMobileContent } from './picker-mobile';
import { Temporal } from 'temporal-polyfill';
import { Sheet, SheetTrigger } from './sheet';
import { Popover, PopoverTrigger } from './popover';
import { Calendar } from './calendar-view';
import { CalendarDays, X } from 'lucide-react';
import { Button } from './button';
import { PickerPopoverContent } from './picker-popover';

export interface DateRangePickerProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'value' | 'defaultValue' | 'onChange' | 'children'
    >,
    PlainStyleProps {
  variant?: InputVariant;
  /** DayPicker's inclusive range. Dates use their local calendar date, never toISOString(). */
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange | undefined) => void;
  min?: Date | string;
  max?: Date | string;
  disabledDates?: Matcher | Matcher[];
  minNights?: number;
  maxNights?: number;
  required?: boolean;
  readOnly?: boolean;
  locale?: string;
  placeholder?: string;
  clearable?: boolean;
  clearLabel?: string;
  fromName?: string;
  toName?: string;
  invalidRangeLabel?: string;
  calendarProps?: PickerCalendarProps;
}

/** DayPicker handles selection, inclusive ranges, disabled days, and keyboard navigation. */
export const DateRangePicker = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  DateRangePickerProps
>((allProps, forwardedRef) => {
  const {
    variant = 'outlined',
    value: suppliedValue,
    defaultValue,
    onValueChange,
    min,
    max,
    disabledDates,
    minNights,
    maxNights,
    name,
    fromName,
    toName,
    required,
    readOnly,
    locale: localeProp,
    placeholder: placeholderProp,
    clearable = true,
    clearLabel: clearLabelProp,
    invalidRangeLabel: invalidRangeLabelProp,
    calendarProps,
    className,
    unstyled,
    dir,
    disabled,
    onKeyDown,
    ...props
  } = allProps;
  const styles = useStyles();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const language = useTranslation();
  const locale = localeProp ?? language.locale;
  const placeholder = placeholderProp ?? language.t('picker.selectRange'),
    clearLabel = clearLabelProp ?? language.t('picker.clearRange'),
    invalidRangeLabel = invalidRangeLabelProp ?? language.t('picker.invalidRange');
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const validationRefs = React.useRef<Partial<Record<'from' | 'to', HTMLInputElement | null>>>({});
  React.useImperativeHandle(forwardedRef, () => buttonRef.current!);
  const [value, change] = useValue(
    { value: suppliedValue, defaultValue, onValueChange },
    buttonRef,
    Object.prototype.hasOwnProperty.call(allProps, 'value'),
  );
  const [open, setOpen] = React.useState(false);
  const compactScreen = useCompactPicker();
  const [openedCompact, setOpenedCompact] = React.useState(false);
  const compact = open ? openedCompact : compactScreen;
  const [draft, setDraft] = React.useState<DateRange>();
  const from = calendarDate(value?.from);
  const to = calendarDate(value?.to);
  const current = from || to ? { from, to } : undefined;
  const shownRange = compact && open ? draft : current;
  const setPickerOpen = (next: boolean) => {
    if (disabled || readOnly) return;
    if (next && !open) {
      setOpenedCompact(compactScreen);
      setDraft(current);
    }
    setOpen(next);
  };
  const minimum = calendarDate(min);
  const maximum = calendarDate(max);
  const unavailable = matchers(minimum, maximum, disabledDates);
  const isRequired = required ?? props['aria-required'] === true;
  const formatted = from
    ? `${formatDay(from, locale)}${to ? ` - ${formatDay(to, locale)}` : ' - ...'}`
    : placeholder;
  const valueId = React.useId();
  React.useEffect(() => {
    if (disabled || readOnly) setOpen(false);
  }, [disabled, readOnly]);
  React.useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (!event.defaultPrevented) setOpen(false);
      });
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [props.form]);
  const select = (next: DateRange | undefined) => {
    if (disabled || readOnly) return;
    change(next);
  };
  const clear = () => {
    select(undefined);
    setOpen(false);
    buttonRef.current?.focus();
  };
  const nights =
    from && to
      ? Temporal.PlainDate.from(localDate(from)!).until(localDate(to)!, { largestUnit: 'days' })
          .days
      : undefined;
  const invalid =
    (nights !== undefined &&
      (nights < 0 ||
        (minNights !== undefined && nights < minNights) ||
        (maxNights !== undefined && nights > maxNights))) ||
    Boolean(from && to && rangeContainsModifiers({ from, to }, unavailable)) ||
    Boolean(from && dateMatchModifiers(from, unavailable)) ||
    Boolean(to && dateMatchModifiers(to, unavailable));
  React.useEffect(() => {
    for (const input of Object.values(validationRefs.current))
      input?.setCustomValidity(invalid ? invalidRangeLabel : '');
  }, [invalid, invalidRangeLabel]);
  const draftNights =
    draft?.from && draft.to
      ? Temporal.PlainDate.from(localDate(draft.from)!).until(localDate(draft.to)!, {
          largestUnit: 'days',
        }).days
      : undefined;
  const canConfirm =
    draftNights !== undefined &&
    draftNights >= (minNights ?? 0) &&
    (maxNights === undefined || draftNights <= maxNights) &&
    !rangeContainsModifiers(draft as { from: Date; to: Date }, unavailable);
  const PickerRoot = compact ? Sheet : Popover;
  const Trigger = compact ? SheetTrigger : PopoverTrigger;
  const calendar = (
    <Calendar
      {...calendarDefaults(locale, calendarProps)}
      mode="range"
      resetOnSelect
      required
      selected={shownRange}
      onSelect={compact ? setDraft : select}
      numberOfMonths={calendarProps?.numberOfMonths ?? (compact ? 2 : 1)}
      defaultMonth={calendarProps?.defaultMonth ?? shownRange?.from ?? minimum}
      startMonth={calendarProps?.startMonth ?? minimum}
      endMonth={calendarProps?.endMonth ?? maximum}
      disabled={unavailable}
      min={minNights}
      max={maxNights}
      excludeDisabled
      autoFocus={!compact}
      dir={direction}
    />
  );
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        {...styles(
          'date-range-picker.root',
          `ui-temporal ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
        dir={direction}
      >
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
                {...styles(
                  'date-range-picker.trigger',
                  'ui-date-range-trigger',
                  className,
                  unstyled,
                )}
                {...props}
                ref={buttonRef}
                type="button"
                disabled={disabled}
                aria-readonly={readOnly || undefined}
                aria-required={isRequired || undefined}
                aria-invalid={props['aria-invalid'] || invalid || undefined}
                aria-describedby={[props['aria-describedby'], valueId].filter(Boolean).join(' ')}
                onKeyDown={(event) => {
                  onKeyDown?.(event);
                  if (event.defaultPrevented || disabled || readOnly) return;
                  if (clearable && ['Backspace', 'Delete'].includes(event.key)) {
                    event.preventDefault();
                    clear();
                  }
                  if (event.altKey && event.key === 'ArrowDown') {
                    event.preventDefault();
                    setPickerOpen(true);
                  }
                }}
              >
                <CalendarDays size={16} aria-hidden="true" />
                <span
                  {...styles('date-range-picker.value', 'ui-date-range-value', undefined, unstyled)}
                >
                  {formatted}
                </span>
              </button>,
              unstyled,
            )}
          </Trigger>
          <span id={valueId} style={visuallyHidden}>
            {formatted}
          </span>
          {compact ? (
            <PickerMobileContent
              title={props['aria-label'] ?? placeholder}
              description={language.t('picker.rangeHint')}
              returnFocusRef={buttonRef}
              dir={direction}
              unstyled={unstyled}
              summary={
                <div
                  {...styles(
                    'picker.range-summary',
                    'ui-picker-range-summary',
                    undefined,
                    unstyled,
                  )}
                >
                  <div>
                    <span>{language.t('picker.from')}</span>
                    <strong>{draft?.from ? formatDay(draft.from, locale) : '—'}</strong>
                  </div>
                  <div>
                    <span>{language.t('picker.to')}</span>
                    <strong>{draft?.to ? formatDay(draft.to, locale) : '—'}</strong>
                  </div>
                </div>
              }
              footer={
                <>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    {language.t('common.cancel')}
                  </Button>
                  <Button
                    disabled={!canConfirm}
                    onClick={() => {
                      select(draft);
                      setOpen(false);
                    }}
                  >
                    {language.t('common.done')}
                  </Button>
                </>
              }
            >
              {calendar}
            </PickerMobileContent>
          ) : (
            <PickerPopoverContent
              anchorRef={buttonRef}
              align="start"
              {...styles('date-range-picker.content', 'ui-temporal-content', undefined, unstyled)}
              dir={direction}
              aria-label={props['aria-label'] ?? placeholder}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                buttonRef.current?.focus();
              }}
            >
              {calendar}
              <div
                {...styles(
                  'date-range-picker.footer',
                  'ui-temporal-done mt-4',
                  undefined,
                  unstyled,
                )}
              >
                <Button onClick={() => setOpen(false)}>{language.t('common.done')}</Button>
              </div>
            </PickerPopoverContent>
          )}
        </PickerRoot>
        {clearable && current && (
          <button
            {...styles('date-range-picker.clear', 'ui-temporal-action', undefined, unstyled)}
            type="button"
            disabled={disabled || readOnly}
            onClick={clear}
            aria-label={clearLabel}
            title={clearLabel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        {(['from', 'to'] as const).map((key) => (
          <input
            key={key}
            ref={(input) => {
              validationRefs.current[key] = input;
            }}
            type="date"
            style={visuallyHidden}
            tabIndex={-1}
            aria-hidden="true"
            form={props.form}
            name={(key === 'from' ? fromName : toName) ?? (name ? `${name}[${key}]` : undefined)}
            value={localDate(key === 'from' ? from : to) ?? ''}
            min={key === 'to' ? localDate(from ?? minimum) : localDate(minimum)}
            max={key === 'from' ? localDate(to ?? maximum) : localDate(maximum)}
            required={isRequired}
            disabled={disabled}
            readOnly={readOnly}
            onChange={() => {}}
            onInvalid={(event) => {
              event.preventDefault();
              buttonRef.current?.focus();
              if (!readOnly) setOpen(true);
            }}
          />
        ))}
      </div>
    </StyleProvider>
  );
});

DateRangePicker.displayName = 'DateRangePicker';
