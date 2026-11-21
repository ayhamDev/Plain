import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimePicker, DateTimePicker, TimeRangePicker } from '../src/ui/date-time';

const minuteViewport = () =>
  screen
    .getByRole('spinbutton', { name: 'Minute' })
    .querySelector<HTMLElement>('[data-slot="wheel-viewport"]')!;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('time-picker interaction', () => {
  it(
    'opens from the whole field, respects cancellable native handlers and restores field focus',
    { timeout: 15000 },
    async () => {
      const clicked = vi.fn();
      const ref = React.createRef<HTMLInputElement>();
      const { rerender } = render(
        <TimePicker ref={ref} aria-label="Time" defaultValue="16:07" onClick={clicked} />,
      );
      await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
      expect(clicked).toHaveBeenCalledOnce();
      expect(screen.getByRole('dialog', { name: 'Choose time' })).toBeInTheDocument();
      expect(ref.current).toHaveAttribute('aria-haspopup', 'dialog');
      expect(ref.current).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await waitFor(() => expect(ref.current).toHaveFocus());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(<TimePicker aria-label="Time" onClick={(event) => event.preventDefault()} />);
      await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );

  it(
    'uses one-minute choices by default and retains explicit intervals',
    { timeout: 15000 },
    async () => {
      const { rerender } = render(<TimePicker aria-label="Time" defaultValue="09:12" />);
      await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
      await userEvent.click(screen.getByRole('combobox', { name: 'Minute' }));
      expect(screen.getAllByRole('option')).toHaveLength(60);
      await userEvent.click(screen.getByRole('option', { name: '13' }));
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:13');
      rerender(<TimePicker aria-label="Time" defaultValue="09:12" minuteStep={5} />);
      await userEvent.click(screen.getByRole('combobox', { name: 'Minute' }));
      expect(screen.getAllByRole('option').length).toBeLessThan(60);
    },
  );

  it('keeps display, hour choices and AM/PM in the same explicit format without changing ISO values', async () => {
    const { container, rerender } = render(
      <TimePicker aria-label="Time" name="time" defaultValue="16:07" hour12 />,
    );
    expect(container.querySelector('[data-slot="display"]')).toHaveTextContent(/0?4:07.*PM/);
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('16:07');
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('04');
    expect(screen.getByRole('combobox', { name: 'Period' })).toHaveTextContent('PM');
    rerender(<TimePicker aria-label="Time" name="time" defaultValue="16:07" hour12={false} />);
    expect(container.querySelector('[data-slot="display"]')).toHaveTextContent('16:07');
    expect(container.querySelector('[data-slot="display"]')).not.toHaveTextContent('PM');
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('16');
    expect(screen.queryByRole('combobox', { name: 'Period' })).not.toBeInTheDocument();
  });

  it(
    'supports click-to-open date/time and range fields while keeping required/min/max validation native',
    { timeout: 15000 },
    async () => {
      const { container } = render(
        <form>
          <DateTimePicker
            aria-label="Appointment"
            name="appointment"
            defaultValue="2026-11-20T16:07"
            hour12
          />
          <TimeRangePicker
            aria-label="Office"
            fromName="start"
            toName="end"
            defaultValue={{ from: '09:00', to: '17:00' }}
          />
          <TimePicker aria-label="Required" required />
          <TimePicker aria-label="Bounded" min="09:00" max="17:00" value="08:00" />
        </form>,
      );
      expect(screen.getByLabelText('Required', { selector: 'input' })).toBeInvalid();
      expect(screen.getByLabelText('Bounded', { selector: 'input' })).toBeInvalid();
      await userEvent.click(screen.getByLabelText('Appointment', { selector: 'input' }));
      expect(screen.getByRole('dialog', { name: 'Open calendar' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await userEvent.click(screen.getByLabelText('Office End', { selector: 'input' }));
      expect(screen.getByRole('dialog', { name: 'Choose time' })).toBeInTheDocument();
      const values = new FormData(container.querySelector('form')!);
      expect(values.get('appointment')).toBe('2026-11-20T16:07');
      expect(values.get('end')).toBe('17:00');
    },
  );

  it('opens by keyboard and leaves native editing available as an explicit opt-in', async () => {
    const { rerender } = render(<TimePicker aria-label="Time" defaultValue="09:00" />);
    screen.getByLabelText('Time', { selector: 'input' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    rerender(<TimePicker aria-label="Time" defaultValue="09:00" editable />);
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Time', { selector: 'input' })).not.toHaveAttribute(
      'aria-readonly',
      'true',
    );
    fireEvent.change(screen.getByLabelText('Time', { selector: 'input' }), {
      target: { value: '10:23' },
    });
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('10:23');
  });

  it('accumulates trackpad deltas, normalizes mouse/line wheels and commits once per completed gesture', async () => {
    const changed = vi.fn();
    render(
      <TimePicker
        aria-label="Time"
        defaultValue="09:00"
        pickerMode="wheel"
        onValueChange={changed}
      />,
    );
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    const viewport = minuteViewport();
    for (let i = 0; i < 12; i++) fireEvent.wheel(viewport, { deltaY: 4, deltaMode: 0 });
    expect(changed).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:01'),
    );
    expect(changed).toHaveBeenCalledOnce();
    fireEvent.wheel(viewport, { deltaY: 120, deltaMode: 0 });
    await waitFor(() =>
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:02'),
    );
    fireEvent.wheel(viewport, { deltaY: -3, deltaMode: 1 });
    await waitFor(() =>
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:01'),
    );
    expect(changed).toHaveBeenCalledTimes(3);
    fireEvent.wheel(viewport, { deltaY: 100, ctrlKey: true });
    fireEvent.wheel(viewport, { deltaX: 100, deltaY: 2 });
    await pause(220);
    expect(changed).toHaveBeenCalledTimes(3);
  });

  it('does not reset a held touch drag or activate its release click, then snaps once after touch ends', async () => {
    const changed = vi.fn();
    render(
      <TimePicker
        aria-label="Time"
        defaultValue="09:00"
        pickerMode="wheel"
        onValueChange={changed}
      />,
    );
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    const viewport = minuteViewport();
    fireEvent.touchStart(viewport, { touches: [{ clientY: 240 }] });
    viewport.scrollTop = 192;
    fireEvent.scroll(viewport);
    await pause(240);
    expect(viewport.scrollTop).toBe(192);
    expect(changed).not.toHaveBeenCalled();
    fireEvent.touchEnd(viewport, { touches: [] });
    fireEvent.click(viewport.children[0]);
    await waitFor(() =>
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:04'),
    );
    expect(changed).toHaveBeenCalledExactlyOnceWith('09:04');
    await pause(240);
    expect(viewport.scrollTop).toBe(192);
  });

  it('honors controlled acceptance/rejection and cancels an obsolete gesture on external value changes', async () => {
    const changed = vi.fn();
    const { rerender } = render(
      <TimePicker aria-label="Time" value="09:00" pickerMode="wheel" onValueChange={changed} />,
    );
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    let viewport = minuteViewport();
    fireEvent.wheel(viewport, { deltaY: 120 });
    await waitFor(() => expect(changed).toHaveBeenCalledWith('09:01'));
    await waitFor(() => expect(viewport.scrollTop).toBe(0));
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:00');
    rerender(
      <TimePicker aria-label="Time" value="09:01" pickerMode="wheel" onValueChange={changed} />,
    );
    viewport = minuteViewport();
    await waitFor(() => expect(viewport.scrollTop).toBe(48));
    fireEvent.wheel(viewport, { deltaY: 120 });
    rerender(
      <TimePicker aria-label="Time" value="09:04" pickerMode="wheel" onValueChange={changed} />,
    );
    await pause(240);
    expect(viewport.scrollTop).toBe(192);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('commits both pending columns exactly once when Done is pressed before the idle timer', async () => {
    const changed = vi.fn();
    render(
      <TimePicker
        aria-label="Time"
        defaultValue="09:10"
        pickerMode="wheel"
        onValueChange={changed}
      />,
    );
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    const hour = screen
      .getByRole('spinbutton', { name: 'Hour' })
      .querySelector<HTMLElement>('[data-slot="wheel-viewport"]')!;
    fireEvent.wheel(hour, { deltaY: 120 });
    fireEvent.wheel(minuteViewport(), { deltaY: 120 });
    // Keep the quick action in the same turn so load cannot expire the idle timer.
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('10:11');
    expect(changed).toHaveBeenCalledExactlyOnceWith('10:11');
    await pause(240);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('discards pending gestures when clearing or resetting without applying a delayed stale value', async () => {
    const changed = vi.fn();
    const { container } = render(
      <form>
        <TimePicker
          aria-label="Time"
          defaultValue="09:00"
          pickerMode="wheel"
          onValueChange={changed}
        />
      </form>,
    );
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    fireEvent.wheel(minuteViewport(), { deltaY: 120 });
    // Keep clear in the same turn so the assertion covers a still-pending gesture.
    fireEvent.click(screen.getByRole('button', { name: 'Clear value' }));
    expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('');
    await pause(240);
    expect(changed).toHaveBeenCalledExactlyOnceWith(undefined);
    await userEvent.click(screen.getByLabelText('Time', { selector: 'input' }));
    fireEvent.wheel(minuteViewport(), { deltaY: 120 });
    fireEvent.reset(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByLabelText('Time', { selector: 'input' })).toHaveValue('09:00'),
    );
    await pause(240);
    expect(changed).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('accepts the initial time with Done but leaves an untouched empty picker empty on Escape', async () => {
    render(<TimePicker aria-label="Time" required pickerMode="wheel" />);
    const input = screen.getByLabelText('Time', { selector: 'input' });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(input).toBeInvalid();
    await userEvent.click(input);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(input).toHaveValue('09:00');
    expect(input).toBeValid();
  });
});
