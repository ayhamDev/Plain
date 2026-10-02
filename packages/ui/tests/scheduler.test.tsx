import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Temporal } from 'temporal-polyfill';
import { FullCalendar, type FullCalendarRef } from '../src/ui/full-calendar';
import {
  calendarDay,
  calendarRange,
  dayEvents,
  eventColumns,
  eventSpan,
  moveCalendarEvent,
  resizeCalendarEvent,
} from '../src/ui/calendar-model';

const events = [
  { id: 'launch', title: 'Launch', start: '2026-10-05', end: '2026-10-08' },
  { id: 'review', title: 'Review', start: '2026-10-05T09:00', end: '2026-10-05T10:00' },
];
describe('scheduler date model', () => {
  it('uses calendar arithmetic across leap days and exclusive all-day ends', () => {
    expect(calendarRange(Temporal.PlainDate.from('2028-02-29'), 'month')).toEqual({
      start: '2028-02-01',
      end: '2028-03-01',
    });
    const span = eventSpan(events[0])!;
    expect(dayEvents([span], Temporal.PlainDate.from('2026-10-07'))).toHaveLength(1);
    expect(dayEvents([span], Temporal.PlainDate.from('2026-10-08'))).toHaveLength(0);
    expect(calendarRange(Temporal.PlainDate.from('2026-10-05'), 'week', 1)).toEqual({
      start: '2026-10-05',
      end: '2026-10-12',
    });
  });
  it('distinguishes instants from wall dates in an IANA zone', () => {
    expect(calendarDay('2026-10-01T00:30Z', 'America/Los_Angeles').toString()).toBe('2026-09-30');
    expect(
      eventSpan({ id: 'x', title: 'X', start: '2026-10-01T00:30Z' }, 'Asia/Tokyo')!.start.hour,
    ).toBe(9);
    expect(
      eventSpan({ id: 'x', title: 'X', start: '2026-10-01T00:30' }, 'Asia/Tokyo')!.start.hour,
    ).toBe(0);
    expect(eventSpan({ id: 'x', title: 'X', start: 'invalid' })).toBeUndefined();
    expect(eventSpan({ ...events[1], end: events[1].start })).toBeUndefined();
  });
  it('preserves precision and calendar-day meaning during event moves', () => {
    const source = {
      id: 'x',
      title: 'X',
      start: '2026-03-07T09:00:30.125',
      end: '2026-03-07T10:00:30.125',
    };
    const next = moveCalendarEvent(
      eventSpan(source, 'America/New_York')!,
      { days: 1 },
      'America/New_York',
    );
    expect(next.start).toBe('2026-03-08T09:00:30.125');
    const instant = {
      ...source,
      start: new Date('2026-03-07T14:00:30.125Z'),
      end: new Date('2026-03-07T15:00:30.125Z'),
    };
    const moved = moveCalendarEvent(
      eventSpan(instant, 'America/New_York')!,
      { days: 1 },
      'America/New_York',
    );
    expect(moved.start).toEqual(new Date('2026-03-08T13:00:30.125Z'));
    expect(
      resizeCalendarEvent(
        eventSpan(instant, 'America/New_York')!,
        { minutes: 15 },
        'America/New_York',
      ).end,
    ).toEqual(new Date('2026-03-07T15:15:30.125Z'));
  });
  it('partitions concurrent events without retaining unused columns for later groups', () => {
    const spans = [
      events[1],
      { ...events[1], id: 'b', start: '2026-10-05T09:30', end: '2026-10-05T11:00' },
      { ...events[1], id: 'c', start: '2026-10-05T12:00', end: '2026-10-05T13:00' },
    ].map((event) => eventSpan(event)!);
    expect(eventColumns(spans).map((item) => [item.column, item.columns])).toEqual([
      [0, 2],
      [1, 2],
      [0, 1],
    ]);
  });
});
describe('P.UI scheduler contract', () => {
  it('reports a range only when it changes, even with inline data-loading callbacks', () => {
    const load = vi.fn();
    function Fixture() {
      const [loaded, setEvents] = React.useState<typeof events>([]);
      return (
        <FullCalendar
          defaultDate="2026-10-05"
          events={loaded}
          onRangeChange={() => {
            load();
            setEvents([]);
          }}
        />
      );
    }
    render(<Fixture />);
    expect(load).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next period' }));
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('keeps malformed numeric grid options finite and maintains one time-slot tab stop', () => {
    const { container, rerender } = render(
      <FullCalendar
        defaultDate="2026-10-05"
        defaultView="day"
        dayStart={NaN}
        dayEnd={Infinity}
        slotMinutes={NaN}
        selectable
      />,
    );
    expect(container.querySelectorAll('[data-calendar-slot]')).toHaveLength(28);
    rerender(
      <FullCalendar
        defaultDate="2026-10-05"
        defaultView="day"
        dayStart={7.5}
        dayEnd={9.4}
        slotMinutes={15.9}
        selectable
      />,
    );
    expect(container.querySelectorAll('[data-calendar-slot]')).toHaveLength(8);
    expect(container.querySelectorAll('[data-calendar-slot][tabindex="0"]')).toHaveLength(1);
  });
  it('supports SSR and navigation refs without engine plugins', () => {
    expect(renderToString(<FullCalendar defaultDate="2026-10-05" events={events} />)).toContain(
      'Review',
    );
    const ref = React.createRef<FullCalendarRef>();
    render(<FullCalendar ref={ref} defaultDate="2026-10-05" events={events} />);
    expect(ref.current!.getApi().getRange()).toEqual({ start: '2026-10-01', end: '2026-11-01' });
    act(() => ref.current!.getApi().next());
    expect(ref.current!.getApi().getDate()).toBe('2026-11-05');
    expect(screen.queryByRole('button', { name: /^Review,/ })).not.toBeInTheDocument();
    act(() => ref.current!.getApi().changeView('day'));
    expect(ref.current!.getApi().getView()).toBe('day');
  });
  it('keeps date and view externally controlled and reports ranges', async () => {
    const date = vi.fn(),
      view = vi.fn(),
      range = vi.fn();
    const { rerender } = render(
      <FullCalendar
        date="2026-10-05"
        view="month"
        onDateChange={date}
        onViewChange={view}
        onRangeChange={range}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next period' }));
    expect(date).toHaveBeenLastCalledWith('2026-11-05');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'October 2026');
    rerender(<FullCalendar date="2026-11-05" view="day" onRangeChange={range} />);
    expect(range).toHaveBeenLastCalledWith({ start: '2026-11-05', end: '2026-11-06', view: 'day' });
  });
  it('extends date selection, moves events with RTL keys and disables edits without callbacks', () => {
    const select = vi.fn(),
      edit = vi.fn();
    const { rerender } = render(
      <FullCalendar
        defaultDate="2026-10-05"
        events={events}
        selectable
        editable
        dir="rtl"
        onSlotSelect={select}
        onEventChange={edit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Monday, October 5, 2026/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Wednesday, October 7, 2026/ }), {
      shiftKey: true,
    });
    expect(select).toHaveBeenLastCalledWith({
      start: '2026-10-05',
      end: '2026-10-08',
      allDay: true,
      view: 'month',
    });
    const button = screen.getByRole('button', { name: /^Review,/ });
    fireEvent.keyDown(button, { key: 'ArrowLeft', altKey: true });
    expect(edit.mock.calls[0][0].event.start).toBe('2026-10-06T09:00:00');
    rerender(<FullCalendar defaultDate="2026-10-05" events={events} editable />);
    expect(screen.getByRole('button', { name: /^Review,/ })).toHaveAttribute('draggable', 'false');
  });
  it('uses roving time-slot focus rather than hundreds of tab stops', () => {
    const select = vi.fn();
    const { container } = render(
      <FullCalendar defaultDate="2026-10-05" defaultView="week" selectable onSlotSelect={select} />,
    );
    expect(container.querySelectorAll('[data-calendar-slot][tabindex="0"]')).toHaveLength(1);
    const start = container.querySelector<HTMLButtonElement>('[data-calendar-slot][tabindex="0"]')!;
    start.focus();
    fireEvent.keyDown(start, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveAttribute('data-calendar-slot', '2026-10-05T450');
    fireEvent.click(document.activeElement!);
    expect(select).toHaveBeenLastCalledWith({
      start: '2026-10-05T07:30:00',
      end: '2026-10-05T08:00:00',
      allDay: false,
      view: 'week',
    });
  });
  it('passes visible events and all events to custom printing without calling window.print', async () => {
    const print = vi.fn(),
      native = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <FullCalendar
        defaultDate="2026-10-05"
        events={[...events, { ...events[1], id: 'later', start: '2026-11-05T09:00' }]}
        onPrint={print}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Print calendar' }));
    expect(print.mock.calls[0][0].events).toHaveLength(2);
    expect(print.mock.calls[0][0].allEvents).toHaveLength(3);
    expect(native).not.toHaveBeenCalled();
    native.mockRestore();
  });
  it('prints the complete month without applying screen event limits', async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      title: `Print event ${i}`,
      start: '2026-10-05',
    }));
    let captured = '';
    const native = vi.spyOn(window, 'print').mockImplementation(() => {
      captured = document.querySelector('.ui-calendar-print')?.textContent ?? '';
    });
    render(
      <FullCalendar
        defaultDate="2026-10-05"
        events={many}
        maxEventsPerDay={1}
        printMode="calendar"
        printHeader={<p>Studio</p>}
        printFooter={<p>Approved schedule</p>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Print calendar' }));
    await waitFor(() => expect(captured).toContain('Approved schedule'));
    for (let i = 0; i < 8; i++) expect(captured).toContain(`Print event ${i}`);
    expect(captured).not.toContain('More +');
    native.mockRestore();
  });
  it('keeps disabled dates, events and navigation unavailable', () => {
    render(<FullCalendar disabled defaultDate="2026-10-05" events={events} />);
    for (const button of within(screen.getByRole('region', { name: 'Calendar' })).getAllByRole(
      'button',
    ))
      expect(button).toBeDisabled();
  });
});
