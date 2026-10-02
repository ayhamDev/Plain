import * as React from 'react';
import { CalendarDays, Clock3, X } from 'lucide-react';
import { Temporal } from 'temporal-polyfill';
import {
  dateMatchModifiers,
  rangeContainsModifiers,
  type DateRange,
  type Matcher,
} from 'react-day-picker';
import { Calendar, type CalendarProps } from './calendar';
import { Button } from './primitives';
import { Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './forms';
import { Popover, PopoverContent, PopoverTrigger } from './overlays';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';
import { changeInput } from './utils';

export type { DateRange } from 'react-day-picker';

/** ISO wall-clock time: HH:mm, HH:mm:ss, or HH:mm:ss.SSS. Empty values are undefined. */
export type TimeValue = string;
/** ISO wall date/time: YYYY-MM-DDTHH:mm[:ss[.SSS]], without an offset or a Z suffix. */
export type DateTimeValue = string;
export interface TimeRange {
  from?: TimeValue;
  to?: TimeValue;
}
export interface DateTimeRange {
  from?: DateTimeValue;
  to?: DateTimeValue;
}

type WallInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'children'
> &
  PlainStyleProps;

export interface TimePickerProps extends WallInputProps {
  value?: TimeValue;
  defaultValue?: TimeValue;
  onValueChange?: (value: TimeValue | undefined) => void;
  min?: TimeValue;
  max?: TimeValue;
  locale?: string;
  clearable?: boolean;
  clearLabel?: string;
  minuteStep?: number;
  hourCycle?: 'h12' | 'h23';
  timeLabel?: string;
}

type PickerCalendarProps = Omit<
  CalendarProps,
  'mode' | 'selected' | 'onSelect' | 'required' | 'disabled'
>;

export interface DateTimePickerProps extends TimePickerProps {
  /** The value remains a wall time in this zone. No implicit conversion to UTC occurs. */
  timeZone?: string;
  /** How the chosen zone resolves repeated or nonexistent wall times. */
  disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject';
  disabledDates?: Matcher | Matcher[];
  calendarProps?: PickerCalendarProps;
  showCalendar?: boolean;
  calendarLabel?: string;
  invalidDateLabel?: string;
}

export interface TimeRangePickerProps extends Omit<
  TimePickerProps,
  'value' | 'defaultValue' | 'onValueChange'
> {
  value?: TimeRange;
  defaultValue?: TimeRange;
  onValueChange?: (value: TimeRange | undefined) => void;
  fromLabel?: string;
  toLabel?: string;
  fromName?: string;
  toName?: string;
  /** Permit an end time on the following day. Defaults to false. */
  allowOvernight?: boolean;
}

export interface DateTimeRangePickerProps extends Omit<
  DateTimePickerProps,
  'value' | 'defaultValue' | 'onValueChange'
> {
  value?: DateTimeRange;
  defaultValue?: DateTimeRange;
  onValueChange?: (value: DateTimeRange | undefined) => void;
  fromLabel?: string;
  toLabel?: string;
  fromName?: string;
  toName?: string;
}

export interface DateRangePickerProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'value' | 'defaultValue' | 'onChange' | 'children'
    >,
    PlainStyleProps {
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

function useValue<T>(
  props: { value?: T; defaultValue?: T; onValueChange?: (value: T | undefined) => void },
  ref: React.RefObject<HTMLInputElement | HTMLButtonElement | null>,
  controlled: boolean,
) {
  const [internal, setInternal] = React.useState(props.defaultValue);
  const { defaultValue } = props;
  React.useEffect(() => {
    const form = ref.current?.form;
    if (controlled || !form) return;
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) setInternal(defaultValue);
      });
    };
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [controlled, defaultValue, ref]);
  const change = (next: T | undefined) => {
    if (!controlled) setInternal(next);
    props.onValueChange?.(next);
  };
  return [controlled ? props.value : internal, change] as const;
}

function wallValue(value: string | undefined, kind: 'time' | 'datetime-local') {
  if (!value) return undefined;
  const time = /^\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
  const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
  if (!(kind === 'time' ? time : dateTime).test(value)) return undefined;
  try {
    if (kind === 'time') Temporal.PlainTime.from(value);
    else Temporal.PlainDateTime.from(value);
    return value;
  } catch {
    return undefined;
  }
}

function localDate(date: Date | undefined) {
  if (!date || !Number.isFinite(date.getTime())) return undefined;
  return Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }).toString();
}

function calendarDate(value: string | Date | undefined) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : undefined;
  if (!value) return undefined;
  try {
    const day = Temporal.PlainDate.from(value.slice(0, 10));
    const result = new Date(0);
    result.setFullYear(day.year, day.month - 1, day.day);
    result.setHours(12, 0, 0, 0);
    return result;
  } catch {
    return undefined;
  }
}

function formatDay(date: Date, locale?: string, options?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(
      locale,
      options ?? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    ).format(date);
  } catch {
    return new Intl.DateTimeFormat(
      'en',
      options ?? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    ).format(date);
  }
}

function calendarDefaults(providedLocale: string | undefined, props?: PickerCalendarProps) {
  const locale = providedLocale ?? props?.locale?.code;
  return {
    ...props,
    // Intl formats the displayed wall date; a supplied DayPicker locale also localizes navigation.
    formatters: {
      formatCaption: (date: Date) => formatDay(date, locale, { month: 'long', year: 'numeric' }),
      formatDay: (date: Date) => formatDay(date, locale, { day: 'numeric' }),
      formatWeekdayName: (date: Date) => formatDay(date, locale, { weekday: 'short' }),
      formatMonthDropdown: (date: Date) => formatDay(date, locale, { month: 'long' }),
      formatYearDropdown: (date: Date) => formatDay(date, locale, { year: 'numeric' }),
      ...props?.formatters,
    },
    labels: {
      labelDayButton: (date: Date) => formatDay(date, locale, { dateStyle: 'full' }),
      labelGrid: (date: Date) => formatDay(date, locale, { month: 'long', year: 'numeric' }),
      labelWeekday: (date: Date) => formatDay(date, locale, { weekday: 'long' }),
      ...props?.labels,
    },
  };
}

function matchers(min?: Date, max?: Date, disabled?: Matcher | Matcher[]) {
  return [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
    ...(disabled === undefined ? [] : Array.isArray(disabled) ? disabled : [disabled]),
  ];
}

function formattedWall(
  value: string | undefined,
  props: DateTimePickerProps,
  kind: 'time' | 'datetime-local',
) {
  if (!value) return '';
  try {
    if (kind === 'time') {
      return Temporal.PlainTime.from(value).toLocaleString(props.locale, {
        hour: 'numeric',
        minute: '2-digit',
        ...(value.length > 5 ? { second: '2-digit' } : {}),
      });
    }
    const date = Temporal.PlainDateTime.from(value);
    if (props.timeZone) {
      return date
        .toZonedDateTime(props.timeZone, { disambiguation: props.disambiguation })
        .toLocaleString(props.locale, { dateStyle: 'medium', timeStyle: 'short' });
    }
    return date.toLocaleString(props.locale, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function TimeChooser({
  value,
  onValueChange,
  minuteStep,
  hourCycle,
}: {
  value?: string;
  onValueChange: (time: string) => void;
  minuteStep: number;
  hourCycle: 'h12' | 'h23';
}) {
  const id = React.useId();
  const styles = useStyles();
  const time = Temporal.PlainTime.from(value ?? '09:00');
  const twelve = hourCycle === 'h12';
  const step = Number.isFinite(minuteStep) ? Math.max(1, Math.min(60, Math.round(minuteStep))) : 5;
  const minutes = [
    ...new Set([...Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step), time.minute]),
  ].sort((a, b) => a - b);
  const field = (
    label: string,
    current: number | string,
    items: (number | string)[],
    change: (value: string) => void,
  ) => (
    <div {...styles('temporal.time-choice', 'ui-time-choice')}>
      <Label htmlFor={`${id}-${label}`}>{label}</Label>
      <Select value={String(current)} onValueChange={change}>
        <SelectTrigger id={`${id}-${label}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item} value={String(item)}>
              {typeof item === 'number' ? String(item).padStart(2, '0') : item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  const update = (part: Partial<{ hour: number; minute: number; second: number }>) =>
    onValueChange(
      time.with(part).toString({
        smallestUnit: value?.includes('.')
          ? 'millisecond'
          : value && value.length > 5
            ? 'second'
            : 'minute',
      }),
    );
  return (
    <div {...styles('temporal.time-choices', 'ui-time-choices')} role="group" aria-label="Time">
      {field(
        'Hour',
        twelve ? time.hour % 12 || 12 : time.hour,
        Array.from({ length: twelve ? 12 : 24 }, (_, i) => (twelve ? i + 1 : i)),
        (value) =>
          update({
            hour: twelve ? (Number(value) % 12) + (time.hour >= 12 ? 12 : 0) : Number(value),
          }),
      )}
      {field('Minute', time.minute, minutes, (value) => update({ minute: Number(value) }))}
      {twelve &&
        field('Period', time.hour >= 12 ? 'PM' : 'AM', ['AM', 'PM'], (value) =>
          update({ hour: (time.hour % 12) + (value === 'PM' ? 12 : 0) }),
        )}
      {value &&
        value.length > 5 &&
        field(
          'Second',
          time.second,
          Array.from({ length: 60 }, (_, i) => i),
          (value) => update({ second: Number(value) }),
        )}
    </div>
  );
}

function TemporalInput({
  kind,
  allProps,
  forwardedRef,
}: {
  kind: 'time' | 'datetime-local';
  allProps: DateTimePickerProps;
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
}) {
  const {
    value: suppliedValue,
    defaultValue,
    onValueChange,
    min,
    max,
    locale,
    clearable = true,
    clearLabel = 'Clear value',
    minuteStep = 5,
    hourCycle = 'h23',
    timeLabel = 'Choose time',
    timeZone,
    disambiguation,
    disabledDates,
    calendarProps,
    showCalendar = true,
    calendarLabel = 'Open calendar',
    invalidDateLabel = 'Choose an available date and time',
    className,
    unstyled,
    dir,
    disabled,
    readOnly,
    onChange,
    onKeyDown,
    'aria-describedby': describedBy,
    ...props
  } = allProps;
  const styles = useStyles();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(forwardedRef, () => inputRef.current!);
  const [value, change] = useValue(
    { value: suppliedValue, defaultValue, onValueChange },
    inputRef,
    Object.prototype.hasOwnProperty.call(allProps, 'value'),
  );
  const current = wallValue(value, kind);
  const [open, setOpen] = React.useState(false);
  const formatId = React.useId();
  const selected = kind === 'datetime-local' ? calendarDate(current) : undefined;
  const unavailable = matchers(calendarDate(min), calendarDate(max), disabledDates);
  let invalid = kind === 'datetime-local' && selected && dateMatchModifiers(selected, unavailable);
  if (current && kind === 'datetime-local' && timeZone) {
    try {
      Temporal.PlainDateTime.from(current).toZonedDateTime(timeZone, { disambiguation });
    } catch {
      invalid = true;
    }
  }
  React.useEffect(() => {
    inputRef.current?.setCustomValidity(invalid ? invalidDateLabel : '');
  }, [invalid, invalidDateLabel]);
  React.useEffect(() => {
    if (disabled || readOnly) setOpen(false);
  }, [disabled, readOnly]);
  const selectValue = (next: string | undefined) => {
    if (!disabled && !readOnly) changeInput(inputRef.current, next ?? '');
  };
  const clear = () => {
    if (disabled || readOnly) return;
    selectValue(undefined);
    inputRef.current?.focus();
  };
  const pickDate = (date: Date | undefined) => {
    if (disabled || readOnly) return;
    const day = localDate(date);
    let next = day ? `${day}T${current?.split('T')[1] ?? '00:00'}` : undefined;
    if (next && min && wallValue(min, kind) && Temporal.PlainDateTime.compare(next, min) < 0)
      next = min;
    if (next && max && wallValue(max, kind) && Temporal.PlainDateTime.compare(next, max) > 0)
      next = max;
    selectValue(next);
  };
  const pickTime = (next: string) => {
    let candidate =
      kind === 'time' ? next : `${localDate(selected ?? calendarDate(min) ?? new Date())}T${next}`;
    const compare = kind === 'time' ? Temporal.PlainTime.compare : Temporal.PlainDateTime.compare;
    const lower = wallValue(min, kind),
      upper = wallValue(max, kind);
    // Native time inputs also support a range crossing midnight.
    if (kind === 'time' && lower && upper && compare(lower, upper) > 0) {
      if (compare(candidate, lower) < 0 && compare(candidate, upper) > 0) candidate = lower;
    } else {
      if (lower && compare(candidate, lower) < 0) candidate = lower;
      if (upper && compare(candidate, upper) > 0) candidate = upper;
    }
    selectValue(candidate);
  };
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        {...(kind === 'time'
          ? styles('time-picker.root', 'ui-temporal', undefined, unstyled)
          : styles('date-time-picker.root', 'ui-temporal', undefined, unstyled))}
        dir={direction}
        data-disabled={disabled ? '' : undefined}
      >
        <input
          {...styles('temporal.input', 'ui-temporal-input', className, unstyled)}
          {...props}
          ref={inputRef}
          type={kind}
          data-custom-picker=""
          data-calendar={kind === 'datetime-local' && showCalendar ? '' : undefined}
          value={current ?? ''}
          min={wallValue(min, kind)}
          max={wallValue(max, kind)}
          step={
            props.step ??
            (current?.includes('.')
              ? 0.001
              : current && current.length > (kind === 'time' ? 5 : 16)
                ? 1
                : 60)
          }
          required={props.required ?? props['aria-required'] === true}
          disabled={disabled}
          readOnly={readOnly}
          lang={props.lang ?? locale}
          dir={direction}
          aria-invalid={props['aria-invalid'] || invalid || undefined}
          aria-describedby={
            [describedBy, current ? formatId : undefined].filter(Boolean).join(' ') || undefined
          }
          onChange={(event) => {
            onChange?.(event);
            if (!event.defaultPrevented && !disabled && !readOnly)
              change(wallValue(event.currentTarget.value, kind));
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || disabled || readOnly) return;
            if (
              clearable &&
              (event.ctrlKey || event.metaKey) &&
              ['Backspace', 'Delete'].includes(event.key)
            ) {
              event.preventDefault();
              clear();
            }
            if ((kind === 'time' || showCalendar) && event.altKey && event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
        <span id={formatId} style={visuallyHidden}>
          {formattedWall(current, allProps, kind)}
        </span>
        {(kind === 'time' || showCalendar) && (
          <Popover open={open} onOpenChange={(next) => !disabled && !readOnly && setOpen(next)}>
            <PopoverTrigger asChild>
              <button
                type="button"
                {...styles('temporal.calendar-trigger', 'ui-temporal-action', undefined, unstyled)}
                disabled={disabled || readOnly}
                aria-label={kind === 'time' ? timeLabel : calendarLabel}
                title={kind === 'time' ? timeLabel : calendarLabel}
              >
                {kind === 'time' ? (
                  <Clock3 size={16} aria-hidden="true" />
                ) : (
                  <CalendarDays size={16} aria-hidden="true" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              {...styles('temporal.content', 'ui-temporal-content', undefined, unstyled)}
              dir={direction}
              aria-label={kind === 'time' ? timeLabel : calendarLabel}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                inputRef.current?.focus();
              }}
            >
              {kind === 'datetime-local' && (
                <Calendar
                  {...calendarDefaults(locale, calendarProps)}
                  mode="single"
                  selected={selected}
                  defaultMonth={calendarProps?.defaultMonth ?? selected ?? calendarDate(min)}
                  disabled={unavailable}
                  onSelect={pickDate}
                  autoFocus
                  dir={direction}
                />
              )}
              <TimeChooser
                value={kind === 'time' ? current : current?.split('T')[1]}
                onValueChange={pickTime}
                minuteStep={minuteStep}
                hourCycle={hourCycle}
              />
              <div {...styles('temporal.done', 'ui-temporal-done', undefined, unstyled)}>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {clearable && current && (
          <button
            type="button"
            {...styles('temporal.clear', 'ui-temporal-action', undefined, unstyled)}
            disabled={disabled || readOnly}
            onClick={clear}
            aria-label={clearLabel}
            title={clearLabel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </StyleProvider>
  );
}

export const TimePicker = /* @__PURE__ */ React.forwardRef<HTMLInputElement, TimePickerProps>(
  (props, ref) => <TemporalInput kind="time" allProps={props} forwardedRef={ref} />,
);
TimePicker.displayName = 'TimePicker';

export const DateTimePicker = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  DateTimePickerProps
>((props, ref) => <TemporalInput kind="datetime-local" allProps={props} forwardedRef={ref} />);
DateTimePicker.displayName = 'DateTimePicker';

function WallRange({
  kind,
  allProps,
  forwardedRef,
}: {
  kind: 'time' | 'datetime-local';
  allProps: DateTimeRangePickerProps & { allowOvernight?: boolean };
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
}) {
  const {
    value: suppliedValue,
    defaultValue,
    onValueChange,
    fromLabel = 'Start',
    toLabel = 'End',
    fromName,
    toName,
    name,
    min,
    max,
    allowOvernight = false,
    className,
    unstyled,
    id,
    dir,
    'aria-labelledby': labelledBy,
    'aria-label': label,
    ...props
  } = allProps;
  const styles = useStyles();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const generatedId = React.useId();
  const baseId = id ?? generatedId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(forwardedRef, () => inputRef.current!);
  const [value, change] = useValue(
    { value: suppliedValue, defaultValue, onValueChange },
    inputRef,
    Object.prototype.hasOwnProperty.call(allProps, 'value'),
  );
  const from = wallValue(value?.from, kind);
  const to = wallValue(value?.to, kind);
  const ordered = kind === 'datetime-local' || !allowOvernight;
  const compare = kind === 'time' ? Temporal.PlainTime.compare : Temporal.PlainDateTime.compare;
  const earlier = (a?: string, b?: string) => (!a ? b : !b ? a : compare(a, b) < 0 ? a : b);
  const later = (a?: string, b?: string) => (!a ? b : !b ? a : compare(a, b) > 0 ? a : b);
  const update = (key: 'from' | 'to', next: string | undefined) => {
    const range = { from, to, [key]: next };
    change(range.from || range.to ? range : undefined);
  };
  const Picker = kind === 'time' ? TimePicker : DateTimePicker;
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        {...(kind === 'time'
          ? styles('time-range-picker.root', 'ui-temporal-range', className, unstyled)
          : styles('date-time-range-picker.root', 'ui-temporal-range', className, unstyled))}
        dir={direction}
        role="group"
        aria-label={label}
        aria-labelledby={labelledBy}
      >
        <div {...styles('temporal.range-part', 'ui-temporal-range-part', undefined, unstyled)}>
          <label
            htmlFor={baseId}
            id={`${baseId}-from-label`}
            {...styles('temporal.range-label', 'ui-temporal-range-label', undefined, unstyled)}
          >
            {fromLabel}
          </label>
          <Picker
            {...props}
            ref={inputRef}
            id={baseId}
            name={fromName ?? (name ? `${name}[from]` : undefined)}
            dir={direction}
            value={from}
            min={wallValue(min, kind)}
            max={ordered ? earlier(wallValue(max, kind), to) : wallValue(max, kind)}
            aria-labelledby={[labelledBy, `${baseId}-from-label`].filter(Boolean).join(' ')}
            aria-label={label ? `${label} ${fromLabel}` : undefined}
            onValueChange={(next) => update('from', next)}
          />
        </div>
        <div {...styles('temporal.range-part', 'ui-temporal-range-part', undefined, unstyled)}>
          <label
            htmlFor={`${baseId}-to`}
            id={`${baseId}-to-label`}
            {...styles('temporal.range-label', 'ui-temporal-range-label', undefined, unstyled)}
          >
            {toLabel}
          </label>
          <Picker
            {...props}
            id={`${baseId}-to`}
            name={toName ?? (name ? `${name}[to]` : undefined)}
            dir={direction}
            value={to}
            min={ordered ? later(wallValue(min, kind), from) : wallValue(min, kind)}
            max={wallValue(max, kind)}
            aria-labelledby={[labelledBy, `${baseId}-to-label`].filter(Boolean).join(' ')}
            aria-label={label ? `${label} ${toLabel}` : undefined}
            onValueChange={(next) => update('to', next)}
          />
        </div>
      </div>
    </StyleProvider>
  );
}

/** Native form names default to name[from] and name[to]; partial ranges are supported. */
export const TimeRangePicker = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  TimeRangePickerProps
>((props, ref) => <WallRange kind="time" allProps={props} forwardedRef={ref} />);
TimeRangePicker.displayName = 'TimeRangePicker';

/** Both endpoints are ISO wall times in the same optional timeZone. */
export const DateTimeRangePicker = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  DateTimeRangePickerProps
>((props, ref) => <WallRange kind="datetime-local" allProps={props} forwardedRef={ref} />);
DateTimeRangePicker.displayName = 'DateTimeRangePicker';

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

/** DayPicker handles selection, inclusive ranges, disabled days, and keyboard navigation. */
export const DateRangePicker = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  DateRangePickerProps
>((allProps, forwardedRef) => {
  const {
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
    locale,
    placeholder = 'Pick a date range',
    clearable = true,
    clearLabel = 'Clear date range',
    invalidRangeLabel = 'Choose an available date range',
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
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const validationRefs = React.useRef<Partial<Record<'from' | 'to', HTMLInputElement | null>>>({});
  React.useImperativeHandle(forwardedRef, () => buttonRef.current!);
  const [value, change] = useValue(
    { value: suppliedValue, defaultValue, onValueChange },
    buttonRef,
    Object.prototype.hasOwnProperty.call(allProps, 'value'),
  );
  const [open, setOpen] = React.useState(false);
  const from = calendarDate(value?.from);
  const to = calendarDate(value?.to);
  const current = from || to ? { from, to } : undefined;
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
  const select = (next: DateRange | undefined) => {
    if (disabled || readOnly) return;
    change(next);
    if (next?.to && current?.from) setOpen(false);
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
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        {...styles('date-range-picker.root', 'ui-temporal', undefined, unstyled)}
        dir={direction}
      >
        <Popover open={open} onOpenChange={(next) => !disabled && !readOnly && setOpen(next)}>
          <PopoverTrigger asChild>
            <button
              {...styles('date-range-picker.trigger', 'ui-date-range-trigger', className, unstyled)}
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
                  setOpen(true);
                }
              }}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span
                {...styles('date-range-picker.value', 'ui-date-range-value', undefined, unstyled)}
              >
                {formatted}
              </span>
            </button>
          </PopoverTrigger>
          <span id={valueId} style={visuallyHidden}>
            {formatted}
          </span>
          <PopoverContent
            align="start"
            {...styles('date-range-picker.content', 'ui-temporal-content', undefined, unstyled)}
            dir={direction}
            aria-label={props['aria-label'] ?? placeholder}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              buttonRef.current?.focus();
            }}
          >
            <Calendar
              {...calendarDefaults(locale, calendarProps)}
              mode="range"
              selected={current}
              onSelect={select}
              defaultMonth={calendarProps?.defaultMonth ?? from ?? minimum}
              disabled={unavailable}
              min={minNights}
              max={maxNights}
              excludeDisabled
              autoFocus
              dir={direction}
            />
          </PopoverContent>
        </Popover>
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
