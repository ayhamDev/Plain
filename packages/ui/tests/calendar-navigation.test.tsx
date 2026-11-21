import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar, DatePicker } from '../src/ui/calendar';
import { DateRangePicker, DateTimePicker } from '../src/ui/date-time';
import { LanguageProvider } from '../src/ui/i18n';
import { StyleProvider } from '../src/ui/styling';
import { Dropdown } from 'react-day-picker';

const today = new Date(2026, 10, 20);
async function options(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  return within(screen.getByRole('listbox'));
}
async function choose(label: string, option: string) {
  const list = await options(label);
  await userEvent.click(list.getByRole('option', { name: option }));
}

describe('calendar month and year navigation', () => {
  it('jumps directly to a distant month without selecting a date', async () => {
    const select = vi.fn();
    render(<Calendar mode="single" today={today} defaultMonth={today} onSelect={select} />);
    await choose('Choose year', '1985');
    await choose('Choose month', 'February');
    expect(screen.getByRole('grid', { name: 'February 1985' })).toBeInTheDocument();
    expect(select).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /February 15th, 1985/ }));
    expect(select.mock.calls[0][0]).toEqual(new Date(1985, 1, 15));
  });

  it('keeps controlled months controlled and forwards navigation callbacks', async () => {
    const change = vi.fn();
    const { rerender } = render(<Calendar today={today} month={today} onMonthChange={change} />);
    await choose('Choose year', '2035');
    expect(change).toHaveBeenLastCalledWith(new Date(2035, 10, 1));
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    rerender(<Calendar today={today} month={new Date(2035, 10, 1)} onMonthChange={change} />);
    expect(screen.getByRole('grid', { name: 'November 2035' })).toBeInTheDocument();
  });

  it('respects explicit bounds, descending years and disabled navigation', async () => {
    const props = {
      today,
      startMonth: new Date(1980, 0),
      endMonth: new Date(1981, 2),
      reverseYears: true,
    };
    const { rerender } = render(<Calendar {...props} defaultMonth={new Date(1980, 0)} />);
    const years = await options('Choose year');
    expect(years.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '1981',
      '1980',
    ]);
    await userEvent.click(years.getByRole('option', { name: '1980' }));
    expect(screen.getByRole('button', { name: 'Previous period' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await choose('Choose year', '1981');
    const months = await options('Choose month');
    expect(months.getByRole('option', { name: 'April' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(months.getByRole('option', { name: 'March' }));
    expect(screen.getByRole('button', { name: 'Next period' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    rerender(<Calendar {...props} disableNavigation />);
    expect(screen.getByRole('combobox', { name: 'Choose month' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Choose year' })).toBeDisabled();
  });

  it('includes future and outlying displayed years and supports a past-only bound', async () => {
    const { rerender } = render(<Calendar today={today} defaultMonth={today} />);
    let years = await options('Choose year');
    expect(years.getAllByRole('option')).toHaveLength(201);
    expect(years.getByRole('option', { name: '2126' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    rerender(<Calendar today={today} month={new Date(1800, 0)} />);
    expect(screen.getByRole('combobox', { name: 'Choose year' })).toHaveTextContent('1800');
    const historical = new Date(0);
    historical.setFullYear(5, 0, 1);
    rerender(<Calendar today={today} month={historical} endMonth={new Date(105, 11, 1)} />);
    expect(screen.getByRole('combobox', { name: 'Choose year' })).toHaveTextContent('5');
    rerender(<Calendar today={today} month={new Date(1770, 0)} endMonth={new Date(1780, 11)} />);
    years = await options('Choose year');
    expect(years.getAllByRole('option')).toHaveLength(101);
    expect(years.queryByRole('option', { name: '1781' })).not.toBeInTheDocument();
  });

  it.each([
    ['label', 0],
    ['dropdown-months', 1],
    ['dropdown-years', 1],
    ['dropdown', 2],
  ] as const)('supports the %s caption configuration', (captionLayout, count) => {
    render(<Calendar today={today} captionLayout={captionLayout} />);
    expect(screen.queryAllByRole('combobox')).toHaveLength(count);
  });

  it('preserves an explicit DayPicker dropdown component override', () => {
    render(<Calendar today={today} components={{ Dropdown }} />);
    expect(screen.getByRole('combobox', { name: 'Choose month' }).tagName).toBe('SELECT');
  });

  it('inherits Select styling slots and removes visual defaults in an unstyled calendar', () => {
    const { rerender } = render(
      <StyleProvider styles={{ 'select.trigger': 'consumer-select' }}>
        <Calendar today={today} />
      </StyleProvider>,
    );
    expect(screen.getByRole('combobox', { name: 'Choose month' })).toHaveClass('consumer-select');
    rerender(<Calendar today={today} unstyled />);
    expect(screen.getByRole('combobox', { name: 'Choose month' })).not.toHaveClass(
      'ui-interactive',
      'ui-calendar-select',
    );
  });

  it('localizes selectors and respects caller label/formatter overrides', async () => {
    render(
      <LanguageProvider
        locale="es"
        messages={{ 'picker.monthDropdown': 'Mes', 'picker.yearDropdown': 'Año' }}
      >
        <Calendar
          today={today}
          labels={{ labelYearDropdown: () => 'Year override' }}
          formatters={{ formatYearDropdown: (date) => `Year ${date.getFullYear()}` }}
        />
      </LanguageProvider>,
    );
    expect((await options('Mes')).getByRole('option', { name: 'enero' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(
      (await options('Year override')).getByRole('option', {
        name: 'Year 2026',
      }),
    ).toBeInTheDocument();
  });

  it('keeps DatePicker values unchanged during navigation, then submits the chosen local date', async () => {
    const change = vi.fn();
    const ref = React.createRef<HTMLButtonElement>();
    const { container } = render(
      <form>
        <DatePicker
          ref={ref}
          name="birthDate"
          aria-label="Birth date"
          defaultValue={today}
          onValueChange={change}
          calendarProps={{ today, startMonth: new Date(1900, 0), endMonth: today }}
        />
      </form>,
    );
    const trigger = screen.getByRole('button', { name: 'Birth date' });
    expect(ref.current).toBe(trigger);
    await userEvent.click(trigger);
    await choose('Choose year', '1985');
    await choose('Choose month', 'February');
    const form = container.querySelector('form')!;
    expect(new FormData(form).get('birthDate')).toBe('2026-11-20');
    expect(change).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /February 15th, 1985/ }));
    expect(new FormData(form).get('birthDate')).toBe('1985-02-15');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('uses date/time bounds for navigation and preserves the wall time on a date jump', async () => {
    render(
      <DateTimePicker
        aria-label="Appointment"
        defaultValue="2026-10-05T09:15"
        min="2026-10-01T00:00"
        max="2030-03-20T23:59"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const years = await options('Choose year');
    expect(years.getAllByRole('option')).toHaveLength(5);
    await userEvent.click(years.getByRole('option', { name: '2030' }));
    const months = await options('Choose month');
    expect(months.getByRole('option', { name: 'April' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(months.getByRole('option', { name: 'March' }));
    await userEvent.click(screen.getByRole('button', { name: /March 15, 2030/ }));
    expect(screen.getByLabelText('Appointment')).toHaveValue('2030-03-15T09:15');
  });

  it('uses range bounds by default and permits independent calendar navigation limits', async () => {
    const { unmount } = render(
      <DateRangePicker aria-label="Travel" min="2026-10-05" max="2027-03-20" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Travel' }));
    expect((await options('Choose year')).getAllByRole('option')).toHaveLength(2);
    unmount();
    render(
      <DateRangePicker
        aria-label="Travel"
        min="2026-10-05"
        max="2027-03-20"
        calendarProps={{ startMonth: new Date(2020, 0), endMonth: new Date(2030, 11) }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Travel' }));
    await choose('Choose year', '2020');
    expect(screen.getByRole('grid', { name: 'October 2020' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /October 5, 2020/ })).toBeDisabled();
  });
});
