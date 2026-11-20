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
    start: '2026-11-12',
    end: '2026-11-16',
    progress: 100,
  },
  {
    id: 'wireframes',
    label: 'Develop wireframes',
    start: '2026-11-16',
    end: '2026-11-20',
    progress: 80,
    dependencies: ['research'],
  },
  {
    id: 'review',
    label: 'Client review',
    start: '2026-11-18',
    end: '2026-11-22',
    progress: 30,
    dependencies: ['wireframes'],
  },
  {
    id: 'prototype',
    label: 'Create prototype',
    start: '2026-11-21',
    end: '2026-11-28',
    progress: 45,
    dependencies: ['review'],
  },
  {
    id: 'testing',
    label: 'Test with customers',
    start: '2026-11-24',
    end: '2026-12-01',
    progress: 20,
    dependencies: ['prototype'],
  },
  {
    id: 'docs',
    label: 'Technical documentation',
    start: '2026-11-26',
    end: '2026-12-03',
    progress: 15,
    dependencies: ['review'],
  },
  {
    id: 'prepare',
    label: 'Prepare launch',
    start: '2026-12-01',
    end: '2026-12-05',
    progress: 0,
    dependencies: ['testing', 'docs'],
  },
  {
    id: 'launch',
    label: 'Release',
    start: '2026-12-06',
    end: '2026-12-08',
    progress: 0,
    dependencies: ['prepare'],
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
          key={String(state.scale ?? 'day')}
          tasks={tasks}
          defaultScale={state.scale === 'week' || state.scale === 'month' ? state.scale : 'day'}
          height={420}
          today="2026-11-20"
          showTaskList={!!state.showTaskList}
          highlightWeekends={state.highlightWeekends !== false}
          showToday={state.showToday !== false}
          showDependencies={state.showDependencies !== false}
          showTaskDetails={state.showTaskDetails !== false}
          showToolbar={state.showToolbar !== false}
          draggable={state.draggable !== false}
          resizable={state.resizable !== false}
          labelPosition={
            state.labelPosition === 'inside' ||
            state.labelPosition === 'outside' ||
            state.labelPosition === 'hidden'
              ? state.labelPosition
              : 'auto'
          }
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
