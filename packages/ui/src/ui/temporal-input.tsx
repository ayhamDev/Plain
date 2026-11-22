import { type Calendar } from './calendar-view';
import { type DateTimePickerProps } from './date-time-picker';
import * as React from 'react';
import { useStyles, useDirection, StyleProvider } from './style-context';
import { useTranslation, dateFormatter, numberFormatter } from './i18n';
import {
  type TimeChooserHandle,
  useValue,
  wallValue,
  formattedWall,
  calendarDate,
  matchers,
  localDate,
  calendarDefaults,
  TimeChooser,
  visuallyHidden,
} from './date-time-internal';
import { useCompactPicker, PickerMobileContent } from './picker-mobile';
import { dateMatchModifiers } from 'react-day-picker';
import { Temporal } from 'temporal-polyfill';
import { changeInput } from './utils';
import { SheetTrigger, Sheet } from './sheet';
import { PopoverTrigger, Popover, PopoverAnchor } from './popover';
import { Button } from './button';
import { inputVariantClass } from './input-variants';
import { Clock3, CalendarDays, X } from 'lucide-react';
import { PickerPopoverContent } from './picker-popover';

export function TemporalInput({
  CalendarComponent,
  kind,
  allProps,
  forwardedRef,
}: {
  kind: 'time' | 'datetime-local';
  CalendarComponent?: typeof Calendar;
  allProps: DateTimePickerProps;
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
}) {
  const {
    variant = 'outlined',
    value: suppliedValue,
    defaultValue,
    onValueChange,
    min,
    max,
    locale: localeProp,
    clearable = true,
    clearLabel: clearLabelProp,
    minuteStep = 1,
    hourCycle = 'h23',
    hour12,
    editable = false,
    popoverProps,
    pickerMode = 'auto',
    timeLabel: timeLabelProp,
    timeZone: zoneProp,
    disambiguation,
    disabledDates,
    calendarProps,
    showCalendar = true,
    calendarLabel: calendarLabelProp,
    invalidDateLabel: invalidDateLabelProp,
    className,
    unstyled,
    dir,
    disabled,
    readOnly,
    onChange,
    onKeyDown,
    onClick,
    onPointerDown,
    onBeforeInput,
    onPaste,
    onDrop,
    'aria-describedby': describedBy,
    tooltip,
    ...props
  } = allProps;
  const styles = useStyles();
  const language = useTranslation();
  const locale = localeProp ?? language.locale,
    timeZone = zoneProp ?? language.timeZone;
  const resolvedCycle = hour12 === undefined ? hourCycle : hour12 ? 'h12' : 'h23';
  const canPick = kind === 'time' || showCalendar;
  const pickerOnly = canPick && !editable;
  const clearLabel = clearLabelProp ?? language.t('picker.clearValue');
  const timeLabel = timeLabelProp ?? language.t('picker.openTime'),
    calendarLabel = calendarLabelProp ?? language.t('picker.openCalendar');
  const invalidDateLabel = invalidDateLabelProp ?? language.t('picker.invalidDate');
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const mobilePanelRef = React.useRef<HTMLDivElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const timeActions = React.useRef<TimeChooserHandle | null>(null);
  React.useImperativeHandle(forwardedRef, () => inputRef.current!);
  const [value, change] = useValue(
    { value: suppliedValue, defaultValue, onValueChange },
    inputRef,
    Object.prototype.hasOwnProperty.call(allProps, 'value'),
  );
  const current = wallValue(value, kind);
  const [open, setOpen] = React.useState(false);
  const compactScreen = useCompactPicker();
  const [openedCompact, setOpenedCompact] = React.useState(false);
  const [mobileDraft, setMobileDraft] = React.useState<string>();
  const draftRef = React.useRef<string | undefined>(undefined);
  const [mobileStep, setMobileStep] = React.useState<'date' | 'time'>('date');
  // Keep an open surface stable when rotation/resizing crosses the breakpoint.
  const compact = open ? openedCompact : compactScreen;
  const mobileDateTime = compact && kind === 'datetime-local';
  const staged = mobileDateTime && open;
  const pickerCurrent = staged ? mobileDraft : current;
  const setPickerOpen = (next: boolean, acceptDefault = false) => {
    if (next && !open) {
      setOpenedCompact(compactScreen);
      draftRef.current = current;
      setMobileDraft(current);
      setMobileStep('date');
    }
    if (!next) {
      if (staged) timeActions.current?.discard();
      else timeActions.current?.commit(acceptDefault);
    }
    setOpen(next);
  };
  const wheel = pickerMode === 'wheel' || (pickerMode === 'auto' && compact);
  const formatId = React.useId();
  const panelId = popoverProps?.id ?? `${formatId}-picker`;
  const formatted = formattedWall(
    current,
    { ...allProps, locale, timeZone, hourCycle: resolvedCycle },
    kind,
  );
  const selected = kind === 'datetime-local' ? calendarDate(pickerCurrent) : undefined;
  const unavailable = matchers(calendarDate(min), calendarDate(max), disabledDates);
  const committedDate = kind === 'datetime-local' ? calendarDate(current) : undefined;
  let invalid =
    kind === 'datetime-local' && committedDate && dateMatchModifiers(committedDate, unavailable);
  if (current && kind === 'datetime-local' && timeZone) {
    try {
      Temporal.PlainDateTime.from(current).toZonedDateTime(timeZone, { disambiguation });
    } catch {
      invalid = true;
    }
  }
  React.useEffect(() => {
    inputRef.current?.setCustomValidity(invalid ? invalidDateLabel : '');
  }, [invalid, invalidDateLabel]);
  React.useEffect(() => {
    if (disabled || readOnly) {
      timeActions.current?.discard();
      setOpen(false);
    }
  }, [disabled, readOnly]);
  React.useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          timeActions.current?.discard();
          setOpen(false);
        }
      });
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [props.form]);
  const selectValue = (next: string | undefined) => {
    if (disabled || readOnly) return;
    if (mobileDateTime) {
      draftRef.current = next;
      setMobileDraft(next);
    } else changeInput(inputRef.current, next ?? '');
  };
  const clear = () => {
    if (disabled || readOnly) return;
    timeActions.current?.discard();
    changeInput(inputRef.current, '');
    setOpen(false);
    inputRef.current?.focus();
  };
  const pickDate = (date: Date | undefined) => {
    if (disabled || readOnly) return;
    const day = localDate(date);
    let next = day
      ? `${day}T${pickerCurrent?.split('T')[1] ?? (staged ? '09:00' : '00:00')}`
      : undefined;
    if (next && min && wallValue(min, kind) && Temporal.PlainDateTime.compare(next, min) < 0)
      next = min;
    if (next && max && wallValue(max, kind) && Temporal.PlainDateTime.compare(next, max) > 0)
      next = max;
    selectValue(next);
  };
  const pickTime = (next: string) => {
    let candidate =
      kind === 'time' ? next : `${localDate(selected ?? calendarDate(min) ?? new Date())}T${next}`;
    const compare = kind === 'time' ? Temporal.PlainTime.compare : Temporal.PlainDateTime.compare;
    const lower = wallValue(min, kind),
      upper = wallValue(max, kind);
    // Native time inputs also support a range crossing midnight.
    if (kind === 'time' && lower && upper && compare(lower, upper) > 0) {
      if (compare(candidate, lower) < 0 && compare(candidate, upper) > 0) candidate = lower;
    } else {
      if (lower && compare(candidate, lower) < 0) candidate = lower;
      if (upper && compare(candidate, upper) > 0) candidate = upper;
    }
    selectValue(candidate);
  };
  const validDraft = (candidate: string | undefined) => {
    if (!candidate || !wallValue(candidate, 'datetime-local')) return false;
    if (dateMatchModifiers(calendarDate(candidate)!, unavailable)) return false;
    const lower = wallValue(min, kind),
      upper = wallValue(max, kind);
    if (lower && Temporal.PlainDateTime.compare(candidate, lower) < 0) return false;
    if (upper && Temporal.PlainDateTime.compare(candidate, upper) > 0) return false;
    try {
      if (timeZone)
        Temporal.PlainDateTime.from(candidate).toZonedDateTime(timeZone, { disambiguation });
      return true;
    } catch {
      return false;
    }
  };
  const finishMobile = () => {
    timeActions.current?.commit(true);
    const next = draftRef.current;
    if (disabled || readOnly || !validDraft(next)) return;
    changeInput(inputRef.current, next!);
    setOpen(false);
  };
  React.useEffect(() => {
    if (!staged) return;
    const frame = requestAnimationFrame(() => {
      mobilePanelRef.current
        ?.querySelector<HTMLElement>(
          mobileStep === 'time'
            ? '[data-slot="time-choices"] [role="spinbutton"], [data-slot="time-choices"] [role="combobox"]'
            : '.rdp-day_button[tabindex="0"]',
        )
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [staged, mobileStep]);
  const Trigger = compact ? SheetTrigger : PopoverTrigger;
  const PickerRoot = compact ? Sheet : Popover;
  const FieldAnchor = compact ? React.Fragment : PopoverAnchor;
  const calendarContent = kind === 'datetime-local' && CalendarComponent && (
    <CalendarComponent
      {...calendarDefaults(locale, calendarProps)}
      mode="single"
      selected={selected}
      defaultMonth={calendarProps?.defaultMonth ?? selected ?? calendarDate(min)}
      startMonth={calendarProps?.startMonth ?? calendarDate(min)}
      endMonth={calendarProps?.endMonth ?? calendarDate(max)}
      disabled={unavailable}
      onSelect={pickDate}
      autoFocus={!compact}
      dir={direction}
    />
  );
  const timeContent = (
    <TimeChooser
      actions={timeActions}
      value={kind === 'time' ? current : pickerCurrent?.split('T')[1]}
      onValueChange={pickTime}
      minuteStep={minuteStep}
      hourCycle={resolvedCycle}
      wheel={wheel}
      locale={locale}
    />
  );
  const pickerContent = (
    <>
      {compact && kind === 'datetime-local' ? (
        <div
          hidden={mobileStep !== 'date'}
          {...styles('picker.step-content', 'ui-picker-step', undefined, unstyled)}
        >
          {calendarContent}
        </div>
      ) : (
        calendarContent
      )}
      {(kind === 'time' || !compact || mobileStep === 'time') &&
        (compact ? (
          <div {...styles('picker.step-content', 'ui-picker-step', undefined, unstyled)}>
            {timeContent}
          </div>
        ) : (
          timeContent
        ))}
    </>
  );
  const done = (
    <div {...styles('temporal.done', 'ui-temporal-done', undefined, unstyled)}>
      <Button size={compact ? 'md' : 'sm'} onClick={() => setPickerOpen(false, kind === 'time')}>
        {language.t('common.done')}
      </Button>
    </div>
  );
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    inputRef.current?.focus({ preventScroll: true });
  };
  return (
    <StyleProvider unstyled={unstyled}>
      <PickerRoot
        open={open}
        onOpenChange={(next) => !disabled && !readOnly && setPickerOpen(next)}
        {...(compact
          ? { side: 'bottom' as const, maxWidth: 640, handleOnly: true, repositionInputs: false }
          : {})}
      >
        <FieldAnchor {...(compact ? {} : { asChild: true })}>
          {styles.tooltip(
            <div
              tabIndex={tooltip === undefined ? undefined : disabled ? 0 : -1}
              ref={fieldRef}
              {...(kind === 'time'
                ? styles(
                    'time-picker.root',
                    `ui-temporal ${inputVariantClass(variant)}`,
                    undefined,
                    unstyled,
                  )
                : styles(
                    'date-time-picker.root',
                    `ui-temporal ${inputVariantClass(variant)}`,
                    undefined,
                    unstyled,
                  ))}
              dir={direction}
              data-variant={variant}
              data-disabled={disabled ? '' : undefined}
            >
              <div
                {...styles('temporal.field', 'ui-temporal-field', undefined, unstyled)}
                data-picker-only={pickerOnly || undefined}
              >
                {styles.tooltip(
                  <input
                    {...styles('temporal.input', 'ui-temporal-input', className, unstyled)}
                    {...props}
                    ref={inputRef}
                    type={kind}
                    data-custom-picker=""
                    data-calendar={kind === 'datetime-local' && showCalendar ? '' : undefined}
                    value={current ?? ''}
                    min={wallValue(min, kind)}
                    max={wallValue(max, kind)}
                    step={
                      props.step ??
                      (current?.includes('.')
                        ? 0.001
                        : current && current.length > (kind === 'time' ? 5 : 16)
                          ? 1
                          : 60)
                    }
                    required={props.required ?? props['aria-required'] === true}
                    disabled={disabled}
                    readOnly={readOnly}
                    inputMode={pickerOnly ? 'none' : props.inputMode}
                    aria-label={
                      props['aria-label'] ??
                      (props['aria-labelledby']
                        ? undefined
                        : language.t(kind === 'time' ? 'picker.time' : 'picker.dateTime'))
                    }
                    aria-haspopup={props['aria-haspopup'] ?? (pickerOnly ? 'dialog' : undefined)}
                    aria-controls={pickerOnly && open ? panelId : props['aria-controls']}
                    aria-readonly={pickerOnly || readOnly ? true : props['aria-readonly']}
                    title={props.title ?? (pickerOnly ? formatted : undefined)}
                    lang={props.lang ?? locale}
                    dir={direction}
                    aria-invalid={props['aria-invalid'] || invalid || undefined}
                    aria-describedby={
                      [describedBy, current ? formatId : undefined].filter(Boolean).join(' ') ||
                      undefined
                    }
                    onChange={(event) => {
                      onChange?.(event);
                      if (!event.defaultPrevented && !disabled && !readOnly)
                        change(wallValue(event.currentTarget.value, kind));
                    }}
                    onPointerDown={(event) => {
                      onPointerDown?.(event);
                      // Keep native constraint validation, but suppress native segmented
                      // editing and the software keyboard in the default picker mode.
                      if (pickerOnly && !event.defaultPrevented && !disabled && !readOnly)
                        event.preventDefault();
                    }}
                    onClick={(event) => {
                      onClick?.(event);
                      if (pickerOnly && !event.defaultPrevented && !disabled && !readOnly) {
                        event.preventDefault();
                        setPickerOpen(true);
                      }
                    }}
                    onBeforeInput={(event) => {
                      onBeforeInput?.(event);
                      if (pickerOnly) event.preventDefault();
                    }}
                    onPaste={(event) => {
                      onPaste?.(event);
                      if (pickerOnly) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      onDrop?.(event);
                      if (pickerOnly) event.preventDefault();
                    }}
                    onKeyDown={(event) => {
                      onKeyDown?.(event);
                      if (event.defaultPrevented || disabled || readOnly) return;
                      if (
                        clearable &&
                        (event.ctrlKey || event.metaKey) &&
                        ['Backspace', 'Delete'].includes(event.key)
                      ) {
                        event.preventDefault();
                        clear();
                      }
                      if (
                        canPick &&
                        ((event.altKey && event.key === 'ArrowDown') ||
                          (pickerOnly &&
                            ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'F4'].includes(event.key)))
                      ) {
                        event.preventDefault();
                        setPickerOpen(true);
                        return;
                      }
                      if (
                        pickerOnly &&
                        !event.ctrlKey &&
                        !event.metaKey &&
                        (event.key.length === 1 ||
                          [
                            'Backspace',
                            'Delete',
                            'ArrowLeft',
                            'ArrowRight',
                            'Home',
                            'End',
                            'PageUp',
                            'PageDown',
                          ].includes(event.key))
                      )
                        event.preventDefault();
                    }}
                  />,
                  unstyled,
                )}
                {pickerOnly && (
                  <span
                    {...styles('temporal.display', 'ui-temporal-display', undefined, unstyled)}
                    data-placeholder={!current || undefined}
                    aria-hidden="true"
                  >
                    {formatted ||
                      props.placeholder ||
                      (kind === 'time' ? timeLabel : calendarLabel)}
                  </span>
                )}
              </div>
              <span id={formatId} style={visuallyHidden}>
                {formatted}
              </span>
              {canPick && (
                <>
                  <Trigger asChild>
                    <button
                      type="button"
                      {...styles(
                        'temporal.calendar-trigger',
                        'ui-temporal-action',
                        undefined,
                        unstyled,
                      )}
                      disabled={disabled || readOnly}
                      aria-label={kind === 'time' ? timeLabel : calendarLabel}
                      title={kind === 'time' ? timeLabel : calendarLabel}
                    >
                      {kind === 'time' ? (
                        <Clock3 size={16} aria-hidden="true" />
                      ) : (
                        <CalendarDays size={16} aria-hidden="true" />
                      )}
                    </button>
                  </Trigger>
                  {compact ? (
                    <PickerMobileContent
                      temporal
                      data-phase={kind === 'time' ? 'time' : mobileStep}
                      id={panelId}
                      ref={mobilePanelRef}
                      className="ui-temporal-sheet"
                      dir={direction}
                      unstyled={unstyled}
                      returnFocusRef={inputRef}
                      title={
                        kind === 'time' || mobileStep === 'time'
                          ? timeLabel
                          : language.t('picker.chooseDate')
                      }
                      description={
                        kind === 'time' || mobileStep === 'time'
                          ? wheel
                            ? language.t('picker.wheelHint')
                            : undefined
                          : language.t('picker.dateTimeHint')
                      }
                      summary={
                        kind === 'datetime-local' && selected
                          ? dateFormatter(locale, {
                              calendar: 'gregory',
                              weekday: 'short',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            }).format(selected)
                          : undefined
                      }
                      steps={
                        kind === 'datetime-local' && (
                          <ol
                            {...styles('picker.steps', 'ui-picker-steps', undefined, unstyled)}
                            aria-label={language.t('picker.step', {
                              current: numberFormatter(locale).format(
                                mobileStep === 'date' ? 1 : 2,
                              ),
                              total: numberFormatter(locale).format(2),
                            })}
                          >
                            <li aria-current={mobileStep === 'date' ? 'step' : undefined}>
                              <span>{numberFormatter(locale).format(1)}</span>
                              {language.t('picker.date')}
                            </li>
                            <li aria-current={mobileStep === 'time' ? 'step' : undefined}>
                              <span>{numberFormatter(locale).format(2)}</span>
                              {language.t('picker.time')}
                            </li>
                          </ol>
                        )
                      }
                      footer={
                        kind === 'time' ? (
                          <Button onClick={() => setPickerOpen(false, true)}>
                            {language.t('common.done')}
                          </Button>
                        ) : mobileStep === 'date' ? (
                          <>
                            <Button variant="ghost" onClick={() => setPickerOpen(false)}>
                              {language.t('common.cancel')}
                            </Button>
                            <Button
                              disabled={!selected || dateMatchModifiers(selected, unavailable)}
                              onClick={() => setMobileStep('time')}
                            >
                              {language.t('common.next')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                timeActions.current?.commit();
                                setMobileStep('date');
                              }}
                            >
                              {language.t('common.back')}
                            </Button>
                            <Button disabled={!validDraft(mobileDraft)} onClick={finishMobile}>
                              {language.t('common.done')}
                            </Button>
                          </>
                        )
                      }
                    >
                      {pickerContent}
                    </PickerMobileContent>
                  ) : (
                    <PickerPopoverContent
                      anchorRef={fieldRef}
                      align="start"
                      {...popoverProps}
                      {...styles(
                        'temporal.content',
                        kind === 'time'
                          ? 'ui-temporal-content ui-time-content'
                          : 'ui-temporal-content',
                        popoverProps?.className,
                        unstyled,
                      )}
                      id={panelId}
                      dir={direction}
                      aria-label={
                        popoverProps?.['aria-label'] ??
                        (kind === 'time' ? timeLabel : calendarLabel)
                      }
                      onCloseAutoFocus={(event) => {
                        popoverProps?.onCloseAutoFocus?.(event);
                        if (!event.defaultPrevented) restoreFocus(event);
                      }}
                      onInteractOutside={(event) => {
                        popoverProps?.onInteractOutside?.(event);
                        if (
                          !event.defaultPrevented &&
                          fieldRef.current?.contains(event.target as Node)
                        )
                          event.preventDefault();
                      }}
                    >
                      {pickerContent}
                      {done}
                    </PickerPopoverContent>
                  )}
                </>
              )}
              {clearable && current && (
                <button
                  type="button"
                  {...styles('temporal.clear', 'ui-temporal-action', undefined, unstyled)}
                  disabled={disabled || readOnly}
                  onClick={clear}
                  aria-label={clearLabel}
                  title={clearLabel}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>,
            unstyled,
            tooltip,
          )}
        </FieldAnchor>
      </PickerRoot>
    </StyleProvider>
  );
}
