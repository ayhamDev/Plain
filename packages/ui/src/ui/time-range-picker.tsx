import { type TimeValue, type TimePickerProps, TimePicker } from './time-picker';
import * as React from 'react';
import { WallRange } from './temporal-range';

export interface TimeRange {
  from?: TimeValue;
  to?: TimeValue;
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

/** Native form names default to name[from] and name[to]; partial ranges are supported. */
export const TimeRangePicker = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  TimeRangePickerProps
>((props, ref) => (
  <WallRange kind="time" Picker={TimePicker} allProps={props} forwardedRef={ref} />
));

TimeRangePicker.displayName = 'TimeRangePicker';
