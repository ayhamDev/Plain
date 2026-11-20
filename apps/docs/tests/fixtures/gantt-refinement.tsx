import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { PlainProvider, LanguageProvider } from '@plain/ui';
import { GanttChart, type GanttTask } from '@plain/ui/charts';
import '@plain/ui/styles.css';
import '@plain/ui/charts.css';

const params = new URLSearchParams(location.search);
const initial: GanttTask[] = [
  {
    id: 'research',
    label: 'Customer research',
    start: '2026-11-12',
    end: '2026-11-16',
    progress: 100,
  },
  {
    id: 'design',
    label: 'Design system',
    start: '2026-11-16',
    end: '2026-11-21',
    progress: 60,
    dependencies: ['research'],
  },
  {
    id: 'build',
    label: 'Implementation',
    start: '2026-11-20',
    end: '2026-11-27',
    progress: 20,
    dependencies: ['design'],
  },
  {
    id: 'launch',
    label: 'Launch',
    start: '2026-11-29',
    end: '2026-12-01',
    progress: 0,
    dependencies: ['build'],
  },
  { id: 'locked', label: 'Locked task', start: '2026-11-20', end: '2026-11-22', disabled: true },
  {
    id: 'short',
    label: 'A short task with a very long localized label',
    start: '2026-11-15',
    end: '2026-11-16',
    progress: 25,
  },
];
const many: GanttTask[] = Array.from({ length: 2000 }, (_, i) => ({
  ...initial[i % initial.length],
  id: `task-${i}`,
  label: `Task ${i}`,
  dependencies: [],
}));
function Fixture() {
  const [tasks, setTasks] = React.useState(params.has('large') ? many : initial);
  const [result, setResult] = React.useState<unknown>();
  const [commits, setCommits] = React.useState(0);
  const [activation, setActivation] = React.useState('');
  const dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
  return (
    <PlainProvider
      persist={false}
      dir={dir}
      theme={{ mode: params.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
    >
      <LanguageProvider locale={params.has('arabic') ? 'ar' : 'en'} dir={dir}>
        <main style={{ padding: 16 }}>
          <h1 style={{ fontSize: 24, marginBottom: 24 }}>Delivery workspace</h1>
          <GanttChart
            tasks={tasks}
            label="Delivery timeline"
            height={360}
            today="2026-11-20"
            showTaskList={!params.has('compact')}
            dataTable={false}
            start={params.has('large') ? '2020-01-01' : undefined}
            end={params.has('large') ? '2050-01-01' : undefined}
            draggable={!params.has('no-drag')}
            resizable={!params.has('no-resize')}
            showTaskDetails={!params.has('no-details')}
            onTaskClick={(task) => setActivation(task.id)}
            onTaskChange={
              params.has('readonly')
                ? undefined
                : (next, previous, reason) => {
                    setTasks((values) =>
                      values.map((value) => (value.id === next.id ? next : value)),
                    );
                    setCommits((count) => count + 1);
                    setResult({
                      id: next.id,
                      start: next.start,
                      end: next.end,
                      previousStart: previous.start,
                      previousEnd: previous.end,
                      reason,
                    });
                  }
            }
          />
          <output aria-label="Commits">{commits}</output>
          <output aria-label="Activation">{activation}</output>
          <output
            aria-label="Result"
            style={{ display: 'block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
          >
            {JSON.stringify(result)}
          </output>
        </main>
      </LanguageProvider>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
