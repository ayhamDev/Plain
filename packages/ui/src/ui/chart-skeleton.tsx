import * as React from 'react';
import { useStyles, useDirection, type PlainStyleProps } from './styling';
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
const curve =
  'M64 190 C96 190 102 138 142 146 S198 186 226 154 S278 74 320 104 S378 150 410 102 S474 130 508 80 S576 94 612 44';
const secondCurve =
  'M64 208 C110 208 110 178 158 184 S226 164 270 184 S326 122 374 152 S448 160 496 136 S564 158 612 112';
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

function Guides({ gridClassName }: { gridClassName?: string }) {
  return (
    <>
      {[44, 96, 148, 200].map((y) => (
        <g key={y}>
          <rect x={8} y={y - 4} width={y === 148 ? 24 : 32} height={8} rx={4} opacity={0.7} />
          <path
            d={`M56 ${y}H620`}
            data-ui="chart-skeleton"
            data-slot="grid"
            className={gridClassName}
          />
        </g>
      ))}
      <path
        d="M56 28V228H620"
        data-ui="chart-skeleton"
        data-slot="grid"
        className={gridClassName}
      />
      {[64, 168, 272, 376, 480, 584].map((x) => (
        <rect key={x} x={x} y={244} width={32} height={8} rx={4} opacity={0.65} />
      ))}
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
}: Required<Pick<ChartSkeletonProps, 'variant' | 'layout' | 'legend' | 'showTaskList'>> & {
  gridClassName?: string;
  lineClassName?: string;
  rows: number;
  columns: number;
}) {
  if (variant === 'heatmap')
    return (
      <>
        {Array.from({ length: rows }, (_, row) => (
          <g key={row}>
            <rect
              x={8}
              y={32 + row * 36}
              width={row % 2 ? 44 : 60}
              height={8}
              rx={4}
              opacity={0.65}
            />
            {Array.from({ length: columns }, (_, col) => (
              <rect
                key={col}
                x={96 + col * 36}
                y={20 + row * 36}
                width={32}
                height={32}
                rx={4}
                opacity={0.4 + ((row * 3 + col) % 4) * 0.16}
              />
            ))}
          </g>
        ))}
        {Array.from({ length: columns }, (_, col) => (
          <rect key={col} x={102 + col * 36} y={6} width={20} height={6} rx={3} opacity={0.6} />
        ))}
        {legend &&
          [0, 1, 2, 3, 4].map((i) => (
            <rect
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
            <path
              d={`M0 ${y}H640`}
              data-ui="chart-skeleton"
              data-slot="grid"
              className={gridClassName}
            />
            {showTaskList && (
              <rect x={16} y={y + 15} width={i % 2 ? 92 : 120} height={8} rx={4} opacity={0.6} />
            )}
            <rect
              x={(showTaskList ? 200 : 24) + i * (showTaskList ? 36 : 54)}
              y={y + 9}
              width={116 + (i % 3) * 28}
              height={24}
              rx={5}
              opacity={i % 2 ? 0.65 : 0.95}
            />
          </g>
        ))}
        {showTaskList && (
          <path
            d="M176 0V280"
            data-ui="chart-skeleton"
            data-slot="grid"
            className={gridClassName}
          />
        )}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect
              x={(showTaskList ? 200 : 24) + i * (showTaskList ? 72 : 100)}
              y={20}
              width={32}
              height={7}
              rx={3.5}
              opacity={0.65}
            />
            <path
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
              r={82}
              fill="none"
              stroke="currentColor"
              strokeWidth={30}
              opacity={0.45}
            />
            <circle
              cx={320}
              cy={132}
              r={82}
              fill="none"
              stroke="currentColor"
              strokeWidth={30}
              strokeDasharray="128 12 206 12 145 12"
              transform={`rotate(-90 ${320} 132)`}
            />
          </>
        ) : (
          <g transform={`translate(${320} 132)`}>
            <circle r={96} opacity={0.7} />
            <path d="M0 0V-96A96 96 0 0 1 83.14 48Z" />
            <path d="M0 0L83.14 48A96 96 0 0 1 -83.14 48Z" opacity={0.45} />
          </g>
        )}
        {legend &&
          [0, 1, 2].map((i) => (
            <g key={i} opacity={1 - i * 0.13}>
              <circle cx={218 + i * 76} cy={258} r={4} />
              <rect x={230 + i * 76} y={254} width={44} height={8} rx={4} />
            </g>
          ))}
      </>
    );
  if (variant === 'radar')
    return (
      <>
        {[1, 0.72, 0.44].map((scale) => (
          <polygon
            key={scale}
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
          <path
            key={x + y}
            d={`M320 130L${x} ${y}`}
            data-ui="chart-skeleton"
            data-slot="grid"
            className={gridClassName}
          />
        ))}
        <polygon points="320,54 388,106 354,178 274,192 256,108" opacity={0.6} />
        {[
          [296, 8],
          [436, 94],
          [374, 228],
          [218, 228],
          [166, 94],
        ].map(([x, y]) => (
          <rect key={x + y} x={x} y={y} width={40} height={8} rx={4} opacity={0.6} />
        ))}
      </>
    );
  return (
    <>
      <Guides gridClassName={gridClassName} />
      {(variant === 'bar' || variant === 'composed') &&
        bars.map((height, i) =>
          layout === 'vertical' ? (
            <rect
              key={i}
              x={64}
              y={28 + i * 24}
              width={height * 2.5}
              height={14}
              rx={4}
              opacity={variant === 'composed' ? 0.6 : 1}
            />
          ) : (
            <rect
              key={i}
              x={72 + i * 66}
              y={228 - height}
              width={38}
              height={height}
              rx={5}
              opacity={variant === 'composed' ? 0.6 : 1}
            />
          ),
        )}
      {variant === 'area' && <path d={`${curve}V228H64Z`} opacity={0.4} />}
      {['area', 'line', 'composed'].includes(variant) && (
        <path d={curve} data-ui="chart-skeleton" data-slot="line" className={lineClassName} />
      )}
      {variant === 'line' && (
        <path
          d={secondCurve}
          data-ui="chart-skeleton"
          data-slot="line"
          className={lineClassName}
          strokeDasharray="6 8"
          opacity={0.5}
        />
      )}
      {variant === 'scatter' &&
        points.map(([x, y], i) => (
          <circle key={x} cx={x} cy={y} r={(i % 3) + 5} opacity={i % 2 ? 0.55 : 1} />
        ))}
      {legend && (
        <g opacity={0.7}>
          <circle cx={252} cy={272} r={4} />
          <rect x={264} y={268} width={52} height={8} rx={4} />
          <circle cx={340} cy={272} r={4} />
          <rect x={352} y={268} width={52} height={8} rx={4} />
        </g>
      )}
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
    const plotWidth = variant === 'heatmap' ? 96 + columnCount * 36 : 640;
    const plotHeight = variant === 'heatmap' ? 16 + rowCount * 36 + (legend ? 28 : 0) : 280;
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
          focusable="false"
          viewBox={
            ['pie', 'donut', 'radar'].includes(variant)
              ? '160 0 320 280'
              : `0 0 ${plotWidth} ${plotHeight}`
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
                ? `translate(${plotWidth} 0) scale(-1 1)`
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
