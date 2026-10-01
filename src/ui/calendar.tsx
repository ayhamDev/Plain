import { StyleProvider, useStyles, useDirection, type PlainStyleProps } from './styling';
import * as React from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { cn } from './utils';
import { Button } from './primitives';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from './overlays';
export type CalendarProps = DayPickerProps;
export function Calendar({
  className,
  showOutsideDays = true,
  unstyled,
  ...props
}: CalendarProps & PlainStyleProps) {
  const styles = useStyles();
  const dir = useDirection(props.dir as 'ltr' | 'rtl' | undefined);
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      dir={dir}
      {...styles('calendar.root', 'ui-calendar', className, unstyled)}
      {...props}
    />
  );
}
export interface DatePickerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> {
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
    value,
    defaultValue,
    onValueChange,
    placeholder = 'Pick a date',
    name,
    clearable = true,
    calendarProps,
    locale = 'en',
    clearLabel = 'Clear date',
    className,
    unstyled,
    ...props
  } = allProps;
  const isControlled = Object.prototype.hasOwnProperty.call(allProps, 'value');
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const candidate = isControlled ? value : internalValue;
  const current = candidate && Number.isFinite(candidate.getTime()) ? candidate : undefined;
  const valueId = React.useId();
  const formattedValue = current
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
        current,
      )
    : placeholder;
  const select = (date: Date | undefined) => {
    if (!isControlled) setInternalValue(date);
    onValueChange?.(date);
    setOpen(false);
  };
  return (
    <StyleProvider unstyled={unstyled}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            {...styles(
              'date-picker.trigger',
              cn(
                'w-full justify-start border-input-border font-normal',
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
              {...styles('date-picker.icon', 'text-muted-foreground', undefined, unstyled)}
              aria-hidden="true"
            />
            {formattedValue}
          </Button>
        </PopoverTrigger>
        <span id={valueId} hidden>
          {formattedValue}
        </span>
        <PopoverContent
          align="start"
          {...styles('date-picker.content', 'p-3', undefined, unstyled)}
        >
          <Calendar
            mode="single"
            selected={current}
            onSelect={select}
            defaultMonth={current}
            autoFocus
            {...calendarProps}
          />
          {clearable && current && (
            <div {...styles('date-picker.footer', 'mt-2 border-t pt-2', undefined, unstyled)}>
              <PopoverClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  {...styles('date-picker.clear', 'w-full', undefined, unstyled)}
                  onClick={() => select(undefined)}
                >
                  {clearLabel}
                </Button>
              </PopoverClose>
            </div>
          )}
        </PopoverContent>
        {name && (
          <input
            type="hidden"
            name={name}
            value={current ? localDateString(current) : ''}
            disabled={props.disabled}
          />
        )}
      </Popover>
    </StyleProvider>
  );
});
DatePicker.displayName = 'DatePicker';
