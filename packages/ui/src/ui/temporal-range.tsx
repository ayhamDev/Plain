import { type TimePicker } from './time-picker';
import { type DateTimeRangePickerProps } from './date-time-range-picker';
import * as React from 'react';
import { useStyles, useDirection, StyleProvider } from './style-context';
import { useTranslation } from './i18n';
import { useValue, wallValue } from './date-time-internal';
import { Temporal } from 'temporal-polyfill';

export function WallRange({
  Picker,
  kind,
  allProps,
  forwardedRef,
}: {
  kind: 'time' | 'datetime-local';
  Picker: typeof TimePicker;
  allProps: DateTimeRangePickerProps & { allowOvernight?: boolean };
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
}) {
  const {
    value: suppliedValue,
    defaultValue,
    onValueChange,
    fromLabel: fromLabelProp,
    toLabel: toLabelProp,
    fromName,
    toName,
    name,
    min,
    max,
    allowOvernight = false,
    className,
    unstyled,
    id,
    dir,
    'aria-labelledby': labelledBy,
    'aria-label': label,
    ...props
  } = allProps;
  const styles = useStyles();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const { t } = useTranslation();
  const fromLabel = fromLabelProp ?? t('picker.from'),
    toLabel = toLabelProp ?? t('picker.to');
  const generatedId = React.useId();
  const baseId = id ?? generatedId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(forwardedRef, () => inputRef.current!);
  const [value, change] = useValue(
    { value: suppliedValue, defaultValue, onValueChange },
    inputRef,
    Object.prototype.hasOwnProperty.call(allProps, 'value'),
  );
  const from = wallValue(value?.from, kind);
  const to = wallValue(value?.to, kind);
  const ordered = kind === 'datetime-local' || !allowOvernight;
  const compare = kind === 'time' ? Temporal.PlainTime.compare : Temporal.PlainDateTime.compare;
  const earlier = (a?: string, b?: string) => (!a ? b : !b ? a : compare(a, b) < 0 ? a : b);
  const later = (a?: string, b?: string) => (!a ? b : !b ? a : compare(a, b) > 0 ? a : b);
  const update = (key: 'from' | 'to', next: string | undefined) => {
    const range = { from, to, [key]: next };
    change(range.from || range.to ? range : undefined);
  };
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        {...(kind === 'time'
          ? styles('time-range-picker.root', 'ui-temporal-range', className, unstyled)
          : styles('date-time-range-picker.root', 'ui-temporal-range', className, unstyled))}
        dir={direction}
        role="group"
        aria-label={label}
        aria-labelledby={labelledBy}
      >
        <div {...styles('temporal.range-part', 'ui-temporal-range-part', undefined, unstyled)}>
          <label
            htmlFor={baseId}
            id={`${baseId}-from-label`}
            {...styles('temporal.range-label', 'ui-temporal-range-label', undefined, unstyled)}
          >
            {fromLabel}
          </label>
          {styles.tooltip(
            <Picker
              {...props}
              ref={inputRef}
              id={baseId}
              name={fromName ?? (name ? `${name}[from]` : undefined)}
              dir={direction}
              value={from}
              min={wallValue(min, kind)}
              max={ordered ? earlier(wallValue(max, kind), to) : wallValue(max, kind)}
              aria-labelledby={[labelledBy, `${baseId}-from-label`].filter(Boolean).join(' ')}
              aria-label={label ? `${label} ${fromLabel}` : undefined}
              onValueChange={(next) => update('from', next)}
            />,
            unstyled,
          )}
        </div>
        <div {...styles('temporal.range-part', 'ui-temporal-range-part', undefined, unstyled)}>
          <label
            htmlFor={`${baseId}-to`}
            id={`${baseId}-to-label`}
            {...styles('temporal.range-label', 'ui-temporal-range-label', undefined, unstyled)}
          >
            {toLabel}
          </label>
          {styles.tooltip(
            <Picker
              {...props}
              id={`${baseId}-to`}
              name={toName ?? (name ? `${name}[to]` : undefined)}
              dir={direction}
              value={to}
              min={ordered ? later(wallValue(min, kind), from) : wallValue(min, kind)}
              max={wallValue(max, kind)}
              aria-labelledby={[labelledBy, `${baseId}-to-label`].filter(Boolean).join(' ')}
              aria-label={label ? `${label} ${toLabel}` : undefined}
              onValueChange={(next) => update('to', next)}
            />,
            unstyled,
          )}
        </div>
      </div>
    </StyleProvider>
  );
}
