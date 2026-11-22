import { type TimePickerProps } from './time-picker';
import { type Matcher } from 'react-day-picker';
import { type PickerCalendarProps } from './date-time-internal';
import * as React from 'react';
import { TemporalInput } from './temporal-input';
import { Calendar } from './calendar-view';

/** ISO wall date/time: YYYY-MM-DDTHH:mm[:ss[.SSS]], without an offset or a Z suffix. */
export type DateTimeValue = string;

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

export const DateTimePicker = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  DateTimePickerProps
>((props, ref) => (
  <TemporalInput
    kind="datetime-local"
    CalendarComponent={Calendar}
    allProps={props}
    forwardedRef={ref}
  />
));

DateTimePicker.displayName = 'DateTimePicker';
