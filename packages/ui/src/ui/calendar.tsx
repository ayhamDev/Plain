import { StyleProvider, useStyles, useDirection, type PlainStyleProps } from './styling';
import * as React from 'react';
import { ar, enUS } from 'react-day-picker/locale';
import { dateFormatter, numberFormatter, useTranslation } from './i18n';
import { DayPicker, labelDayButton, type DayPickerProps } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { cn } from './utils';
import { Button } from './primitives';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from './overlays';
export type CalendarProps = DayPickerProps & { localeCode?: string };
function yearMonth(year: number, month: number) {
  const date = new Date(0);
  date.setFullYear(year, month, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}
export function Calendar({
  className,
  showOutsideDays = true,
  unstyled,
  localeCode,
  labels,
  formatters,
  captionLayout = 'dropdown',
  navLayout = 'after',
  ...props
}: CalendarProps & PlainStyleProps) {
  const styles = useStyles();
  const language = useTranslation();
  const locale = localeCode ?? props.locale?.code ?? language.locale;
  const dir = useDirection(props.dir as 'ltr' | 'rtl' | undefined);
  // The default engine lays out Gregorian months, including for Intl locales
  // whose default display calendar is Persian, Buddhist or Islamic.
  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
    dateFormatter(locale, { calendar: 'gregory', ...options }).format(date);
  const dayLabel = (date: Date, modifiers: { today?: boolean; selected?: boolean }) =>
    [
      modifiers.today ? language.t('picker.today') : '',
      locale === 'en' || locale === 'en-US'
        ? labelDayButton(date, {})
        : formatDate(date, { dateStyle: 'full' }),
      modifiers.selected ? language.t('picker.selected') : '',
    ]
      .filter(Boolean)
      .join(', ');
  const [referenceDate] = React.useState(() => new Date());
  const today = props.today ?? referenceDate;
  const displayedYear = (props.month ?? props.defaultMonth ?? today).getFullYear();
  const hasYearDropdown = captionLayout === 'dropdown' || captionLayout === 'dropdown-years';
  // DayPicker's year dropdown otherwise stops at this year. Include future dates,
  // one-sided bounds and an explicitly displayed year outside the default window.
  const startMonth =
    props.startMonth ??
    (hasYearDropdown
      ? yearMonth(Math.min((props.endMonth ?? today).getFullYear() - 100, displayedYear), 0)
      : undefined);
  const endMonth =
    props.endMonth ??
    (hasYearDropdown
      ? yearMonth(Math.max((props.startMonth ?? today).getFullYear() + 100, displayedYear), 11)
      : undefined);
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout={navLayout}
      dir={dir}
      locale={locale.startsWith('ar') ? ar : enUS}
      lang={locale}
      labels={{
        labelPrevious: () => language.t('calendar.previous'),
        labelNext: () => language.t('calendar.next'),
        labelMonthDropdown: () => language.t('picker.monthDropdown'),
        labelYearDropdown: () => language.t('picker.yearDropdown'),
        labelNav: () => language.t('calendar.label'),
        labelWeekNumberHeader: () => language.t('picker.weekHeader'),
        labelWeekNumber: (number) => language.t('picker.weekNumber', { number }),
        labelDayButton: dayLabel,
        labelGridcell: (date, modifiers) => dayLabel(date, modifiers ?? {}),
        labelGrid: (date) => formatDate(date, { month: 'long', year: 'numeric' }),
        labelWeekday: (date) => formatDate(date, { weekday: 'long' }),
        ...labels,
      }}
      formatters={{
        formatCaption: (date) => formatDate(date, { month: 'long', year: 'numeric' }),
        formatDay: (date) => formatDate(date, { day: 'numeric' }),
        formatWeekdayName: (date) =>
          formatDate(date, { weekday: locale.startsWith('ar') ? 'narrow' : 'short' }),
        formatMonthDropdown: (date) => formatDate(date, { month: 'long' }),
        formatYearDropdown: (date) => formatDate(date, { year: 'numeric' }),
        formatWeekNumber: (number) => numberFormatter(locale).format(number),
        ...formatters,
      }}
      {...styles('calendar.root', 'ui-calendar', className, unstyled)}
      {...props}
      startMonth={startMonth}
      endMonth={endMonth}
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
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const candidate = isControlled ? value : internalValue;
  const current = candidate && Number.isFinite(candidate.getTime()) ? candidate : undefined;
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
          aria-label={props['aria-label'] ?? placeholder}
          aria-labelledby={props['aria-labelledby']}
          {...styles('date-picker.content', 'p-3', undefined, unstyled)}
        >
          <Calendar
            localeCode={locale}
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
