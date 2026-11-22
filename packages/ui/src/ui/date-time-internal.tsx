import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant } from './input-variants';
import { type CalendarProps } from './calendar-view';
import { Temporal } from 'temporal-polyfill';
import { dateFormatter, useTranslation, numberFormatter } from './i18n';
import { type Matcher } from 'react-day-picker';
import { type DateTimePickerProps } from './date-time-picker';
import { type TimeWheelHandle, TimeWheel } from './time-wheel';
import { Label } from './label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';

export type WallInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'children'
> &
  PlainStyleProps & { variant?: InputVariant };

export type PickerCalendarProps = Omit<
  CalendarProps,
  'mode' | 'selected' | 'onSelect' | 'required' | 'disabled'
>;

export function useValue<T>(
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

export function wallValue(value: string | undefined, kind: 'time' | 'datetime-local') {
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

export function localDate(date: Date | undefined) {
  if (!date || !Number.isFinite(date.getTime())) return undefined;
  return Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }).toString();
}

export function calendarDate(value: string | Date | undefined) {
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

export function formatDay(date: Date, locale?: string, options?: Intl.DateTimeFormatOptions) {
  const format: Intl.DateTimeFormatOptions = {
    calendar: 'gregory',
    ...(options ?? { year: 'numeric', month: 'short', day: 'numeric' }),
  };
  try {
    return dateFormatter(locale, format).format(date);
  } catch {
    return dateFormatter('en', format).format(date);
  }
}

export function calendarDefaults(providedLocale: string | undefined, props?: PickerCalendarProps) {
  const locale = providedLocale ?? props?.locale?.code;
  return {
    ...props,
    localeCode: locale,
    // Intl formats the displayed wall date; a supplied DayPicker locale also localizes navigation.
    formatters: {
      formatCaption: (date: Date) => formatDay(date, locale, { month: 'long', year: 'numeric' }),
      formatDay: (date: Date) => formatDay(date, locale, { day: 'numeric' }),
      formatWeekdayName: (date: Date) =>
        formatDay(date, locale, { weekday: locale?.startsWith('ar') ? 'narrow' : 'short' }),
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

export function matchers(min?: Date, max?: Date, disabled?: Matcher | Matcher[]) {
  return [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
    ...(disabled === undefined ? [] : Array.isArray(disabled) ? disabled : [disabled]),
  ];
}

export function formattedWall(
  value: string | undefined,
  props: DateTimePickerProps,
  kind: 'time' | 'datetime-local',
) {
  if (!value) return '';
  try {
    const hourCycle =
      props.hour12 === undefined ? (props.hourCycle ?? 'h23') : props.hour12 ? 'h12' : 'h23';
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle,
      ...(value.split('T').at(-1)!.length > 5 ? { second: '2-digit' as const } : {}),
      ...(value.includes('.') ? { fractionalSecondDigits: 3 as const } : {}),
    };
    if (kind === 'time') {
      return Temporal.PlainTime.from(value).toLocaleString(props.locale, timeOptions);
    }
    const dateOptions: Intl.DateTimeFormatOptions = {
      ...timeOptions,
      calendar: 'gregory',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const date = Temporal.PlainDateTime.from(value);
    if (props.timeZone) {
      return date
        .toZonedDateTime(props.timeZone, { disambiguation: props.disambiguation })
        .toLocaleString(props.locale, dateOptions);
    }
    return date.toLocaleString(props.locale, dateOptions);
  } catch {
    return value;
  }
}

type TimePart = 'hour' | 'minute' | 'second' | 'period';

export interface TimeChooserHandle {
  commit: (acceptDefault?: boolean) => void;
  discard: () => void;
}

const usePickerLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export function TimeChooser({
  value,
  onValueChange,
  minuteStep,
  hourCycle,
  wheel,
  locale,
  actions,
}: {
  value?: string;
  onValueChange: (time: string) => void;
  minuteStep: number;
  hourCycle: 'h12' | 'h23';
  wheel: boolean;
  locale: string;
  actions: React.RefObject<TimeChooserHandle | null>;
}) {
  const id = React.useId();
  const styles = useStyles();
  const { t } = useTranslation();
  const time = Temporal.PlainTime.from(value ?? '09:00');
  const wheels = React.useRef<Partial<Record<TimePart, TimeWheelHandle | null>>>({});
  const numberFormat = numberFormatter(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const [initialMinute] = React.useState(time.minute);
  const twelve = hourCycle === 'h12';
  const step = Number.isFinite(minuteStep) ? Math.max(1, Math.min(60, Math.round(minuteStep))) : 1;
  const minutes = [
    ...new Set([
      ...Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step),
      initialMinute,
      time.minute,
    ]),
  ].sort((a, b) => a - b);
  const optionLabel = (item: number | string) =>
    typeof item === 'number'
      ? numberFormat.format(item)
      : (dateFormatter(locale, { hour: 'numeric', hour12: true, timeZone: 'UTC' })
          .formatToParts(new Date(Date.UTC(2000, 0, 1, item === 'PM' ? 15 : 3)))
          .find((part) => part.type === 'dayPeriod')?.value ?? String(item));
  const field = (
    part: TimePart,
    current: number | string,
    items: (number | string)[],
    change: (value: string) => void,
  ) => (
    <div {...styles('temporal.time-choice', 'ui-time-choice')}>
      <Label id={`${id}-${part}-label`} htmlFor={wheel ? undefined : `${id}-${part}`}>
        {t(`picker.${part}`)}
      </Label>
      {wheel ? (
        <TimeWheel
          ref={(handle) => {
            wheels.current[part] = handle;
          }}
          id={`${id}-${part}`}
          labelledBy={`${id}-${part}-label`}
          value={String(current)}
          options={items.map((item) => ({
            value: String(item),
            label: optionLabel(item),
          }))}
          onValueChange={change}
        />
      ) : (
        <Select value={String(current)} onValueChange={change}>
          <SelectTrigger id={`${id}-${part}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {optionLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
  usePickerLayoutEffect(() => {
    const consume = () => {
      const draft: Partial<Record<TimePart, string>> = {};
      for (const part of ['hour', 'minute', 'period', 'second'] as const) {
        const pending = wheels.current[part]?.consumePending();
        if (pending !== undefined) draft[part] = pending;
      }
      return draft;
    };
    actions.current = {
      commit(acceptDefault) {
        const draft = consume();
        if (!Object.keys(draft).length && !(acceptDefault && !value)) return;
        let hour =
          draft.hour === undefined
            ? time.hour
            : twelve
              ? (Number(draft.hour) % 12) + (time.hour >= 12 ? 12 : 0)
              : Number(draft.hour);
        if (draft.period !== undefined) hour = (hour % 12) + (draft.period === 'PM' ? 12 : 0);
        update({
          hour,
          minute: Number(draft.minute ?? time.minute),
          second: Number(draft.second ?? time.second),
        });
      },
      discard() {
        consume();
      },
    };
    return () => {
      actions.current = null;
    };
  });
  return (
    <div
      {...styles('temporal.time-choices', 'ui-time-choices')}
      data-mode={wheel ? 'wheel' : 'select'}
      role="group"
      aria-label={t('picker.time')}
    >
      {field(
        'hour',
        twelve ? time.hour % 12 || 12 : time.hour,
        Array.from({ length: twelve ? 12 : 24 }, (_, i) => (twelve ? i + 1 : i)),
        (value) =>
          update({
            hour: twelve ? (Number(value) % 12) + (time.hour >= 12 ? 12 : 0) : Number(value),
          }),
      )}
      {field('minute', time.minute, minutes, (value) => update({ minute: Number(value) }))}
      {twelve &&
        field('period', time.hour >= 12 ? 'PM' : 'AM', ['AM', 'PM'], (value) =>
          update({ hour: (time.hour % 12) + (value === 'PM' ? 12 : 0) }),
        )}
      {value &&
        value.length > 5 &&
        field(
          'second',
          time.second,
          Array.from({ length: 60 }, (_, i) => i),
          (value) => update({ second: Number(value) }),
        )}
    </div>
  );
}

export const visuallyHidden: React.CSSProperties = {
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
