import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../../../ui/primitives';
import { Checkbox, Label } from '../../../ui/forms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/navigation';
import { BlockHeading, ChoiceSelect, ExportButton, exportCsv, money } from '../helpers';
import type { ChartConfig } from '../types';

const colors = [
  'var(--pb-chart-1, #128064)',
  'var(--pb-chart-2, #4273c6)',
  'var(--pb-chart-3, #c55973)',
  'var(--pb-chart-4, #ad861e)',
  'var(--pb-chart-5, #7a6c9d)',
  'var(--pb-chart-6, #64858b)',
];
export function ChartBlock({ config }: { config: ChartConfig }) {
  const [period, setPeriod] = React.useState('current');
  const [tab, setTab] = React.useState('chart');
  const [primary, setPrimary] = React.useState(true);
  const [secondary, setSecondary] = React.useState(true);
  const [focus, setFocus] = React.useState('');
  const data = config.series.map((item, index) => ({
    ...item,
    primary:
      period === 'current'
        ? item.primary
        : Math.round(item.primary * (0.78 + (index % 3) * 0.04) * 100) / 100,
    secondary:
      item.secondary === undefined
        ? undefined
        : period === 'current'
          ? item.secondary
          : Math.round(item.secondary * 0.86 * 100) / 100,
  }));
  const total = data.reduce((sum, item) => sum + item.primary, 0);
  const format = (value: number) =>
    config.unit === 'USD'
      ? money(value)
      : `${value.toLocaleString('en-US')}${config.unit ? ` ${config.unit}` : ''}`;
  const tooltip = (
    <Tooltip
      contentStyle={{
        borderRadius: 6,
        border: '1px solid var(--ui-border)',
        background: 'var(--ui-surface)',
        color: 'var(--ui-foreground)',
        fontSize: 12,
      }}
    />
  );
  const grid = <CartesianGrid stroke="var(--ui-border)" vertical={false} strokeDasharray="3 3" />;
  const x = (
    <XAxis
      dataKey="name"
      axisLine={false}
      tickLine={false}
      tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
      interval="preserveStartEnd"
      minTickGap={12}
    />
  );
  const y = (
    <YAxis
      width={50}
      axisLine={false}
      tickLine={false}
      tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
      tickFormatter={(value: number) =>
        Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
      }
    />
  );
  const line1 = primary && (
    <Line
      type="monotone"
      dataKey="primary"
      name={config.primaryLabel}
      stroke={colors[0]}
      strokeWidth={2.5}
      dot={false}
      isAnimationActive={false}
    />
  );
  const line2 = secondary && config.secondaryLabel && (
    <Line
      type="monotone"
      dataKey="secondary"
      name={config.secondaryLabel}
      stroke={colors[1]}
      strokeWidth={2}
      dot={false}
      isAnimationActive={false}
    />
  );
  let chart: React.ReactElement;
  switch (config.variant) {
    case 'area':
      chart = (
        <AreaChart data={data} accessibilityLayer>
          {grid}
          {x}
          {y}
          {tooltip}
          {primary && (
            <Area
              type="monotone"
              dataKey="primary"
              name={config.primaryLabel}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.13}
              strokeWidth={2}
              isAnimationActive={false}
            />
          )}
          {secondary && (
            <Area
              type="monotone"
              dataKey="secondary"
              name={config.secondaryLabel}
              stroke={colors[1]}
              fill={colors[1]}
              fillOpacity={0.07}
              strokeWidth={2}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      );
      break;
    case 'line':
      chart = (
        <LineChart data={data} accessibilityLayer>
          {grid}
          {x}
          {y}
          {tooltip}
          {line1}
          {line2}
        </LineChart>
      );
      break;
    case 'bar':
    case 'stacked':
      chart = (
        <BarChart data={data} accessibilityLayer>
          {grid}
          {x}
          {y}
          {tooltip}
          {primary && (
            <Bar
              dataKey="primary"
              name={config.primaryLabel}
              fill={colors[0]}
              radius={[3, 3, 0, 0]}
              stackId={config.variant === 'stacked' ? 'hours' : undefined}
              isAnimationActive={false}
            />
          )}
          {secondary && (
            <Bar
              dataKey="secondary"
              name={config.secondaryLabel}
              fill={colors[1]}
              radius={[3, 3, 0, 0]}
              stackId={config.variant === 'stacked' ? 'hours' : undefined}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      );
      break;
    case 'horizontal':
      chart = (
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ left: 8, right: 15 }}>
          {grid}
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={102}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
          />
          {tooltip}
          {primary && (
            <Bar
              dataKey="primary"
              name={config.primaryLabel}
              fill={colors[0]}
              isAnimationActive={false}
            />
          )}
          {secondary && (
            <Bar
              dataKey="secondary"
              name={config.secondaryLabel}
              fill={colors[2]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      );
      break;
    case 'donut':
      chart = (
        <PieChart accessibilityLayer>
          {tooltip}
          <Pie
            data={data}
            dataKey="primary"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((item, index) => (
              <Cell
                key={item.name}
                fill={colors[index % colors.length]}
                opacity={focus && focus !== item.name ? 0.25 : 1}
              />
            ))}
          </Pie>
        </PieChart>
      );
      break;
    case 'composed':
      chart = (
        <ComposedChart data={data} accessibilityLayer>
          {grid}
          {x}
          {y}
          {tooltip}
          {primary && (
            <Bar
              dataKey="primary"
              name={config.primaryLabel}
              fill={colors[0]}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          )}
          {line2}
        </ComposedChart>
      );
      break;
    case 'radar':
      chart = (
        <RadarChart data={data} outerRadius="75%" accessibilityLayer>
          <PolarGrid stroke="var(--ui-border)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {tooltip}
          {primary && (
            <Radar
              name={config.primaryLabel}
              dataKey="primary"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          )}
          {secondary && (
            <Radar
              name={config.secondaryLabel}
              dataKey="secondary"
              stroke={colors[1]}
              fill={colors[1]}
              fillOpacity={0.08}
              isAnimationActive={false}
            />
          )}
        </RadarChart>
      );
      break;
    case 'scatter':
      chart = (
        <ScatterChart accessibilityLayer margin={{ bottom: 15, right: 15 }}>
          {grid}
          <XAxis
            type="number"
            dataKey="primary"
            name={config.primaryLabel}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
            label={{
              value: config.primaryLabel,
              position: 'insideBottom',
              offset: -10,
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="secondary"
            name={config.secondaryLabel}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--ui-muted-foreground)' }}
          />
          {tooltip}
          <Scatter name="Cohorts" data={data} fill={colors[0]} isAnimationActive={false} />
        </ScatterChart>
      );
      break;
    case 'funnel':
      chart = (
        <FunnelChart accessibilityLayer>
          {tooltip}
          <Funnel dataKey="primary" data={data} nameKey="name" isAnimationActive={false}>
            {data.map((item, index) => (
              <Cell
                key={item.name}
                fill={colors[index % colors.length]}
                opacity={focus && focus !== item.name ? 0.3 : 1}
              />
            ))}
            <LabelList position="center" dataKey="primary" fill="white" fontSize={12} />
          </Funnel>
        </FunnelChart>
      );
      break;
  }
  return (
    <section data-block="charts" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <ChoiceSelect
              label="Chart period"
              value={period}
              onChange={setPeriod}
              choices={[
                { value: 'current', label: 'Current period' },
                { value: 'previous', label: 'Previous period' },
              ]}
            />
            <ExportButton
              onClick={() =>
                exportCsv(
                  `${config.variant}-data.csv`,
                  ['Category', config.primaryLabel, config.secondaryLabel ?? 'Secondary'],
                  data.map((item) => [item.name, item.primary, item.secondary]),
                )
              }
            />
          </>
        }
      />
      <div className="pb-chart-summary">
        <strong>
          {config.variant === 'line' || config.variant === 'radar' || config.variant === 'scatter'
            ? format(Math.round((total / data.length) * 10) / 10)
            : config.variant === 'funnel'
              ? `${Math.round((data[data.length - 1].primary / data[0].primary) * 1000) / 10}%`
              : format(total)}
        </strong>
        <span>
          {config.variant === 'funnel'
            ? 'overall conversion'
            : ['line', 'radar', 'scatter'].includes(config.variant)
              ? 'average'
              : 'total'}
        </span>
        <Badge variant="outline">
          {data.length} {config.variant === 'funnel' ? 'stages' : 'data points'}
        </Badge>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="underline" aria-label="Chart representation">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <div
            className="pb-chart-canvas"
            role="img"
            aria-label={`${config.title}: ${data.map((item) => `${item.name} ${format(item.primary)}`).join('; ')}`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {chart}
            </ResponsiveContainer>
          </div>
          {['donut', 'funnel'].includes(config.variant) ? (
            <div className="pb-chart-categories">
              {data.map((item, index) => (
                <button
                  type="button"
                  key={item.name}
                  aria-pressed={focus === item.name}
                  onClick={() => setFocus(focus === item.name ? '' : item.name)}
                >
                  <span style={{ backgroundColor: colors[index % colors.length] }} />
                  <span>{item.name}</span>
                  <strong>
                    {config.variant === 'donut'
                      ? `${Math.round((item.primary / total) * 100)}%`
                      : item.primary.toLocaleString('en-US')}
                  </strong>
                </button>
              ))}
            </div>
          ) : (
            config.variant !== 'scatter' && (
              <div className="pb-chart-legend">
                <Label>
                  <Checkbox
                    checked={primary}
                    onCheckedChange={(value) => setPrimary(value === true)}
                  />
                  <i style={{ backgroundColor: colors[0] }} />
                  {config.primaryLabel}
                </Label>
                {config.secondaryLabel && (
                  <Label>
                    <Checkbox
                      checked={secondary}
                      onCheckedChange={(value) => setSecondary(value === true)}
                    />
                    <i style={{ backgroundColor: colors[1] }} />
                    {config.secondaryLabel}
                  </Label>
                )}
              </div>
            )
          )}
        </TabsContent>
        <TabsContent value="data">
          <div
            className="pb-table-scroll"
            tabIndex={0}
            role="region"
            aria-label={`${config.title} data`}
          >
            <table className="pb-native-table">
              <caption className="sr-only">{config.title} data</caption>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>{config.primaryLabel}</th>
                  {config.secondaryLabel && <th>{config.secondaryLabel}</th>}
                  {config.variant === 'funnel' && <th>Conversion</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.name}>
                    <th scope="row">{item.name}</th>
                    <td>{format(item.primary)}</td>
                    {config.secondaryLabel && (
                      <td>{item.secondary === undefined ? '-' : format(item.secondary)}</td>
                    )}
                    {config.variant === 'funnel' && (
                      <td>
                        {index === 0
                          ? '100%'
                          : `${Math.round((item.primary / data[index - 1].primary) * 1000) / 10}%`}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
