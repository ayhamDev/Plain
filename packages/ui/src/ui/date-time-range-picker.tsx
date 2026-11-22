import { type DateTimeValue, type DateTimePickerProps, DateTimePicker } from './date-time-picker';
import * as React from 'react';
import { WallRange } from './temporal-range';

export interface DateTimeRange {
  from?: DateTimeValue;
  to?: DateTimeValue;
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

/** Both endpoints are ISO wall times in the same optional timeZone. */
export const DateTimeRangePicker = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  DateTimeRangePickerProps
>((props, ref) => (
  <WallRange kind="datetime-local" Picker={DateTimePicker} allProps={props} forwardedRef={ref} />
));

DateTimeRangePicker.displayName = 'DateTimeRangePicker';
