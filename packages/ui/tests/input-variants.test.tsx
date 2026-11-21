import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  type InputVariant,
} from '../src/ui/forms';
import {
  NumberInput,
  SearchInput,
  PasswordInput,
  PinInput,
  TagsInput,
  MultiSelect,
  FileUpload,
  Dropzone,
} from '../src/ui/advanced';
import { ColorPicker } from '../src/ui/color-picker';
import { Combobox, Command, CommandInput } from '../src/ui/command';
import { DatePicker } from '../src/ui/calendar';
import {
  TimePicker,
  DateTimePicker,
  TimeRangePicker,
  DateTimeRangePicker,
  DateRangePicker,
} from '../src/ui/date-time';
import { StyleProvider } from '../src/ui/styling';

const variants: InputVariant[] = ['outlined', 'filled', 'ghost', 'contrast'];
const options = [
  { value: 'design', label: 'Design' },
  { value: 'build', label: 'Build' },
];
const from = new Date(2026, 10, 1),
  to = new Date(2026, 10, 5);

function Fields({ variant }: { variant: InputVariant }) {
  return (
    <form aria-label="Inputs">
      <Input variant={variant} name="title" defaultValue="Project" aria-label="Title" />
      <Textarea variant={variant} name="notes" defaultValue="Notes" aria-label="Notes" />
      <NumberInput variant={variant} name="seats" defaultValue={3} aria-label="Seats" />
      <SearchInput variant={variant} name="query" defaultValue="Atlas" aria-label="Search" />
      <PasswordInput
        variant={variant}
        name="password"
        defaultValue="secret"
        aria-label="Password"
      />
      <PinInput variant={variant} name="code" defaultValue="123456" aria-label="Code" />
      <TagsInput variant={variant} name="tag" defaultValue={['one', 'two']} aria-label="Tags" />
      <MultiSelect
        variant={variant}
        name="teams"
        options={options}
        defaultValue={['design']}
        aria-label="Teams"
      />
      <ColorPicker variant={variant} name="color" defaultValue="#252826" aria-label="Color" />
      <Select name="priority" defaultValue="normal">
        <SelectTrigger variant={variant} aria-label="Priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">Normal</SelectItem>
        </SelectContent>
      </Select>
      <Combobox
        variant={variant}
        name="owner"
        options={options}
        defaultValue="build"
        aria-label="Owner"
      />
      <FileUpload variant={variant} name="file" aria-label="File" />
      <Dropzone variant={variant} name="drop" aria-label="Drop files" />
      <DatePicker variant={variant} name="date" defaultValue={from} aria-label="Date" />
      <TimePicker variant={variant} name="time" defaultValue="09:15" aria-label="Time" />
      <DateTimePicker
        variant={variant}
        name="meeting"
        defaultValue="2026-11-01T09:15"
        aria-label="Meeting"
      />
      <TimeRangePicker
        variant={variant}
        name="hours"
        defaultValue={{ from: '09:00', to: '17:00' }}
        aria-label="Hours"
      />
      <DateTimeRangePicker
        variant={variant}
        name="event"
        defaultValue={{ from: '2026-11-01T09:00', to: '2026-11-05T17:00' }}
        aria-label="Event"
      />
      <DateRangePicker
        variant={variant}
        name="travel"
        defaultValue={{ from, to }}
        aria-label="Travel"
      />
      <Command>
        <CommandInput variant={variant} aria-label="Commands" />
      </Command>
      <button type="reset">Reset</button>
    </form>
  );
}

describe('shared input appearances', () => {
  it.each(variants)('preserves native values and targets visible boundaries with %s', (variant) => {
    const { container } = render(<Fields variant={variant} />);
    const form = screen.getByRole('form') as HTMLFormElement;
    const values = new FormData(form);
    expect(Object.fromEntries(values.entries())).toMatchObject({
      title: 'Project',
      notes: 'Notes',
      seats: '3',
      query: 'Atlas',
      password: 'secret',
      code: '123456',
      teams: 'design',
      color: '#252826',
      priority: 'normal',
      owner: 'build',
      date: '2026-11-01',
      time: '09:15',
      meeting: '2026-11-01T09:15',
      'hours[from]': '09:00',
      'hours[to]': '17:00',
      'event[from]': '2026-11-01T09:00',
      'event[to]': '2026-11-05T17:00',
      'travel[from]': '2026-11-01',
      'travel[to]': '2026-11-05',
    });
    expect(values.getAll('tag')).toEqual(['one', 'two']);
    expect(container.querySelector('[variant]')).toBeNull();
    expect(container.querySelectorAll('[data-ui="pin-input"][data-slot="slot"]')).toHaveLength(6);
    for (const boundary of container.querySelectorAll('.ui-input-variant')) {
      expect(boundary).toHaveAttribute('data-variant', variant);
      expect(boundary.classList.contains('ui-input-contrast')).toBe(variant === 'contrast');
    }
    expect(
      container
        .querySelector('[data-ui="time-range-picker"]')
        ?.querySelectorAll('.ui-input-variant'),
    ).toHaveLength(2);
    expect(
      container
        .querySelector('[data-ui="date-time-range-picker"]')
        ?.querySelectorAll('.ui-input-variant'),
    ).toHaveLength(2);
  });

  it.each(variants)('keeps PIN paste, completion, refs and native reset in %s', async (variant) => {
    const ref = React.createRef<HTMLInputElement>();
    const completed: string[] = [];
    const { container } = render(
      <form>
        <PinInput
          ref={ref}
          variant={variant}
          name="code"
          defaultValue="12"
          onComplete={(v) => completed.push(v)}
          aria-label="Code"
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByLabelText('Code') as HTMLInputElement;
    expect(ref.current).toBe(input);
    await userEvent.click(input);
    input.setSelectionRange(2, 2);
    fireEvent.paste(input, { clipboardData: { getData: () => '3-4 56' } });
    expect(input).toHaveValue('123456');
    expect(completed).toEqual(['123456']);
    expect(new FormData(container.querySelector('form')!).get('code')).toBe('123456');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('12');
  });

  it.each(variants)(
    'retains search actions, numeric controls, password reveal and tags in %s',
    async (variant) => {
      render(<Fields variant={variant} />);
      await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(screen.getByRole('searchbox')).toHaveFocus();
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(screen.getByRole('spinbutton', { name: 'Seats' })).toHaveValue(4);
      await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
      await userEvent.type(screen.getByLabelText('Tags'), 'three{Enter}');
      const form = screen.getByRole('form') as HTMLFormElement;
      expect(new FormData(form).getAll('tag')).toEqual(['one', 'two', 'three']);
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
      expect(screen.getByRole('searchbox')).toHaveValue('Atlas');
      expect(screen.getByRole('spinbutton', { name: 'Seats' })).toHaveValue(3);
      expect(new FormData(form).getAll('tag')).toEqual(['one', 'two']);
    },
  );

  it('keeps unstyled native controls, labels and custom slots without variant classes', () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(
      <StyleProvider unstyled styles={{ 'pin-input.slot': 'custom-slot' }}>
        <PinInput ref={ref} variant="contrast" disabled required aria-label="Code" aria-invalid />
        <SearchInput variant="filled" readOnly aria-label="Search" />
      </StyleProvider>,
    );
    expect(ref.current).toBeDisabled();
    expect(ref.current).toBeRequired();
    expect(ref.current).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelectorAll('.custom-slot')).toHaveLength(6);
    expect(container.querySelector('.ui-input-variant, .ui-input-contrast')).toBeNull();
  });

  it('renders every appearance on the server without leaking variant props to native elements', () => {
    for (const variant of variants) {
      const markup = renderToString(<Fields variant={variant} />);
      expect(markup).toContain(`data-variant="${variant}"`);
      expect(markup).not.toMatch(/\svariant=/);
      expect(markup).toContain('value="123456"');
      expect(markup).toContain('type="button"');
    }
  });
});
