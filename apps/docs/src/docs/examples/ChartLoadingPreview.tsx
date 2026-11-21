import { ChartSkeleton, type ChartSkeletonVariant } from '@plain/ui';

/** Use the lightweight core export while the chart engine is still downloading. */
export function ChartLoadingPreview({
  slug,
  state = {},
}: {
  slug: string;
  state?: Record<string, string | number | boolean>;
}) {
  const variant = slug.replace(/-chart$/, '') as ChartSkeletonVariant;
  return (
    <ChartSkeleton
      variant={variant === 'donut' && Number(state.innerRadius) === 0 ? 'pie' : variant}
      height={
        variant === 'gantt'
          ? 420
          : variant === 'heatmap'
            ? 16 + 3 * ((Number(state.cellSize) || 40) + 4) + 28
            : 280
      }
      legend={variant !== 'scatter' && state.legend !== false}
      rows={3}
      columns={5}
      showToolbar={state.showToolbar !== false}
      showTaskList={!!state.showTaskList}
    />
  );
}
