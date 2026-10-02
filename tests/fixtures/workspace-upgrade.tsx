import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  LanguageProvider,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Stack,
  Strong,
  Stepper,
} from '../../src/ui';
import { FullCalendar, type CalendarEvent } from '../../src/ui/full-calendar';
import { GanttChart, HeatmapChart } from '../../src/ui/charts';
import { KanbanBoard, type KanbanColumn } from '../../src/ui/kanban';
import '../../src/ui/styles.css';
import '../../src/ui/full-calendar.css';
import '../../src/ui/charts.css';

const params = new URLSearchParams(location.search);
const dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
const locale = params.get('locale') ?? 'en';
const mode = params.get('mode') ?? 'table';
const events: CalendarEvent[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `event-${i}`,
  title: `Meeting ${i}`,
  start: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T${String(8 + (i % 9)).padStart(2, '0')}:00`,
  end: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T${String(9 + (i % 9)).padStart(2, '0')}:00`,
}));
const tasks = Array.from({ length: 2000 }, (_, i) => ({
  id: `task-${i}`,
  label: `Task ${i}`,
  start: '2026-10-05',
  end: '2026-10-12',
  progress: i % 101,
}));

function Board() {
  type Card = { id: string; title: string };
  const [columns, setColumns] = React.useState<KanbanColumn<Card>[]>([
    {
      id: 'todo',
      title: 'Todo',
      items: [
        { id: '1', title: 'Research' },
        { id: '2', title: 'Design' },
      ],
    },
    { id: 'done', title: 'Done', items: [] },
  ]);
  return (
    <KanbanBoard
      columns={columns}
      onColumnsChange={setColumns}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.title}
      renderCard={(item) => <Strong>{item.title}</Strong>}
    />
  );
}
function NativeTable() {
  const scroll = params.get('scroll') ?? 'inner';
  return (
    <div
      aria-label="Outer scroller"
      role="region"
      tabIndex={0}
      style={scroll === 'page' ? undefined : { height: 400, overflow: 'auto' }}
    >
      <div style={{ height: 64 }}>Workspace</div>
      <Table
        aria-label="Wide records"
        stickyHeader
        stickyHeaderOffset={scroll === 'inner' ? 0 : 24}
        stickyFooter
        stickyFooterOffset={scroll === 'inner' ? 0 : 16}
        stickyScrollbar
        scrollHeight={scroll === 'inner' ? 280 : undefined}
        style={{ minWidth: 1000 }}
      >
        <TableHeader>
          <TableRow>
            {Array.from({ length: 8 }, (_, i) => (
              <TableHead key={i}>Column {i}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 80 }, (_, row) => (
            <TableRow key={row}>
              {Array.from({ length: 8 }, (_, column) => (
                <TableCell key={column}>
                  Record {row}, value {column}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={8}>80 records</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div style={{ height: 800 }} />
    </div>
  );
}
function Fixture() {
  const [result, setResult] = React.useState('');
  const [data, setData] = React.useState(events);
  const [plan, setPlan] = React.useState(
    tasks.slice(0, 2).map((task, i) => ({ ...task, disabled: i === 1 })),
  );
  return (
    <PlainProvider
      persist={false}
      dir={dir}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion: params.get('motion') === 'system' ? 'system' : 'none',
      }}
    >
      <LanguageProvider locale={locale} timeZone="UTC" dir={dir}>
        <Stack padding={2} style={{ minWidth: 0 }}>
          {mode === 'table' ? (
            <NativeTable />
          ) : mode === 'calendar' ? (
            <>
              <Button
                onClick={() =>
                  setData([
                    ...events,
                    {
                      id: 'extra',
                      title: 'Added event',
                      start: '2026-10-05T09:00',
                      end: '2026-10-05T10:00',
                    },
                  ])
                }
              >
                Update events
              </Button>
              <FullCalendar
                events={data}
                defaultDate="2026-10-05"
                height={560}
                printable
                printMode="calendar"
                onEventClick={(event) => setResult(event.title)}
              />
            </>
          ) : mode === 'gantt-edit' ? (
            <GanttChart
              tasks={plan}
              height={300}
              dataTable={false}
              onTaskChange={(next, _previous, action) => {
                setPlan((previous) =>
                  previous.map((task) => (task.id === next.id ? { ...task, ...next } : task)),
                );
                setResult(JSON.stringify({ start: next.start, end: next.end, action }));
              }}
            />
          ) : mode === 'gantt' ? (
            <GanttChart
              tasks={tasks}
              height={300}
              dataTable={false}
              onTaskClick={(task) => setResult(task.id)}
            />
          ) : mode === 'heatmap' ? (
            <HeatmapChart
              data={['Mon', 'Tue'].flatMap((x, i) =>
                ['Design', 'Engineering'].map((y) => ({ x, y, value: i + 3 })),
              )}
              onCellClick={(cell) => setResult(`${cell.y}, ${cell.x}`)}
              showValues
              dataTable="visible"
            />
          ) : mode === 'stepper' ? (
            <Stepper
              steps={[
                { value: 'details', label: 'Details' },
                { value: 'team', label: 'Team' },
              ]}
              renderContent={(step) => (
                <Stack>
                  <Strong>{step.label}</Strong>
                  <Button>Content action</Button>
                </Stack>
              )}
            />
          ) : (
            <Board />
          )}
          <output aria-label="Result">{result}</output>
        </Stack>
      </LanguageProvider>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
