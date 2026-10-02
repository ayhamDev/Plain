import * as React from 'react';
import {
  PieChart,
  RadarChart,
  ScatterChart,
  ComposedChart,
  HeatmapChart,
  GanttChart,
  type GanttTask,
} from '@plain/ui/charts';
import { Small } from '@plain/ui';
import { chartSampleData, donutSampleData } from '../chart-samples';
import '@plain/ui/charts.css';

const heatmap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].flatMap((x, i) =>
  ['Design', 'Engineering', 'Operations'].map((y, j) => ({ x, y, value: ((i + j * 3) % 9) + 1 })),
);
const initialTasks: GanttTask[] = [
  {
    id: 'research',
    label: 'Customer research',
    start: '2026-10-01',
    end: '2026-10-08',
    progress: 100,
  },
  {
    id: 'design',
    label: 'Design system',
    start: '2026-10-07',
    end: '2026-10-18',
    progress: 65,
    dependencies: ['research'],
  },
  {
    id: 'build',
    label: 'Implementation',
    start: '2026-10-15',
    end: '2026-10-29',
    progress: 20,
    dependencies: ['design'],
  },
  {
    id: 'launch',
    label: 'Launch',
    start: '2026-10-28',
    end: '2026-11-02',
    progress: 0,
    dependencies: ['build'],
  },
];
const radar = [
  { skill: 'Research', team: 85, benchmark: 65 },
  { skill: 'Design', team: 90, benchmark: 72 },
  { skill: 'Testing', team: 65, benchmark: 80 },
  { skill: 'Delivery', team: 78, benchmark: 70 },
  { skill: 'Quality', team: 88, benchmark: 75 },
];
export default function WorkspaceCharts({
  slug,
  state = {},
}: {
  slug: string;
  state?: Record<string, string | number | boolean>;
}) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [selection, setSelection] = React.useState('');
  const dataTable =
    state.dataTable === 'false' ? false : state.dataTable === 'visible' ? 'visible' : 'sr-only';
  const common = { height: 280, loading: !!state.loading, dataTable } as const;
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {slug === 'pie-chart' ? (
        <PieChart {...common} data={donutSampleData} label="Projects by status" />
      ) : slug === 'radar-chart' ? (
        <RadarChart
          {...common}
          data={radar}
          index="skill"
          label="Team capabilities"
          series={[
            { dataKey: 'team', label: 'Team' },
            { dataKey: 'benchmark', label: 'Benchmark' },
          ]}
        />
      ) : slug === 'scatter-chart' ? (
        <ScatterChart
          {...common}
          data={[
            { hours: 2, points: 8 },
            { hours: 3, points: 14 },
            { hours: 5, points: 18 },
            { hours: 7, points: 30 },
            { hours: 9, points: 35 },
          ]}
          xKey="hours"
          yKey="points"
          label="Effort and results"
        />
      ) : slug === 'composed-chart' ? (
        <ComposedChart
          {...common}
          data={chartSampleData}
          index="month"
          label="Revenue and costs"
          series={[
            { dataKey: 'revenue', label: 'Revenue', type: 'bar' },
            { dataKey: 'costs', label: 'Costs', type: 'line' },
          ]}
        />
      ) : slug === 'heatmap-chart' ? (
        <HeatmapChart
          data={heatmap}
          cellSize={Number(state.cellSize ?? 40)}
          labelWidth={96}
          showValues={state.showValues !== false}
          dataTable={dataTable}
          loading={!!state.loading}
          label="Workload by team"
          onCellClick={(cell) => setSelection(`${cell.y}, ${cell.x}: ${cell.value}`)}
        />
      ) : (
        <GanttChart
          {...common}
          tasks={tasks}
          scale={state.scale === 'week' || state.scale === 'month' ? state.scale : 'day'}
          label="Project delivery"
          onTaskClick={(task) => setSelection(task.label)}
          onTaskChange={(task) =>
            setTasks((values) => values.map((value) => (value.id === task.id ? task : value)))
          }
        />
      )}
      <Small role="status" tone="muted">
        {selection}
      </Small>
    </div>
  );
}
