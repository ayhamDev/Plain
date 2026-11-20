import { Profiler, type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { GanttChart } from '../src/ui/gantt';
import {
  ganttRange,
  ganttTicks,
  ganttPeriods,
  ganttLayout,
  ganttEdit,
  ganttProgress,
} from '../src/ui/gantt-model';

const { tableCommit } = vi.hoisted(() => ({ tableCommit: vi.fn() }));
vi.mock('../src/ui/table', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/ui/table')>();
  return {
    ...actual,
    TableCell: function TrackedCell(props: ComponentProps<typeof actual.TableCell>) {
      return (
        <Profiler id="gantt-cell" onRender={tableCommit}>
          <actual.TableCell {...props} />
        </Profiler>
      );
    },
  };
});

describe('Gantt date model', () => {
  it('keeps the complete data alternative idle during visual updates and refreshes changed dates', () => {
    const tasks = [{ id: 'one', label: 'Launch', start: '2026-11-20', end: '2026-11-21' }];
    const { rerender } = render(
      <GanttChart tasks={tasks} today="2026-11-20" dataTable="visible" />,
    );
    expect(screen.getByRole('table')).toHaveTextContent('Launch');
    tableCommit.mockClear();
    rerender(
      <GanttChart
        tasks={tasks}
        today="2026-11-20"
        dataTable="visible"
        className="updated-layout"
      />,
    );
    expect(tableCommit).not.toHaveBeenCalled();
    rerender(
      <GanttChart
        tasks={[{ ...tasks[0], end: '2026-11-22' }]}
        today="2026-11-20"
        dataTable="visible"
        className="updated-layout"
      />,
    );
    expect(tableCommit).toHaveBeenCalled();
    expect(screen.getByRole('table')).toHaveTextContent('Nov 22, 2026');
  });
  it('keeps exclusive intervals and rejects invalid or reversed input', () => {
    expect(ganttRange('2024-02-28', '2024-03-01')?.days).toBe(2);
    expect(ganttRange('2026-02-30', '2026-03-01')).toBeUndefined();
    expect(ganttRange('2026-11-20', '2026-11-20')).toBeUndefined();
    expect(ganttRange('2026-11-21', '2026-11-20')).toBeUndefined();
  });
  it('aligns partial weeks and real month/year boundaries without fixed month lengths', () => {
    const range = ganttRange('2024-02-27', '2024-04-03')!;
    expect(
      ganttTicks(range, 'week', 1)
        .slice(0, 2)
        .map((tick) => tick.date.toString()),
    ).toEqual(['2024-02-27', '2024-03-04']);
    expect(ganttTicks(range, 'week', 7)[1].date.toString()).toBe('2024-03-03');
    expect(ganttTicks(range, 'month', 1).map(({ index, end }) => end - index)).toEqual([3, 31, 2]);
    expect(
      ganttPeriods(ganttRange('2025-12-28', '2026-02-01')!, 'month').map(({ date }) => date.year),
    ).toEqual([2025, 2026]);
  });
  it('clips partially visible tasks and omits tasks outside the chart range', () => {
    const range = ganttRange('2026-11-10', '2026-11-20')!;
    expect(ganttLayout(ganttRange('2026-11-08', '2026-11-12')!, range, 40)).toEqual({
      left: 0,
      width: 80,
    });
    expect(ganttLayout(ganttRange('2026-11-18', '2026-11-22')!, range, 40)).toEqual({
      left: 320,
      width: 80,
    });
    expect(ganttLayout(ganttRange('2026-11-01', '2026-11-05')!, range, 40).width).toBe(0);
    expect(ganttLayout(ganttRange('2026-11-22', '2026-11-25')!, range, 40).width).toBe(0);
  });
  it('moves through leap days and clamps either resize edge to a one-day interval', () => {
    const task = Object.freeze({ start: '2024-02-28', end: '2024-03-02' });
    expect(ganttEdit(task, 'move', 1)).toEqual({ start: '2024-02-29', end: '2024-03-03' });
    expect(ganttEdit(task, 'start', 99)).toEqual({ start: '2024-03-01', end: '2024-03-02' });
    expect(ganttEdit(task, 'end', -99)).toEqual({ start: '2024-02-28', end: '2024-02-29' });
    expect(task).toEqual({ start: '2024-02-28', end: '2024-03-02' });
    expect(ganttEdit(task, 'move', NaN)).toBeUndefined();
  });
  it('normalizes numeric data and supports deterministic SSR without invalid geometry', () => {
    expect([
      ganttProgress(NaN),
      ganttProgress(Infinity),
      ganttProgress(-1),
      ganttProgress(140),
    ]).toEqual([0, 0, 0, 100]);
    const markup = renderToString(
      <GanttChart
        tasks={[
          { id: 'one', label: 'Launch', start: '2026-11-20', end: '2026-11-21', progress: NaN },
        ]}
        today="2026-11-20"
        height={NaN}
        dayWidth={NaN}
        rowHeight={NaN}
      />,
    );
    expect(markup).toContain('Launch');
    expect(markup).toContain('End (exclusive)');
    expect(markup).not.toContain('NaN');
  });
});
