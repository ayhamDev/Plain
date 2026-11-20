import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TimePicker, DateTimePicker, TimeRangePicker } from '../src/ui/date-time';
import { PlainProvider } from '../src/ui/styling';
import { LanguageProvider } from '../src/ui/i18n';

async function openTime() {
  await userEvent.click(screen.getByRole('button', { name: 'Choose time' }));
}
function key(label: string, key: string) {
  fireEvent.keyDown(screen.getByRole('spinbutton', { name: label }), { key });
}

describe('adaptive time wheels', () => {
  it('keeps selects as the desktop auto mode and supports server rendering', async () => {
    render(<TimePicker defaultValue="09:12" />);
    await openTime();
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('09');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(renderToString(<TimePicker defaultValue="09:12" pickerMode="wheel" />)).toContain(
      'type="time"',
    );
  });

  it('updates the actual native input, event handlers, form value and ref from keyboard wheels', async () => {
    const ref = React.createRef<HTMLInputElement>();
    const change = vi.fn();
    const { container } = render(
      <form>
        <TimePicker
          ref={ref}
          name="start"
          aria-label="Start"
          defaultValue="09:12"
          pickerMode="wheel"
          onChange={change}
        />
      </form>,
    );
    await openTime();
    key('Hour', 'ArrowUp');
    key('Minute', 'ArrowUp');
    expect(ref.current).toHaveValue('10:13');
    expect(change).toHaveBeenCalledTimes(2);
    expect(new FormData(container.querySelector('form')!).get('start')).toBe('10:13');
    expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveAttribute('aria-valuenow', '10');
  });

  it('keeps controlled proposals pending and returns the wheel to committed values', async () => {
    const change = vi.fn();
    const { rerender } = render(
      <TimePicker aria-label="Time" value="09:12" pickerMode="wheel" onValueChange={change} />,
    );
    await openTime();
    key('Minute', 'ArrowUp');
    expect(change).toHaveBeenLastCalledWith('09:13');
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:12');
    expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveAttribute(
      'aria-valuenow',
      '12',
    );
    rerender(
      <TimePicker aria-label="Time" value="09:13" pickerMode="wheel" onValueChange={change} />,
    );
    expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveAttribute(
      'aria-valuenow',
      '13',
    );
    expect(change).toHaveBeenCalledOnce();
  });

  it('preserves fractional seconds and AM/PM while navigating non-uniform minute intervals', async () => {
    render(
      <TimePicker
        aria-label="Precise time"
        defaultValue="21:12:30.125"
        pickerMode="wheel"
        hourCycle="h12"
        minuteStep={7}
      />,
    );
    await openTime();
    key('Minute', 'ArrowUp');
    key('Second', 'End');
    key('Period', 'Home');
    expect(screen.getByLabelText('Precise time')).toHaveValue('09:14:59.125');
    key('Hour', 'Home');
    expect(screen.getByLabelText('Precise time')).toHaveValue('01:14:59.125');
    key('Period', 'End');
    expect(screen.getByLabelText('Precise time')).toHaveValue('13:14:59.125');
  });

  it('clamps wheel proposals to native bounds and retains the chosen date', async () => {
    render(
      <DateTimePicker
        aria-label="Appointment"
        defaultValue="2026-10-05T09:30"
        min="2026-10-05T08:00"
        max="2026-10-05T10:15"
        pickerMode="wheel"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    key('Hour', 'End');
    expect(screen.getByLabelText('Appointment')).toHaveValue('2026-10-05T10:15');
    key('Hour', 'Home');
    expect(screen.getByLabelText('Appointment')).toHaveValue('2026-10-05T08:00');
  });

  it('restores native form defaults and wheel values when a form is reset', async () => {
    const { container } = render(
      <form>
        <TimePicker aria-label="Time" defaultValue="09:12" pickerMode="wheel" />
      </form>,
    );
    await openTime();
    key('Hour', 'PageUp');
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('14:12');
    fireEvent.reset(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:12'),
    );
    await openTime();
    expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveAttribute('aria-valuenow', '9');
  });

  it('keeps native range ordering when either endpoint uses wheels', async () => {
    render(
      <TimeRangePicker
        aria-label="Office"
        defaultValue={{ from: '09:00', to: '10:00' }}
        pickerMode="wheel"
      />,
    );
    await userEvent.click(screen.getAllByRole('button', { name: 'Choose time' })[0]);
    key('Hour', 'End');
    expect(screen.getByLabelText('Office Start')).toHaveValue('10:00');
    expect(screen.getByLabelText('Office End')).toHaveValue('10:00');
  });

  it('localizes wheel values and exposes styling slots without default classes in unstyled mode', async () => {
    render(
      <PlainProvider persist={false} unstyled styles={{ 'temporal.wheel': 'consumer-wheel' }}>
        <LanguageProvider locale="ar">
          <TimePicker aria-label="الوقت" defaultValue="09:15" pickerMode="wheel" />
        </LanguageProvider>
      </PlainProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'اختيار الوقت' }));
    const hour = screen.getByRole('spinbutton', { name: 'الساعة' });
    expect(hour).toHaveClass('consumer-wheel');
    expect(hour).not.toHaveClass('ui-time-wheel');
    expect(hour).toHaveAttribute(
      'aria-valuetext',
      new Intl.NumberFormat('ar', { minimumIntegerDigits: 2 }).format(9),
    );
    fireEvent.keyDown(hour, { key: 'ArrowUp' });
    expect(screen.getByLabelText('الوقت', { selector: 'input' })).toHaveValue('10:15');
  });

  it('uses a modal bottom sheet on compact screens and restores focus after Done', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn((query) => ({
      ...original(query),
      matches: query === '(max-width: 767px)',
    }));
    try {
      const { rerender } = render(<TimePicker aria-label="Time" defaultValue="09:15" />);
      await openTime();
      const panel = screen.getByRole('dialog', { name: 'Choose time' });
      expect(panel).toHaveAttribute('data-side', 'bottom');
      await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveFocus());
      key('Minute', 'ArrowUp');
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByLabelText('Time')).toHaveFocus();
      expect(screen.getByLabelText('Time')).toHaveValue('09:16');
      rerender(<TimePicker aria-label="Time" defaultValue="09:15" pickerMode="select" />);
      await openTime();
      expect(screen.getByRole('combobox', { name: 'Hour' })).toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });
});
