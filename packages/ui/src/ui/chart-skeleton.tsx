import * as React from 'react';
import { useStyles, useDirection, type PlainStyleProps } from './style-context';
import { useMotionSettings } from './motion-policy';
import { useTranslation } from './i18n';

export type ChartSkeletonVariant =
  | 'area'
  | 'bar'
  | 'line'
  | 'composed'
  | 'donut'
  | 'pie'
  | 'radar'
  | 'scatter'
  | 'heatmap'
  | 'gantt';

export interface ChartSkeletonProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  variant?: ChartSkeletonVariant;
  /** Match the chart's viewport height, including when used as a Suspense fallback. */
  height?: React.CSSProperties['height'];
  /** Screen-reader announcement; defaults to the provider's chart loading message. */
  label?: string;
  animate?: boolean;
  legend?: boolean;
  /** Match the visible chart's Cartesian guides and axis labels. */
  grid?: boolean;
  xAxis?: boolean;
  yAxis?: boolean;
  /** Mirrors Cartesian chart layout; vertical means horizontal bars. */
  layout?: 'horizontal' | 'vertical';
  /** Gantt toolbar and task column placeholders. */
  showToolbar?: boolean;
  showTaskList?: boolean;
  /** Heatmap grid dimensions; placeholders are capped at 12 rows and 24 columns. */
  rows?: number;
  columns?: number;
}

const hidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};
const bars = [70, 104, 90, 142, 118, 178, 154, 194];
const curve = 'M64 190 C132 180 146 150 216 156 S330 104 392 112 S522 68 612 52';
const secondCurve = 'M64 208 C150 204 172 184 242 186 S382 154 450 160 S552 132 612 124';
const points = [
  [86, 190],
  [130, 148],
  [160, 172],
  [198, 122],
  [220, 160],
  [264, 110],
  [298, 138],
  [326, 84],
  [366, 122],
  [400, 60],
  [442, 100],
  [474, 66],
  [524, 88],
  [554, 38],
  [592, 68],
];

/** Intrinsic SVG paint rules also keep the fallback valid before CSS is ready. */
function Guide(props: React.SVGProps<SVGPathElement>) {
  return (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      opacity={0.35}
      {...props}
    />
  );
}
function Block(props: React.SVGProps<SVGRectElement>) {
  return React.createElement('rect', { fill: 'currentColor', stroke: 'none', ...props });
}
/** Round stroke caps keep dots circular even in a stretched Cartesian viewport. */
function Dot({
  x,
  y,
  size = 8,
  ...props
}: React.SVGProps<SVGPathElement> & {
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <path
      d={`M${x} ${y}h0.01`}
      fill="none"
      stroke="currentColor"
      strokeWidth={size}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      {...props}
    />
  );
}
function Label({
  x,
  y,
  width,
  ...props
}: React.SVGProps<SVGPathElement> & {
  x: number;
  y: number;
  width: number;
}) {
  return (
    <path
      d={`M${x + 3} ${y}h${width - 6}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      {...props}
    />
  );
}
function PlaceholderLegend({ count = 2 }: { count?: number }) {
  const start = 320 - (count * 84 - 24) / 2;
  return (
    <g data-part="legend" opacity={0.75}>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} opacity={1 - i * 0.16}>
          <Dot x={start + i * 84} y={270} size={6} />
          <Label x={start + 12 + i * 84} y={270} width={48} />
        </g>
      ))}
    </g>
  );
}
function Guides({
  gridClassName,
  grid,
  xAxis,
  yAxis,
}: {
  gridClassName?: string;
  grid: boolean;
  xAxis: boolean;
  yAxis: boolean;
}) {
  return (
    <>
      {grid && (
        <g data-part="grid-lines">
          {[44, 96, 148, 200].map((y) => (
            <Guide
              key={y}
              d={`M56 ${y}H620`}
              data-ui="chart-skeleton"
              data-slot="grid"
              className={gridClassName}
            />
          ))}
        </g>
      )}
      {yAxis && (
        <g data-part="y-axis">
          {[44, 96, 148, 200].map((y) => (
            <Label key={y} x={12} y={y} width={y === 148 ? 22 : 30} opacity={0.7} />
          ))}
          <Guide
            d="M56 28V228"
            data-ui="chart-skeleton"
            data-slot="grid"
            className={gridClassName}
          />
        </g>
      )}
      {xAxis && (
        <g data-part="x-axis">
          <Guide
            d="M56 228H620"
            data-ui="chart-skeleton"
            data-slot="grid"
            className={gridClassName}
          />
          {[64, 168, 272, 376, 480, 584].map((x) => (
            <Label key={x} x={x} y={246} width={28} opacity={0.65} />
          ))}
        </g>
      )}
    </>
  );
}

function Shape({
  variant,
  layout,
  legend,
  showTaskList,
  gridClassName,
  lineClassName,
  rows,
  columns,
  grid,
  xAxis,
  yAxis,
}: Required<Pick<ChartSkeletonProps, 'variant' | 'layout' | 'legend' | 'showTaskList'>> & {
  gridClassName?: string;
  lineClassName?: string;
  rows: number;
  columns: number;
  grid: boolean;
  xAxis: boolean;
  yAxis: boolean;
}) {
  if (variant === 'heatmap')
    return (
      <>
        {Array.from({ length: rows }, (_, row) => (
          <g key={row}>
            <Label x={8} y={36 + row * 36} width={row % 2 ? 44 : 60} opacity={0.65} />
            {Array.from({ length: columns }, (_, col) => (
              <Block
                key={col}
                x={96 + col * 36}
                y={20 + row * 36}
                width={32}
                height={32}
                rx={4}
                opacity={0.35 + ((row + col) % 3) * 0.15}
              />
            ))}
          </g>
        ))}
        {Array.from({ length: columns }, (_, col) => (
          <Label key={col} x={102 + col * 36} y={9} width={20} opacity={0.6} />
        ))}
        {legend &&
          [0, 1, 2, 3, 4].map((i) => (
            <Block
              key={i}
              x={96 + columns * 36 - 120 + i * 24}
              y={28 + rows * 36}
              width={18}
              height={14}
              rx={3}
              opacity={0.35 + i * 0.15}
            />
          ))}
      </>
    );
  if (variant === 'gantt')
    return (
      <>
        {[48, 92, 136, 180, 224].map((y, i) => (
          <g key={y}>
            <Guide
              d={`M0 ${y}H640`}
              data-ui="chart-skeleton"
              data-slot="grid"
              className={gridClassName}
            />
            {showTaskList && <Label x={16} y={y + 19} width={i % 2 ? 92 : 120} opacity={0.6} />}
            <Block
              x={(showTaskList ? 200 : 24) + i * (showTaskList ? 36 : 54)}
              y={y + 9}
              width={116 + (i % 3) * 28}
              height={24}
              rx={5}
              opacity={i % 2 ? 0.55 : 0.8}
            />
          </g>
        ))}
        {showTaskList && (
          <Guide
            d="M176 0V280"
            data-ui="chart-skeleton"
            data-slot="grid"
            className={gridClassName}
          />
        )}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <Label
              x={(showTaskList ? 200 : 24) + i * (showTaskList ? 72 : 100)}
              y={24}
              width={32}
              opacity={0.65}
            />
            <Guide
              d={`M${(showTaskList ? 176 : 0) + i * (showTaskList ? 77 : 106)} 48V280`}
              data-ui="chart-skeleton"
              data-slot="grid"
              className={gridClassName}
            />
          </g>
        ))}
      </>
    );
  if (variant === 'donut' || variant === 'pie')
    return (
      <>
        {variant === 'donut' ? (
          <>
            <circle
              cx={320}
              cy={132}
              r={80}
              fill="none"
              stroke="currentColor"
              strokeWidth={24}
              opacity={0.25}
            />
            <circle
              cx={320}
              cy={132}
              r={80}
              fill="none"
              stroke="currentColor"
              strokeWidth={24}
              strokeDasharray="140 10 190 10 142 11"
              opacity={0.8}
              transform={`rotate(-90 ${320} 132)`}
            />
          </>
        ) : (
          <g transform="translate(320 132)" stroke="none">
            <path d="M0 0L1.54 -87.99A88 88 0 0 1 76.97 42.66Z" fill="currentColor" opacity={0.8} />
            <path
              d="M0 0L75.43 45.32A88 88 0 0 1 -75.43 45.32Z"
              fill="currentColor"
              opacity={0.5}
            />
            <path
              d="M0 0L-76.97 42.66A88 88 0 0 1 -1.54 -87.99Z"
              fill="currentColor"
              opacity={0.65}
            />
          </g>
        )}
        {legend && <PlaceholderLegend count={3} />}
      </>
    );
  if (variant === 'radar')
    return (
      <>
        {grid && (
          <g data-part="grid-lines">
            {[1, 0.72, 0.44].map((scale) => (
              <polygon
                key={scale}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={0.35}
                points="320,28 416,98 380,210 260,210 224,98"
                data-ui="chart-skeleton"
                data-slot="grid"
                className={gridClassName}
                transform={`translate(320 130) scale(${scale}) translate(-320 -130)`}
              />
            ))}
            {[
              [320, 28],
              [416, 98],
              [380, 210],
              [260, 210],
              [224, 98],
            ].map(([x, y]) => (
              <Guide
                key={x + y}
                d={`M320 130L${x} ${y}`}
                data-ui="chart-skeleton"
                data-slot="grid"
                className={gridClassName}
              />
            ))}
          </g>
        )}
        <polygon
          points="320,54 388,106 354,178 274,192 256,108"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          fillOpacity={0.18}
          strokeOpacity={0.8}
          strokeLinejoin="round"
        />
        {[
          [296, 8],
          [436, 94],
          [374, 228],
          [218, 228],
          [166, 94],
        ].map(([x, y]) => (
          <Label key={x + y} x={x} y={y + 4} width={40} opacity={0.6} />
        ))}
        {legend && <PlaceholderLegend />}
      </>
    );
  return (
    <>
      <Guides gridClassName={gridClassName} grid={grid} xAxis={xAxis} yAxis={yAxis} />
      {(variant === 'bar' || variant === 'composed') &&
        bars.map((height, i) =>
          layout === 'vertical' ? (
            <Block
              key={i}
              x={64}
              y={28 + i * 24}
              width={height * 2.5}
              height={14}
              rx={4}
              opacity={variant === 'composed' ? 0.45 : 0.8}
            />
          ) : (
            <Block
              key={i}
              x={72 + i * 66}
              y={228 - height}
              width={38}
              height={height}
              rx={5}
              opacity={variant === 'composed' ? 0.45 : 0.8}
            />
          ),
        )}
      {variant === 'area' && (
        <path
          data-part="area-fill"
          d={`${curve}V228H64Z`}
          fill="currentColor"
          stroke="none"
          opacity={0.18}
        />
      )}
      {['area', 'line', 'composed'].includes(variant) && (
        <path
          d={curve}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
          data-ui="chart-skeleton"
          data-slot="line"
          className={lineClassName}
        />
      )}
      {variant === 'line' && (
        <path
          d={secondCurve}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          data-ui="chart-skeleton"
          data-slot="line"
          className={lineClassName}
          strokeDasharray="6 8"
          opacity={0.5}
        />
      )}
      {variant === 'scatter' &&
        points.map(([x, y], i) => (
          <Dot key={x} x={x} y={y} size={(i % 3) + 6} opacity={i % 2 ? 0.5 : 0.85} />
        ))}
      {legend && <PlaceholderLegend />}
    </>
  );
}

/** Lightweight placeholder; no chart engine, observers, timers or generated data. */
export const ChartSkeleton = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ChartSkeletonProps>(
  (
    {
      variant = 'line',
      height = 300,
      label,
      animate = true,
      legend = true,
      grid = true,
      xAxis = true,
      yAxis = true,
      layout = 'horizontal',
      showToolbar = true,
      showTaskList = true,
      rows = 5,
      columns = 12,
      className,
      style,
      dir,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const motion = useMotionSettings(animate);
    const { t } = useTranslation();
    const direction = useDirection(dir === 'rtl' || dir === 'ltr' ? dir : undefined);
    const animated = animate && motion.enabled;
    const rowCount = Math.max(1, Math.min(12, Math.round(Number.isFinite(rows) ? rows : 5)));
    const columnCount = Math.max(
      1,
      Math.min(24, Math.round(Number.isFinite(columns) ? columns : 12)),
    );
    const cartesian = ['area', 'bar', 'line', 'composed', 'scatter'].includes(variant);
    const plotLeft = cartesian && !yAxis ? 48 : 0;
    const plotWidth = variant === 'heatmap' ? 96 + columnCount * 36 : 640 - plotLeft;
    const plotHeight =
      variant === 'heatmap'
        ? 16 + rowCount * 36 + (legend ? 28 : 0)
        : cartesian && !legend
          ? xAxis
            ? 260
            : 236
          : 280;
    return styles.tooltip(
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        dir={direction}
        {...styles('chart-skeleton.root', 'ui-chart-skeleton', className, unstyled)}
        data-variant={variant}
        data-motion={animated ? 'enabled' : 'disabled'}
        style={{ height: variant === 'gantt' ? undefined : height, ...style }}
        {...props}
      >
        <span style={hidden}>{label ?? t('chart.loading')}</span>
        {variant === 'gantt' && showToolbar && (
          <div
            aria-hidden="true"
            {...styles('chart-skeleton.toolbar', 'ui-chart-skeleton-toolbar', undefined, unstyled)}
          >
            <span />
            <span />
            <span />
          </div>
        )}
        <svg
          aria-hidden="true"
          fill="none"
          stroke="none"
          color={
            (unstyled ?? styles.unstyled)
              ? undefined
              : 'var(--ui-skeleton-background,var(--ui-border,#e5e7e6))'
          }
          focusable="false"
          viewBox={
            ['pie', 'donut', 'radar'].includes(variant)
              ? '160 0 320 280'
              : `${plotLeft} 0 ${plotWidth} ${plotHeight}`
          }
          preserveAspectRatio={
            ['pie', 'donut', 'radar'].includes(variant)
              ? 'xMidYMid meet'
              : variant === 'heatmap'
                ? direction === 'rtl'
                  ? 'xMaxYMin meet'
                  : 'xMinYMin meet'
                : 'none'
          }
          {...styles(
            'chart-skeleton.visual',
            `ui-chart-skeleton-visual${animated ? ' ui-skeleton' : ''}`,
            undefined,
            unstyled,
          )}
          style={{
            width: '100%',
            height: variant === 'gantt' ? height : '100%',
            display: 'block',
            overflow: 'hidden',
          }}
        >
          <g
            transform={
              direction === 'rtl' && !['pie', 'donut', 'radar'].includes(variant)
                ? `translate(${2 * plotLeft + plotWidth} 0) scale(-1 1)`
                : undefined
            }
          >
            <Shape
              variant={variant}
              layout={layout}
              legend={legend}
              showTaskList={showTaskList}
              rows={rowCount}
              columns={columnCount}
              grid={grid}
              xAxis={xAxis}
              yAxis={yAxis}
              gridClassName={
                styles('chart-skeleton.grid', 'ui-chart-skeleton-grid', undefined, unstyled)
                  .className
              }
              lineClassName={
                styles('chart-skeleton.line', 'ui-chart-skeleton-line', undefined, unstyled)
                  .className
              }
            />
          </g>
        </svg>
      </div>,
      unstyled,
    );
  },
);
ChartSkeleton.displayName = 'ChartSkeleton';
