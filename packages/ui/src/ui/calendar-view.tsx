import { type DayPickerProps, labelDayButton, DayPicker } from 'react-day-picker';
import { type PlainStyleProps, useStyles, useDirection, StyleProvider } from './style-context';
import { useTranslation, dateFormatter, numberFormatter } from './i18n';
import * as React from 'react';
import { yearMonth, CalendarDropdown } from './calendar-internal';
import { ar, enUS } from 'react-day-picker/locale';

export type CalendarProps = DayPickerProps & PlainStyleProps & { localeCode?: string };

export function Calendar({
  className,
  showOutsideDays = true,
  unstyled,
  localeCode,
  labels,
  formatters,
  components,
  captionLayout = 'dropdown',
  navLayout = 'after',
  tooltip,
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
  const calendar = (
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
      {...styles('calendar.root', 'ui-calendar w-fit max-w-full', className, unstyled)}
      {...props}
      components={{ Dropdown: CalendarDropdown, ...components }}
      startMonth={startMonth}
      endMonth={endMonth}
    />
  );
  return (
    <StyleProvider unstyled={unstyled}>
      {tooltip === undefined
        ? calendar
        : styles.tooltip(
            <div tabIndex={-1} style={{ display: 'inline-block', maxInlineSize: '100%' }}>
              {calendar}
            </div>,
            unstyled,
            tooltip,
          )}
    </StyleProvider>
  );
}
