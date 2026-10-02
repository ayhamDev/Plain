import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Field } from '../src/ui/forms';
import { DirectionProvider, StyleProvider } from '../src/ui/styling';
import { MotionPolicyProvider } from '../src/ui/motion-policy';
import {
  TimePicker,
  TimeRangePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
} from '../src/ui/date-time';
import { FullCalendar, type FullCalendarRef } from '../src/ui/full-calendar';
import {
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  Chart,
  ChartGrid,
  ChartLine,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
} from '../src/ui/charts';
import { LineChart as RechartsLineChart } from 'recharts';

describe('native temporal controls', () => {
  it('keeps TimePicker controlled when an explicit undefined clears its value', () => {
    const change = vi.fn();
    const { rerender } = render(
      <TimePicker aria-label="Time" value="09:15" defaultValue="08:00" onValueChange={change} />,
    );
    const input = screen.getByLabelText('Time');
    fireEvent.change(input, { target: { value: '10:30' } });
    expect(change).toHaveBeenLastCalledWith('10:30');
    expect(input).toHaveValue('09:15');
    rerender(
      <TimePicker
        aria-label="Time"
        value={undefined}
        defaultValue="08:00"
        onValueChange={change}
      />,
    );
    expect(input).toHaveValue('');
  });

  it('submits native values, restores uncontrolled defaults on reset, and clears by keyboard', async () => {
    const { container } = render(
      <form>
        <TimePicker name="time" aria-label="Time" defaultValue="09:15" />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByLabelText('Time');
    const form = container.querySelector('form')!;
    fireEvent.change(input, { target: { value: '11:45' } });
    expect(new FormData(form).get('time')).toBe('11:45');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(input).toHaveValue('09:15'));
    input.focus();
    await userEvent.keyboard('{Control>}{Backspace}{/Control}');
    expect(input).toHaveValue('');
    expect(new FormData(form).get('time')).toBe('');
  });

  it('forwards Field labels, errors, native validation, refs, and direction', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <DirectionProvider dir="rtl">
        <Field label="Start time" description="Local" error="Unavailable" required>
          <TimePicker ref={ref} id="start" min="09:00" max="17:00" value="08:30" />
        </Field>
      </DirectionProvider>,
    );
    const input = screen.getByLabelText(/^Start time/);
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('dir', 'rtl');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('start-description start-error'),
    );
    expect(input).toBeRequired();
    expect(input).toBeInvalid();
  });

  it('blocks disabled and read-only changes and leaves disabled values out of forms', async () => {
    const change = vi.fn();
    const { container } = render(
      <form>
        <TimePicker
          name="disabled"
          aria-label="Disabled"
          value="09:00"
          disabled
          onValueChange={change}
        />
        <TimePicker aria-label="Read only" value="10:00" readOnly onValueChange={change} />
      </form>,
    );
    fireEvent.change(screen.getByLabelText('Disabled'), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText('Read only'), { target: { value: '12:00' } });
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear value' })[1]);
    expect(change).not.toHaveBeenCalled();
    expect(new FormData(container.querySelector('form')!).has('disabled')).toBe(false);
  });

  it('submits partial time ranges and applies ordering constraints to both endpoints', () => {
    const change = vi.fn();
    const { container } = render(
      <form>
        <Field label="Hours">
          <TimeRangePicker
            name="hours"
            id="hours"
            defaultValue={{ from: '09:00' }}
            onValueChange={change}
          />
        </Field>
      </form>,
    );
    const from = screen.getByLabelText('Hours Start');
    const to = screen.getByLabelText('Hours End');
    expect(new FormData(container.querySelector('form')!).get('hours[from]')).toBe('09:00');
    expect(new FormData(container.querySelector('form')!).get('hours[to]')).toBe('');
    fireEvent.change(to, { target: { value: '08:00' } });
    expect(change).toHaveBeenLastCalledWith({ from: '09:00', to: '08:00' });
    expect(from).toHaveAttribute('max', '08:00');
    expect(to).toHaveAttribute('min', '09:00');
    expect(to).toBeInvalid();
  });

  it('supports overnight time ranges and propagates explicit undefined clearing', () => {
    const { rerender } = render(
      <TimeRangePicker value={{ from: '22:00', to: '02:00' }} allowOvernight />,
    );
    expect(screen.getByLabelText('End')).toBeValid();
    rerender(<TimeRangePicker value={undefined} defaultValue={{ from: '10:00' }} allowOvernight />);
    expect(screen.getByLabelText('Start')).toHaveValue('');
    expect(screen.getByLabelText('End')).toHaveValue('');
  });

  it('keeps seconds and fractional seconds valid in native time fields', () => {
    render(
      <>
        <TimePicker aria-label="Precise time" value="09:15:30.125" />
        <DateTimePicker aria-label="Precise date" value="2026-10-01T09:15:30.125" />
      </>,
    );
    expect(screen.getByLabelText('Precise time')).toBeValid();
    expect(screen.getByLabelText('Precise date')).toBeValid();
  });

  it('preserves local date/time strings and validates a selected zone without UTC conversion', () => {
    const { container, rerender } = render(
      <form>
        <DateTimePicker
          aria-label="Appointment"
          name="appointment"
          value="2026-10-01T09:15"
          timeZone="Asia/Tokyo"
          locale="ja-JP"
        />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('appointment')).toBe(
      '2026-10-01T09:15',
    );
    expect(screen.getByLabelText('Appointment')).toBeValid();
    rerender(
      <DateTimePicker
        aria-label="Appointment"
        value="2026-03-08T02:30"
        timeZone="America/New_York"
        disambiguation="reject"
      />,
    );
    expect(screen.getByLabelText('Appointment')).toBeInvalid();
    rerender(
      <DateTimePicker aria-label="Appointment" value={undefined} defaultValue="2026-10-01T12:00" />,
    );
    expect(screen.getByLabelText('Appointment')).toHaveValue('');
  });

  it('disables unavailable calendar dates and preserves time when a date is chosen', async () => {
    render(
      <DateTimePicker
        aria-label="Appointment"
        defaultValue="2026-10-01T09:15"
        min="2026-10-01T10:00"
        max="2026-10-20T18:00"
        disabledDates={new Date(2026, 9, 5)}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('button', { name: /Monday, October 5, 2026/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Tuesday, October 6, 2026/ }));
    expect(screen.getByLabelText('Appointment')).toHaveValue('2026-10-06T09:15');
  });

  it('honors an explicitly displayed calendar month for date/time and range pickers', async () => {
    const calendarProps = { defaultMonth: new Date(2026, 10, 1) };
    const { unmount } = render(
      <DateTimePicker defaultValue="2026-10-05T09:00" calendarProps={calendarProps} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    unmount();
    render(
      <DateRangePicker
        aria-label="Travel"
        min="2026-10-01"
        defaultValue={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 12) }}
        calendarProps={calendarProps}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Travel' }));
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
  });

  it('gives date/time ranges native endpoint form names and Field error associations', () => {
    const { container } = render(
      <form>
        <Field label="Booking" error="Unavailable">
          <DateTimeRangePicker
            name="booking"
            id="booking"
            defaultValue={{ from: '2026-10-01T09:00', to: '2026-10-02T10:00' }}
            showCalendar={false}
          />
        </Field>
      </form>,
    );
    expect(screen.getByLabelText('Booking Start')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Booking End')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('booking-error'),
    );
    const data = new FormData(container.querySelector('form')!);
    expect(data.get('booking[from]')).toBe('2026-10-01T09:00');
    expect(data.get('booking[to]')).toBe('2026-10-02T10:00');
  });

  it('delegates a two-click inclusive range to DayPicker and submits local ISO dates', async () => {
    const change = vi.fn();
    const { container } = render(
      <form>
        <Field label="Travel">
          <DateRangePicker
            name="travel"
            calendarProps={{ defaultMonth: new Date(2026, 9, 1) }}
            onValueChange={change}
          />
        </Field>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Travel' }));
    await userEvent.click(screen.getByRole('button', { name: /Monday, October 5, 2026/ }));
    expect(screen.getByRole('button', { name: /Thursday, October 8, 2026/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Thursday, October 8, 2026/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Travel' })).toHaveFocus());
    expect(change).toHaveBeenLastCalledWith({ from: expect.any(Date), to: expect.any(Date) });
    const data = new FormData(container.querySelector('form')!);
    expect(data.get('travel[from]')).toBe('2026-10-05');
    expect(data.get('travel[to]')).toBe('2026-10-08');
    await userEvent.click(screen.getByRole('button', { name: 'Clear date range' }));
    expect(new FormData(container.querySelector('form')!).get('travel[from]')).toBe('');
  });

  it('keeps required date ranges in native form validation and prevents disabled-day crossings', async () => {
    const { container } = render(
      <form>
        <Field label="Travel" required>
          <DateRangePicker
            name="travel"
            minNights={1}
            disabledDates={new Date(2026, 9, 6)}
            calendarProps={{ defaultMonth: new Date(2026, 9, 1) }}
          />
        </Field>
      </form>,
    );
    const form = container.querySelector('form')!;
    act(() => expect(form.checkValidity()).toBe(false));
    await userEvent.click(await screen.findByRole('button', { name: /Monday, October 5, 2026/ }));
    await userEvent.click(screen.getByRole('button', { name: /Thursday, October 8, 2026/ }));
    expect(new FormData(form).get('travel[to]')).toBe('');
    act(() => expect(form.checkValidity()).toBe(false));
  });

  it('validates supplied ranges against disabled days and clears custom validity with undefined', () => {
    const unavailable = new Date(2026, 9, 6);
    const { container, rerender } = render(
      <form>
        <DateRangePicker
          aria-label="Travel"
          value={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 8) }}
          disabledDates={unavailable}
        />
      </form>,
    );
    expect(screen.getByRole('button', { name: 'Travel' })).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector<HTMLInputElement>('input')!.validity.customError).toBe(true);
    rerender(
      <form>
        <DateRangePicker aria-label="Travel" value={undefined} disabledDates={unavailable} />
      </form>,
    );
    expect(container.querySelector<HTMLInputElement>('input')!.validity.customError).toBe(false);
    expect(container.querySelector('form')!.checkValidity()).toBe(true);
  });

  it('restores date range defaults on a native form reset after clearing', async () => {
    const { container } = render(
      <form>
        <DateRangePicker
          name="travel"
          defaultValue={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 8) }}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear date range' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() =>
      expect(new FormData(container.querySelector('form')!).get('travel[from]')).toBe('2026-10-05'),
    );
  });

  it('clears a controlled date range with undefined and respects an unstyled provider', () => {
    const { rerender, container } = render(
      <StyleProvider unstyled>
        <DateRangePicker
          aria-label="Travel"
          defaultValue={{ from: new Date(2026, 9, 1), to: new Date(2026, 9, 4) }}
          value={undefined}
        />
      </StyleProvider>,
    );
    expect(screen.getByRole('button', { name: 'Travel' })).toHaveTextContent('Pick a date range');
    expect(container.querySelector('[data-ui="date-range-picker"]')).toHaveAttribute('class', '');
    rerender(
      <StyleProvider unstyled>
        <DateRangePicker aria-label="Travel" value={{ from: new Date(2026, 9, 1) }} />
      </StyleProvider>,
    );
    expect(screen.getByRole('button', { name: 'Travel' })).toHaveTextContent('Oct 1, 2026');
  });
});

describe('FullCalendar v7 integration', () => {
  it('renders actual events and exposes the full engine ref, callbacks, and content hooks', async () => {
    const ref = React.createRef<FullCalendarRef>();
    const click = vi.fn();
    const select = vi.fn();
    const dates = vi.fn();
    render(
      <FullCalendar
        ref={ref}
        initialDate="2026-10-01"
        initialView="dayGridMonth"
        selectable
        events={[
          {
            id: 'planning',
            title: 'Planning',
            start: '2026-10-05T09:00',
            end: '2026-10-05T10:00',
            extendedProps: { team: 'Design' },
          },
        ]}
        eventClick={click}
        select={select}
        datesSet={dates}
        eventContent={(info) => (
          <span>
            {info.event.title}: {String(info.event.extendedProps.team)}
          </span>
        )}
      />,
    );
    await screen.findByText('Planning: Design');
    expect(screen.getByRole('tab', { name: 'Week view' })).toBeInTheDocument();
    expect(ref.current?.getApi().view.type).toBe('dayGridMonth');
    expect(ref.current?.getApi().getEventById('planning')?.extendedProps.team).toBe('Design');
    await userEvent.click(screen.getByText('Planning: Design'));
    expect(click).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ id: 'planning' }) }),
    );
    act(() =>
      ref.current!.getApi().select({ start: '2026-10-06', end: '2026-10-08', allDay: true }),
    );
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ startStr: '2026-10-06', endStr: '2026-10-08' }),
    );
    expect(dates).toHaveBeenCalled();
    act(() => ref.current!.getApi().changeView('timeGridDay', '2026-10-05'));
    await waitFor(() => expect(ref.current!.getApi().view.type).toBe('timeGridDay'));
  });

  it('accepts engine options with direct overrides, locale, RTL, and controlled navigation', async () => {
    const ref = React.createRef<FullCalendarRef>();
    const optionsDates = vi.fn();
    const directDates = vi.fn();
    const { rerender } = render(
      <FullCalendar
        ref={ref}
        date="2026-10-05"
        view="listWeek"
        dir="rtl"
        locale="ar"
        options={{ weekends: false, datesSet: optionsDates }}
        datesSet={directDates}
        aria-label="Schedule"
      />,
    );
    expect(screen.getByRole('region', { name: 'Schedule' })).toHaveAttribute('dir', 'rtl');
    expect(ref.current!.getApi().getOption('weekends')).toBe(false);
    expect(ref.current!.getApi().getOption('locale')).toBe('ar');
    expect(directDates).toHaveBeenCalled();
    expect(optionsDates).not.toHaveBeenCalled();
    rerender(<FullCalendar ref={ref} date="2026-11-12" view="timeGridWeek" />);
    await waitFor(() => expect(ref.current!.getApi().view.type).toBe('timeGridWeek'));
    expect(ref.current!.getApi().formatIso(ref.current!.getApi().getDate(), true)).toBe(
      '2026-11-12',
    );
  });

  it('restores the chosen desktop view across mobile resize transitions', async () => {
    let narrow = false;
    const listeners = new Set<() => void>();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      get matches() {
        return query.includes('max-width') && narrow;
      },
      media: query,
      onchange: null,
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
        listeners.add(listener as () => void);
      },
      removeEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
        listeners.delete(listener as () => void);
      },
    }));
    const ref = React.createRef<FullCalendarRef>();
    render(<FullCalendar ref={ref} initialDate="2026-10-05" defaultView="timeGridWeek" />);
    act(() => {
      narrow = true;
      listeners.forEach((listener) => listener());
    });
    await waitFor(() => expect(ref.current!.getApi().view.type).toBe('listWeek'));
    act(() => {
      narrow = false;
      listeners.forEach((listener) => listener());
    });
    await waitFor(() => expect(ref.current!.getApi().view.type).toBe('timeGridWeek'));
  });

  it('uses a real list view on mobile and blocks disabled event interactions', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));
    const click = vi.fn();
    const ref = React.createRef<FullCalendarRef>();
    const { container } = render(
      <FullCalendar
        ref={ref}
        disabled
        initialDate="2026-10-05"
        events={[{ title: 'Review', start: '2026-10-05' }]}
        eventClick={click}
      />,
    );
    expect(ref.current!.getApi().view.type).toBe('listWeek');
    expect(container.querySelector('[data-ui="full-calendar"]')).toHaveAttribute('data-mobile');
    fireEvent.click(await screen.findByText('Review'));
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole('region')).toHaveAttribute('inert');
  });
});

const chartData = [
  { name: 'Jan', revenue: 1200, cost: 500 },
  { name: 'Feb', revenue: 1600, cost: 700 },
];

describe('Recharts wrappers', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const height = this.classList.contains('recharts-legend-wrapper')
        ? 24
        : this.tagName === 'SPAN'
          ? 14
          : 300;
      const width = this.tagName === 'SPAN' ? (this.textContent?.length ?? 0) * 7 : 640;
      return {
        width,
        height,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: height,
        right: width,
        toJSON: () => ({}),
      };
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([AreaChart, BarChart, LineChart])(
    'renders real series, native keyboard accessibility, a legend, and a screen-reader data table',
    async (Component) => {
      const { container } = render(
        <Component
          label="Revenue"
          data={chartData}
          series={[
            { dataKey: 'revenue', label: 'Revenue' },
            { dataKey: 'cost', label: 'Cost' },
          ]}
          animate={false}
        />,
      );
      const chart = await screen.findByRole('application');
      expect(chart).toHaveAttribute('tabindex', '0');
      await waitFor(() =>
        expect(
          container.querySelectorAll('.recharts-area, .recharts-bar, .recharts-line').length,
        ).toBeGreaterThanOrEqual(2),
      );
      expect(container.querySelector('.recharts-default-legend')).toHaveTextContent('Revenue');
      expect(container.querySelector('.recharts-default-legend')).toHaveTextContent('Cost');
      const table = screen.getByRole('table', { name: 'Revenue data' });
      expect(within(table).getByRole('columnheader', { name: 'Revenue' })).toBeInTheDocument();
      expect(within(table).getByRole('cell', { name: '1,200' })).toBeInTheDocument();
    },
  );

  it('uses the actual tooltip when the chart is navigated with arrow keys', async () => {
    const { container } = render(
      <LineChart
        label="Revenue"
        data={chartData}
        series={[{ dataKey: 'revenue', label: 'Revenue' }]}
        animate={false}
      />,
    );
    const chart = await screen.findByRole('application');
    act(() => chart.focus());
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    await waitFor(() =>
      expect(container.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Revenue'),
    );
    expect(container.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent(/1,[26]00/);
  });

  it('accepts the engine vertical layout and explicit palette overrides', async () => {
    const { container } = render(
      <BarChart
        label="Revenue"
        data={chartData}
        series={[{ dataKey: 'revenue', color: '#3579c7' }]}
        chartProps={{ layout: 'vertical' }}
        animate={false}
      />,
    );
    await waitFor(() =>
      expect(container.querySelectorAll('.recharts-bar-rectangle').length).toBe(2),
    );
    expect(container.querySelector('.recharts-bar-rectangle path')).toHaveAttribute(
      'fill',
      '#3579c7',
    );
  });

  it('supports composition with native Recharts components and themed helper series', async () => {
    const { container } = render(
      <Chart
        label="Composition"
        data={chartData}
        config={{ revenue: { label: 'Revenue', color: 'var(--ui-chart-3)' } }}
        animate={false}
      >
        <RechartsLineChart data={chartData}>
          <ChartGrid />
          <ChartXAxis dataKey="name" />
          <ChartYAxis />
          <ChartLine dataKey="revenue" />
          <ChartTooltip />
        </RechartsLineChart>
      </Chart>,
    );
    await screen.findByRole('application');
    expect(container.querySelector('.recharts-line-curve')).toHaveAttribute(
      'stroke',
      'var(--ui-chart-3)',
    );
  });

  it('provides a stable height and graceful empty/loading states without an empty SVG', () => {
    const { container, rerender } = render(
      <BarChart label="Sales" data={[]} height={240} emptyLabel="No sales" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No sales');
    expect(container.querySelector('[data-slot="viewport"]')).toHaveStyle({ height: '240px' });
    expect(container.querySelector('svg')).toBeNull();
    rerender(
      <BarChart label="Sales" data={chartData} height={240} loading loadingLabel="Loading sales" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading sales');
    expect(screen.getByLabelText('Sales')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('[data-slot="viewport"]')).toHaveStyle({ height: '240px' });
  });

  it('renders actual donut sectors with palette tokens and treats zero totals as empty', async () => {
    const { container, rerender } = render(
      <DonutChart
        label="Traffic"
        animate={false}
        data={[
          { name: 'Direct', value: 60 },
          { name: 'Search', value: 40 },
        ]}
      />,
    );
    await screen.findByRole('application');
    expect(container.querySelectorAll('.recharts-pie-sector').length).toBe(2);
    expect(container.querySelector('.recharts-pie-sector path')).toHaveAttribute(
      'fill',
      expect.stringContaining('--ui-chart-1'),
    );
    expect(screen.getByRole('table', { name: 'Traffic data' })).toBeInTheDocument();
    rerender(<DonutChart label="Traffic" data={[{ name: 'Direct', value: 0 }]} />);
    expect(screen.getByRole('status')).toHaveTextContent('No data');
  });

  it('honors provider motion policy, RTL, an explicit description, and visible tables', async () => {
    render(
      <DirectionProvider dir="rtl">
        <MotionPolicyProvider policy="none">
          <LineChart
            label="Revenue"
            data={chartData}
            description="Revenue increased in February."
            dataTable="visible"
          />
        </MotionPolicyProvider>
      </DirectionProvider>,
    );
    const figure = screen.getByLabelText('Revenue');
    expect(figure).toHaveAttribute('data-motion', 'disabled');
    expect(figure).toHaveAttribute('dir', 'rtl');
    expect(figure).toHaveAccessibleDescription(
      expect.stringContaining('Revenue increased in February.'),
    );
    expect(screen.getByRole('table', { name: 'Revenue data' }).parentElement).not.toHaveStyle({
      clipPath: 'inset(50%)',
    });
    await screen.findByRole('application');
  });

  it('does not require browser globals to server-render temporal or chart controls', () => {
    expect(() =>
      renderToString(
        <>
          <TimePicker value="09:00" />
          <DateTimePicker value="2026-10-01T09:00" />
          <LineChart label="Revenue" data={chartData} />
        </>,
      ),
    ).not.toThrow();
  });
});
