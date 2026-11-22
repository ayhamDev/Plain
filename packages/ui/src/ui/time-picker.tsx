import { type WallInputProps } from './date-time-internal';
import * as React from 'react';
import { type PopoverContent } from './popover';
import { TemporalInput } from './temporal-input';

/** ISO wall-clock time: HH:mm, HH:mm:ss, or HH:mm:ss.SSS. Empty values are undefined. */
export type TimeValue = string;

export type TimePickerMode = 'auto' | 'select' | 'wheel';

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
  /** Use AM/PM or 24-hour time in both the field and picker. Takes precedence over hourCycle. */
  hour12?: boolean;
  /** Opt into native keyboard editing instead of the default click-to-open picker field. */
  editable?: boolean;
  /** Desktop placement, collision boundaries and native popover handlers. */
  popoverProps?: Omit<React.ComponentProps<typeof PopoverContent>, 'children' | 'dir' | 'unstyled'>;
  /** Auto uses wheels on screens below 768px. Compact screens use a bottom sheet. */
  pickerMode?: TimePickerMode;
  timeLabel?: string;
}

export const TimePicker = /* @__PURE__ */ React.forwardRef<HTMLInputElement, TimePickerProps>(
  (props, ref) => <TemporalInput kind="time" allProps={props} forwardedRef={ref} />,
);

TimePicker.displayName = 'TimePicker';
