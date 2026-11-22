import {
  type TooltipProps,
  type TooltipValueType,
  type TooltipContentProps,
  Tooltip,
} from 'recharts';
import * as React from 'react';
import { ChartContext, formatValue, seriesColor, chartGrid } from './charts-internal';
import { useMotionSettings } from './motion-policy';

export type ChartTooltipProps = TooltipProps<TooltipValueType, number | string>;

export type ChartTooltipContentProps = Partial<
  TooltipContentProps<TooltipValueType, number | string>
> & {
  indicator?: 'dot' | 'line' | 'dashed';
  hideLabel?: boolean;
};

/** Recharts supplies active point and keyboard state; this only renders its content. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  contentStyle,
  labelStyle,
  itemStyle,
  accessibilityLayer,
  indicator = 'dot',
  hideLabel = false,
}: ChartTooltipContentProps) {
  const { config, locale } = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;
  const title = labelFormatter ? labelFormatter(label, payload) : formatValue(label, locale);
  return (
    <div
      className="ui-chart-tooltip"
      style={contentStyle}
      role={accessibilityLayer ? 'status' : undefined}
      aria-live={accessibilityLayer ? 'assertive' : undefined}
      aria-atomic={accessibilityLayer || undefined}
    >
      {!hideLabel && label != null && (
        <div className="ui-chart-tooltip-label" style={labelStyle}>
          {title}
        </div>
      )}
      <div className="ui-chart-tooltip-items">
        {payload
          .filter((entry) => entry.type !== 'none' && entry.value != null)
          .map((entry, index) => {
            const name =
              config[String(entry.dataKey)]?.label ??
              config[String(entry.name)]?.label ??
              entry.name;
            const formatted =
              formatter && entry.value !== undefined && entry.name !== undefined
                ? formatter(entry.value, entry.name, entry, index, payload)
                : undefined;
            const value = Array.isArray(formatted)
              ? formatted[0]
              : (formatted ?? formatValue(entry.value, locale));
            const text = Array.isArray(formatted) ? formatted[1] : name;
            return (
              <div
                className="ui-chart-tooltip-item"
                style={itemStyle}
                key={`${String(entry.dataKey ?? entry.name)}-${index}`}
              >
                <span
                  className="ui-chart-tooltip-indicator"
                  data-indicator={indicator}
                  aria-hidden="true"
                  style={
                    {
                      '--chart-indicator': entry.color ?? seriesColor(config, entry.dataKey, index),
                    } as React.CSSProperties
                  }
                />
                <span className="ui-chart-tooltip-name">{text}</span>
                <span className="ui-chart-tooltip-value">{value}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/** Uses Recharts' native tooltip and live-region behavior, including keyboard focus. */
export function ChartTooltip({
  formatter,
  contentStyle,
  labelStyle,
  itemStyle,
  ...props
}: ChartTooltipProps) {
  const { config, locale, animate } = React.useContext(ChartContext);
  const motion = useMotionSettings();
  return (
    <Tooltip
      cursor={{ stroke: chartGrid, fill: 'var(--ui-muted, #f5f6f5)', fillOpacity: 0.5 }}
      {...props}
      content={props.content ?? ((contentProps) => <ChartTooltipContent {...contentProps} />)}
      isAnimationActive={animate && motion.enabled ? (props.isAnimationActive ?? 'auto') : false}
      contentStyle={{
        background: 'var(--ui-chart-tooltip-background, var(--ui-surface, #fff))',
        color: 'var(--ui-chart-tooltip-foreground, var(--ui-foreground, #202321))',
        border: `var(--ui-border-width, 1px) solid ${chartGrid}`,
        borderRadius: 'min(var(--ui-radius, 6px), 8px)',
        fontSize: 12,
        padding: '8px 12px',
        ...contentStyle,
      }}
      labelStyle={{ color: 'inherit', fontWeight: 600, ...labelStyle }}
      itemStyle={itemStyle}
      formatter={
        formatter ??
        ((value, name, entry) => [
          Array.isArray(value)
            ? value.map((item) => formatValue(item, locale)).join(' - ')
            : formatValue(value, locale),
          config[String(entry.dataKey)]?.label ?? config[String(name)]?.label ?? name,
        ])
      }
    />
  );
}
