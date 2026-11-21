import { StyleProvider, useStyles, useDirection, type PlainStyleProps } from './styling';
import * as React from 'react';
import { inputClass, inputVariantClass, type InputVariant } from './input-variants';
import { ar, enUS } from 'react-day-picker/locale';
import { dateFormatter, numberFormatter, useTranslation } from './i18n';
import {
  DayPicker,
  dateMatchModifiers,
  labelDayButton,
  useDayPicker,
  type DayPickerProps,
  type DropdownProps,
} from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { cn } from './utils';
import { Button } from './primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './forms';
import { Popover, PopoverTrigger, Sheet, SheetTrigger } from './overlays';
import { PickerPopoverContent } from './picker-popover';
import { PickerMobileContent, useCompactPicker } from './picker-mobile';
export type CalendarProps = DayPickerProps & PlainStyleProps & { localeCode?: string };
function CalendarDropdown({
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
export interface DatePickerProps
  extends
    PlainStyleProps,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'value' | 'defaultValue' | 'onChange' | 'children'
    > {
  variant?: InputVariant;
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
    variant = 'outlined',
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
  const compactScreen = useCompactPicker();
  const [openedCompact, setOpenedCompact] = React.useState(false);
  const compact = open ? openedCompact : compactScreen;
  const [draft, setDraft] = React.useState<Date>();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(ref, () => buttonRef.current!);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const candidate = isControlled ? value : internalValue;
  const current = candidate && Number.isFinite(candidate.getTime()) ? candidate : undefined;
  const setPickerOpen = (next: boolean) => {
    if (props.disabled) return;
    if (next && !open) {
      setOpenedCompact(compactScreen);
      setDraft(current);
    }
    setOpen(next);
  };
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
  React.useEffect(() => {
    if (props.disabled) setOpen(false);
  }, [props.disabled]);
  React.useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (!isControlled) setInternalValue(defaultValue);
        setOpen(false);
      });
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [isControlled, defaultValue, props.form]);
  const PickerRoot = compact ? Sheet : Popover;
  const Trigger = compact ? SheetTrigger : PopoverTrigger;
  const calendar = (
    <Calendar
      localeCode={locale}
      mode="single"
      selected={compact ? draft : current}
      onSelect={compact ? setDraft : select}
      defaultMonth={(compact ? draft : current) ?? current}
      autoFocus={!compact}
      {...calendarProps}
    />
  );
  return (
    <StyleProvider unstyled={unstyled}>
      <PickerRoot
        open={open}
        onOpenChange={setPickerOpen}
        {...(compact
          ? { side: 'bottom' as const, maxWidth: 480, handleOnly: true, repositionInputs: false }
          : {})}
      >
        <Trigger asChild>
          {styles.tooltip(
            <button
              ref={buttonRef}
              type="button"
              data-variant={variant}
              {...styles(
                'date-picker.trigger',
                cn(
                  inputClass,
                  inputVariantClass(variant),
                  'items-center justify-start gap-2 font-normal text-start',
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
                {...styles(
                  'date-picker.icon',
                  'size-4 shrink-0 text-muted-foreground',
                  undefined,
                  unstyled,
                )}
                aria-hidden="true"
              />
              {formattedValue}
            </button>,
            unstyled,
          )}
        </Trigger>
        <span id={valueId} hidden>
          {formattedValue}
        </span>
        {compact ? (
          <PickerMobileContent
            title={props['aria-label'] ?? placeholder}
            description={language.t('picker.dateHint')}
            returnFocusRef={buttonRef}
            unstyled={unstyled}
            summary={
              draft
                ? dateFormatter(locale, {
                    calendar: 'gregory',
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(draft)
                : placeholder
            }
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  {language.t('common.cancel')}
                </Button>
                <Button
                  disabled={
                    !draft ||
                    Boolean(
                      calendarProps?.disabled && dateMatchModifiers(draft, calendarProps.disabled),
                    )
                  }
                  onClick={() => select(draft)}
                >
                  {language.t('common.done')}
                </Button>
              </>
            }
          >
            {calendar}
            {clearable && current && (
              <Button variant="ghost" size="sm" onClick={() => select(undefined)}>
                {clearLabel}
              </Button>
            )}
          </PickerMobileContent>
        ) : (
          <PickerPopoverContent
            anchorRef={buttonRef}
            align="start"
            aria-label={props['aria-label'] ?? placeholder}
            aria-labelledby={props['aria-labelledby']}
            {...styles('date-picker.content', 'p-3', undefined, unstyled)}
          >
            {calendar}
            {clearable && current && (
              <div {...styles('date-picker.footer', 'mt-2 border-t pt-2', undefined, unstyled)}>
                <Button
                  variant="ghost"
                  size="sm"
                  {...styles('date-picker.clear', 'w-full', undefined, unstyled)}
                  onClick={() => select(undefined)}
                >
                  {clearLabel}
                </Button>
              </div>
            )}
          </PickerPopoverContent>
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            value={current ? localDateString(current) : ''}
            disabled={props.disabled}
            form={props.form}
          />
        )}
      </PickerRoot>
    </StyleProvider>
  );
});
DatePicker.displayName = 'DatePicker';
