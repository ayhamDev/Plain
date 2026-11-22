import { type DropdownProps, useDayPicker } from 'react-day-picker';
import { useStyles, useDirection } from './style-context';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import type * as React from 'react';

export function CalendarDropdown({
  options = [],
  value,
  onChange,
  className,
  style,
  ...props
}: DropdownProps) {
  const { classNames, styles: calendarStyles, dayPickerProps } = useDayPicker();
  const styles = useStyles();
  const dir = useDirection(dayPickerProps.dir as 'ltr' | 'rtl' | undefined);
  return (
    <span className={classNames.dropdown_root} style={calendarStyles?.dropdown_root}>
      <Select
        value={value === undefined ? undefined : String(value)}
        disabled={props.disabled}
        dir={dir}
        onValueChange={(next) => {
          // DayPicker's navigation adapter reads the selected value from the change target.
          const target = { value: next } as HTMLSelectElement;
          onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
        }}
      >
        <SelectTrigger
          {...styles('select.trigger', 'ui-calendar-select', className)}
          style={style}
          id={props.id}
          title={props.title}
          tabIndex={props.tabIndex}
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={props['aria-describedby']}
        >
          <SelectValue>
            {options.find((option) => String(option.value) === String(value))?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent collisionPadding={8}>
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}

export function yearMonth(year: number, month: number) {
  const date = new Date(0);
  date.setFullYear(year, month, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}
