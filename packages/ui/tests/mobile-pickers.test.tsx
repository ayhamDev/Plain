import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from '../src/ui/calendar';
import { DateRangePicker, DateTimePicker } from '../src/ui/date-time';
import { LanguageProvider } from '../src/ui/i18n';

let originalMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === '(max-width: 767px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});
const calendarProps = { defaultMonth: new Date(2026, 9, 1) };
const day = (date: number) =>
  screen.getByRole('button', { name: new RegExp(`October ${date}(?:st|nd|rd|th)?, 2026`) });
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('mobile picker drafts', () => {
  it.each([false, true])(
    'keeps date/time steps transactional (controlled: %s)',
    async (controlled) => {
      const changed = vi.fn();
      const nativeChanged = vi.fn();
      const ref = React.createRef<HTMLInputElement>();
      function Example() {
        const [value, setValue] = React.useState('2026-10-05T09:15');
        return (
          <form aria-label="Booking">
            <DateTimePicker
              ref={ref}
              aria-label="Meeting"
              name="meeting"
              calendarProps={calendarProps}
              {...(controlled ? { value } : { defaultValue: value })}
              onChange={nativeChanged}
              onValueChange={(next) => {
                changed(next);
                if (controlled) setValue(next!);
              }}
            />
          </form>
        );
      }
      render(<Example />);
      await userEvent.click(screen.getByLabelText('Meeting'));
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      await userEvent.click(day(6));
      expect(ref.current).toHaveValue('2026-10-05T09:15');
      expect(changed).not.toHaveBeenCalled();
      await click('Next');
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      const minute = screen.getByRole('spinbutton', { name: 'Minute' });
      fireEvent.keyDown(minute, { key: 'ArrowDown' });
      await click('Back');
      await click('Next');
      expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveAttribute(
        'aria-valuetext',
        '14',
      );
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(ref.current).toHaveValue('2026-10-05T09:15');
      expect(changed).not.toHaveBeenCalled();
      await userEvent.click(ref.current!);
      await userEvent.click(day(6));
      await click('Next');
      fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Minute' }), { key: 'ArrowUp' });
      await click('Done');
      expect(ref.current).toHaveValue('2026-10-06T09:16');
      expect(changed).toHaveBeenCalledExactlyOnceWith('2026-10-06T09:16');
      expect(nativeChanged).toHaveBeenCalledOnce();
      expect(
        new FormData(screen.getByRole('form', { name: 'Booking' }) as HTMLFormElement).get(
          'meeting',
        ),
      ).toBe('2026-10-06T09:16');
      await waitFor(() => expect(ref.current).toHaveFocus());
    },
  );

  it('confirms or cancels date-only edits and discards a draft on form reset', async () => {
    const changed = vi.fn();
    render(
      <form aria-label="Date form">
        <DatePicker
          name="date"
          aria-label="Date"
          defaultValue={new Date(2026, 9, 5)}
          calendarProps={calendarProps}
          onValueChange={changed}
        />
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Date form' }) as HTMLFormElement;
    await click('Date');
    await userEvent.click(day(6));
    expect(new FormData(form).get('date')).toBe('2026-10-05');
    await click('Cancel');
    expect(changed).not.toHaveBeenCalled();
    await click('Date');
    await userEvent.click(day(6));
    await click('Done');
    expect(new FormData(form).get('date')).toBe('2026-10-06');
    expect(changed).toHaveBeenCalledOnce();
    await click('Date');
    await userEvent.click(day(7));
    fireEvent.reset(form);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(new FormData(form).get('date')).toBe('2026-10-05');
  });

  it('keeps both range endpoints pending until explicit confirmation', async () => {
    const changed = vi.fn();
    render(
      <form aria-label="Range form">
        <DateRangePicker
          name="dates"
          aria-label="Dates"
          calendarProps={calendarProps}
          defaultValue={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 12) }}
          onValueChange={changed}
        />
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Range form' }) as HTMLFormElement;
    await click('Dates');
    await userEvent.click(day(6));
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
    expect(new FormData(form).get('dates[from]')).toBe('2026-10-05');
    await userEvent.click(day(8));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
    await click('Done');
    expect(changed).toHaveBeenCalledOnce();
    expect(new FormData(form).get('dates[from]')).toBe('2026-10-06');
    expect(new FormData(form).get('dates[to]')).toBe('2026-10-08');
  });

  it('retains disabled dates and clamps a staged time to native bounds', async () => {
    render(
      <DateTimePicker
        aria-label="Meeting"
        defaultValue="2026-10-05T13:20"
        min="2026-10-05T13:00"
        max="2026-10-07T14:00"
        disabledDates={new Date(2026, 9, 6)}
        calendarProps={calendarProps}
      />,
    );
    await userEvent.click(screen.getByLabelText('Meeting'));
    expect(day(6)).toBeDisabled();
    await userEvent.click(day(7));
    await click('Next');
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Hour' }), { key: 'ArrowUp' });
    await click('Done');
    expect(screen.getByLabelText('Meeting')).toHaveValue('2026-10-07T14:00');
  });

  it('honors a cancelled native change on final confirmation', async () => {
    const changed = vi.fn();
    render(
      <DateTimePicker
        aria-label="Meeting"
        defaultValue="2026-10-05T09:15"
        calendarProps={calendarProps}
        onChange={(event) => event.preventDefault()}
        onValueChange={changed}
      />,
    );
    await userEvent.click(screen.getByLabelText('Meeting'));
    await userEvent.click(day(6));
    await click('Next');
    await click('Done');
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Meeting')).toHaveValue('2026-10-05T09:15');
  });

  it('requires an available date before confirming or advancing a supplied selection', async () => {
    const blocked = new Date(2026, 9, 6);
    const { unmount } = render(
      <DatePicker
        aria-label="Date"
        defaultValue={blocked}
        calendarProps={{ ...calendarProps, disabled: blocked }}
      />,
    );
    await click('Date');
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
    await userEvent.click(day(7));
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();
    unmount();
    render(
      <DateTimePicker
        aria-label="Meeting"
        defaultValue="2026-10-06T09:15"
        disabledDates={blocked}
        calendarProps={calendarProps}
      />,
    );
    await userEvent.click(screen.getByLabelText('Meeting'));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await userEvent.click(day(7));
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('localizes the step labels, counts and navigation through the language provider', async () => {
    render(
      <LanguageProvider locale="ar" messages={{ 'common.next': 'متابعة', 'common.back': 'السابق' }}>
        <DateTimePicker aria-label="Meeting" defaultValue="2026-10-05T09:15" />
      </LanguageProvider>,
    );
    await userEvent.click(screen.getByLabelText('Meeting'));
    const number = new Intl.NumberFormat('ar');
    expect(
      screen.getByRole('list', { name: `الخطوة ${number.format(1)} من ${number.format(2)}` }),
    ).toBeInTheDocument();
    await click('متابعة');
    expect(
      screen.getByRole('list', { name: `الخطوة ${number.format(2)} من ${number.format(2)}` }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'السابق' }),
    ).toBeInTheDocument();
  });
});
