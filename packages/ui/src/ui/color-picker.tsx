import * as React from 'react';
import { useTranslation } from './i18n';
import { Check, Palette } from 'lucide-react';
import { Input, Label, Slider } from './forms';
import { Button } from './primitives';
import { Popover, PopoverContent, PopoverTrigger } from './overlays';
import { StyleProvider, useStyles, type PlainStyleProps } from './styling';
import { changeInput } from './utils';

type HSV = { h: number; s: number; v: number };
function hex(value: string) {
  const raw = value.trim();
  if (/^#[a-f\d]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[a-f\d]{3}$/i.test(raw))
    return (
      '#' +
      raw
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('')
        .toLowerCase()
    );
  return undefined;
}
function fromHex(value: string): HSV {
  const channels = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels;
  const max = Math.max(...channels),
    min = Math.min(...channels),
    d = max - min;
  let h = !d ? 0 : max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: max ? (d / max) * 100 : 0, v: max * 100 };
}
function toHex({ h, s, v }: HSV) {
  const c = ((v / 100) * s) / 100,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = v / 100 - c;
  const rgb =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    '#' +
    rgb
      .map((n) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
function swatchForeground(color: string) {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.179 ? '#000' : '#fff';
}
export interface ColorPickerProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'>,
    PlainStyleProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  swatches?: readonly string[];
  pickerLabel?: string;
}
export const ColorPicker = /* @__PURE__ */ React.forwardRef<HTMLInputElement, ColorPickerProps>(
  (allProps, ref) => {
    const {
      value,
      defaultValue = '#252826',
      onValueChange,
      swatches = ['#252826', '#2563eb', '#08916b', '#be185d', '#c78115', '#7c3aed'],
      pickerLabel: pickerLabelProp,
      disabled,
      readOnly,
      className,
      unstyled,
      style,
      onChange,
      onBlur,
      ...props
    } = allProps;
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value');
    const styles = useStyles();
    const { t } = useTranslation();
    const pickerLabel = pickerLabelProp ?? t('color.choose');
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!);
    const [local, setLocal] = React.useState(defaultValue);
    const current = controlled ? (value ?? '') : local;
    const color = hex(current) ?? '#252826';
    const [draft, setDraft] = React.useState(current);
    const [hsv, setHSV] = React.useState(() => fromHex(color));
    const [open, setOpen] = React.useState(false);
    const pendingHSV = React.useRef<HSV | undefined>(undefined);
    const id = React.useId();
    React.useEffect(() => {
      if (disabled || readOnly) setOpen(false);
    }, [disabled, readOnly]);
    React.useEffect(() => {
      setDraft(current);
      setHSV((prev) => {
        const next = fromHex(color);
        return next.s === 0 ? { ...next, h: prev.h } : next;
      });
    }, [current, color]);
    React.useEffect(() => {
      const form = input.current?.form;
      const reset = (event: Event) =>
        queueMicrotask(() => {
          if (!event.defaultPrevented && !controlled) {
            setLocal(defaultValue);
            setDraft(defaultValue);
          }
        });
      form?.addEventListener('reset', reset);
      return () => form?.removeEventListener('reset', reset);
    }, [controlled, defaultValue]);
    React.useEffect(() => {
      input.current?.setCustomValidity(draft && !hex(draft) ? t('color.invalid') : '');
    }, [draft, t]);
    const commit = (next: string, nextHSV?: HSV) => {
      if (disabled || readOnly) return;
      if (!controlled) setLocal(next);
      setDraft(controlled ? current : next);
      setHSV(nextHSV ?? fromHex(next));
      onValueChange?.(next);
    };
    const change = (next: string, nextHSV?: HSV) => {
      if (disabled || readOnly) return;
      if (next === input.current?.value) {
        if (nextHSV) setHSV(nextHSV);
        return;
      }
      pendingHSV.current = nextHSV;
      changeInput(input.current, next);
      pendingHSV.current = undefined;
    };
    const update = (next: HSV) => change(toHex(next), next);
    const pointer = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || readOnly) return;
      const area = event.currentTarget.getBoundingClientRect();
      update({
        ...hsv,
        s: Math.max(0, Math.min(100, ((event.clientX - area.left) / area.width) * 100)),
        v: Math.max(0, Math.min(100, 100 - ((event.clientY - area.top) / area.height) * 100)),
      });
    };
    return (
      <StyleProvider unstyled={unstyled}>
        <Popover open={open} onOpenChange={setOpen}>
          <div
            {...styles('color-picker.root', 'ui-color-picker', className, unstyled)}
            style={style}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled || readOnly}
                aria-label={pickerLabel}
                {...styles('color-picker.trigger', 'ui-color-trigger', undefined, unstyled)}
              >
                <span
                  {...styles('color-picker.preview', 'ui-color-preview', undefined, unstyled)}
                  style={{ background: color }}
                  aria-hidden="true"
                />
              </Button>
            </PopoverTrigger>
            <Input
              ref={input}
              {...props}
              disabled={disabled}
              readOnly={readOnly}
              spellCheck={false}
              aria-invalid={props['aria-invalid'] || !!(draft && !hex(draft)) || undefined}
              value={draft}
              {...styles(
                'color-picker.input',
                'ui-color-hex flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:outline-none',
                undefined,
                unstyled,
              )}
              aria-label={props['aria-label'] ?? t('color.hex')}
              maxLength={7}
              onChange={(event) => {
                onChange?.(event);
                if (event.defaultPrevented || disabled || readOnly) return;
                const next = event.target.value;
                setDraft(next);
                const valid = hex(next);
                if (valid) commit(valid, pendingHSV.current);
              }}
              onBlur={(event) => {
                onBlur?.(event);
                if (hex(draft)) setDraft(color);
              }}
            />
          </div>
          <PopoverContent
            aria-label={pickerLabel}
            align="start"
            {...styles('color-picker.panel', 'ui-color-panel', undefined, unstyled)}
          >
            <div {...styles('color-picker.heading', 'ui-color-heading', undefined, unstyled)}>
              <Palette size={16} aria-hidden="true" />
              <span>{pickerLabel}</span>
              <output>{color.toUpperCase()}</output>
            </div>
            <div
              {...styles('color-picker.area', 'ui-color-area', undefined, unstyled)}
              role="slider"
              tabIndex={disabled || readOnly ? -1 : 0}
              aria-label={t('color.saturation')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(hsv.s)}
              aria-valuetext={`${Math.round(hsv.s)}% saturation, ${Math.round(hsv.v)}% brightness, ${color}`}
              aria-describedby={id}
              style={{ backgroundColor: toHex({ h: hsv.h, s: 100, v: 100 }) }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                pointer(event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) pointer(event);
              }}
              onKeyDown={(event) => {
                if (
                  !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const step = event.shiftKey ? 10 : 1;
                update({
                  ...hsv,
                  s: Math.max(
                    0,
                    Math.min(
                      100,
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? 100
                          : hsv.s +
                            (event.key === 'ArrowRight'
                              ? step
                              : event.key === 'ArrowLeft'
                                ? -step
                                : 0),
                    ),
                  ),
                  v: Math.max(
                    0,
                    Math.min(
                      100,
                      hsv.v +
                        (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
                    ),
                  ),
                });
              }}
            >
              <span
                {...styles('color-picker.cursor', 'ui-color-cursor', undefined, unstyled)}
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
              />
            </div>
            <span id={id} className="sr-only">
              Left and right adjust saturation. Up and down adjust brightness. Shift changes by ten.
            </span>
            <div {...styles('color-picker.hue', 'ui-color-hue', undefined, unstyled)}>
              <Slider
                aria-label={t('color.hue')}
                style={{ '--ui-slider-range': 'transparent' } as React.CSSProperties}
                dir="ltr"
                min={0}
                max={359}
                value={[hsv.h]}
                onValueChange={([h]) => update({ ...hsv, h })}
              />
            </div>
            <div {...styles('color-picker.channels', 'ui-color-channels', undefined, unstyled)}>
              {[1, 3, 5].map((offset, i) => (
                <div key={offset}>
                  <Label htmlFor={`${id}-${i}`}>{['R', 'G', 'B'][i]}</Label>
                  <Input
                    id={`${id}-${i}`}
                    type="number"
                    min={0}
                    max={255}
                    value={parseInt(color.slice(offset, offset + 2), 16)}
                    onChange={(event) => {
                      event.stopPropagation();
                      const n = event.target.valueAsNumber;
                      if (Number.isFinite(n))
                        change(
                          color.slice(0, offset) +
                            Math.round(Math.max(0, Math.min(255, n)))
                              .toString(16)
                              .padStart(2, '0') +
                            color.slice(offset + 2),
                        );
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              {...styles('color-picker.swatches', 'ui-color-swatches', undefined, unstyled)}
              role="group"
              aria-label={t('color.presets')}
            >
              {swatches
                .map(hex)
                .filter((c): c is string => !!c)
                .map((c, i) => (
                  <Button
                    key={`${c}-${i}`}
                    size="icon"
                    variant="ghost"
                    {...styles('color-picker.swatch', 'size-8 rounded-full', undefined, unstyled)}
                    aria-label={t('color.choosePreset', { label: c })}
                    aria-pressed={c === color}
                    onClick={() => change(c)}
                    style={{
                      background: c,
                      color: swatchForeground(c),
                    }}
                  >
                    {c === color && <Check size={16} aria-hidden="true" />}
                  </Button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </StyleProvider>
    );
  },
);
ColorPicker.displayName = 'ColorPicker';
