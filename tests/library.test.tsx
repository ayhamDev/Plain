import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import {
  Button,
  Badge,
  Input,
  Field,
  Checkbox,
  PlainProvider,
  StyleProvider,
  ThemeScope,
  useTheme,
  validateTheme,
  defaultTheme,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Combobox,
  DatePicker,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  DataTable,
  Pagination,
  type DataTableColumn,
} from '../src/ui';

describe('native composition', () => {
  it('blocks a disabled child link handler and its explicit tab index', () => {
    const handler = vi.fn();
    render(
      <Button asChild disabled>
        <a href="#project" tabIndex={0} onClick={handler}>
          Disabled
        </a>
      </Button>,
    );
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(handler).not.toHaveBeenCalled();
    expect(link).toHaveAttribute('tabindex', '-1');
  });
  it('keeps a disabled composed link out of the tab order', () => {
    render(
      <Button asChild disabled tabIndex={0}>
        <a href="#project">Disabled</a>
      </Button>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1');
  });
  it('slots a single link, preserving its content and click behavior', async () => {
    const handler = vi.fn();
    render(
      <Button asChild onClick={handler}>
        <a href="#project">Create project</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Create project' });
    expect(link).toHaveAttribute('href', '#project');
    await userEvent.click(link);
    expect(handler).toHaveBeenCalledOnce();
  });
  it('prevents repeat actions while loading', async () => {
    const handler = vi.fn();
    render(
      <Button loading onClick={handler}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(handler).not.toHaveBeenCalled();
  });
  it('connects labels, descriptions, errors, and an explicit input id', () => {
    render(
      <Field label="Email" description="Private" error="Invalid email" required>
        <Input id="email" required />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-describedby', 'email-description email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toBeRequired();
  });
  it('forwards input refs to the native element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" />);
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Name' }));
  });
  it('preserves native checkbox form values and keyboard behavior', async () => {
    const { container } = render(
      <form>
        <Checkbox name="notifications" value="enabled" aria-label="Email updates" />
      </form>,
    );
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await userEvent.keyboard(' ');
    expect(checkbox).toBeChecked();
    expect(new FormData(container.querySelector('form')!).get('notifications')).toBe('enabled');
  });
});

describe('styling and direction', () => {
  it('honors callback-ref cleanup when a theme scope unmounts', () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const { unmount } = render(
      <ThemeScope ref={ref}>
        <Button>Scoped</Button>
      </ThemeScope>,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
  it('exposes stable variant and size attributes for product CSS', () => {
    render(
      <>
        <Button variant="accent" size="sm">
          Create
        </Button>
        <Badge variant="solid">New</Badge>
      </>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'accent');
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByText('New')).toHaveAttribute('data-variant', 'solid');
  });
  it('honors an explicit native direction on a progress element', () => {
    const { container } = render(<Progress dir="rtl" value={50} aria-label="Progress" />);
    expect(container.querySelector('[data-slot="indicator"]')).toHaveStyle({
      width: '50%',
    });
  });
  it('removes default classes throughout composite controls', () => {
    const { container } = render(
      <>
        <DatePicker unstyled aria-label="Date" />
        <Combobox unstyled options={[]} aria-label="Choice" />
        <DataTable
          unstyled
          id="records"
          data={[]}
          columns={[{ accessorKey: 'name', header: 'Name' }]}
        />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Date' }).className).toBe('');
    expect(screen.getByRole('combobox', { name: 'Choice' }).className).toBe('');
    expect(container.querySelector('#records')).toHaveAttribute('data-ui', 'data-table');
    expect(container.querySelector('#records')?.className).toBe('');
    expect(screen.getByRole('table').className).toBe('');
  });
  it('normalizes invalid progress ranges and values', () => {
    const { rerender } = render(<Progress value={300} max={200} aria-label="Progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '200');
    rerender(<Progress value={NaN} max={0} aria-label="Progress" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });
  it('merges provider slots before local classes', () => {
    render(
      <StyleProvider styles={{ 'button.root': 'rounded-full px-8' }}>
        <Button className="px-2">Styled</Button>
      </StyleProvider>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('rounded-full', 'px-2');
    expect(button).not.toHaveClass('px-8');
    expect(button).toHaveAttribute('data-ui', 'button');
    expect(button).toHaveAttribute('data-slot', 'root');
  });
  it('removes defaults while preserving supplied classes in unstyled mode', () => {
    render(
      <StyleProvider unstyled>
        <Button className="custom-button">Plain</Button>
      </StyleProvider>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('class', 'custom-button');
  });
  it('allows an individual component to keep defaults inside an unstyled scope', () => {
    render(
      <StyleProvider unstyled>
        <Button unstyled={false}>Styled exception</Button>
      </StyleProvider>,
    );
    expect(screen.getByRole('button')).toHaveClass('inline-flex');
  });
  it('sanitizes corrupt persisted settings', () => {
    expect(
      validateTheme({ mode: 'unknown', accent: 'magenta', radius: Infinity, density: 'tiny' }),
    ).toEqual(defaultTheme);
    expect(validateTheme({ radius: 200 }).radius).toBe(24);
  });
  it('keeps explicit token overrides when the theme changes', async () => {
    function Toggle() {
      const { setTheme } = useTheme();
      return <Button onClick={() => setTheme({ mode: 'dark', radius: 8 })}>Dark</Button>;
    }
    render(
      <PlainProvider persist={false} tokens={{ radius: '18px', accent: '#123456' }}>
        <Toggle />
      </PlainProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--ui-radius')).toBe('18px');
    expect(document.documentElement.style.getPropertyValue('--ui-accent')).toBe('#123456');
  });
  it('applies scoped tokens and direction to portaled popovers', async () => {
    const { container } = render(
      <ThemeScope dir="rtl" tokens={{ accent: '#123456' }} data-testid="scope">
        <Popover>
          <PopoverTrigger asChild>
            <Button>Details</Button>
          </PopoverTrigger>
          <PopoverContent>Scoped content</PopoverContent>
        </Popover>
      </ThemeScope>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Details' }));
    const scope = container.querySelector('[data-testid="scope"]')!;
    expect(scope).toHaveAttribute('dir', 'rtl');
    expect(scope).toContainElement(screen.getByText('Scoped content'));
  });
  it('uses RTL arrow behavior for tabs and progress', async () => {
    render(
      <PlainProvider dir="rtl" persist={false}>
        <Tabs defaultValue="one">
          <TabsList aria-label="Sections">
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First</TabsContent>
          <TabsContent value="two">Second</TabsContent>
        </Tabs>
        <Progress value={25} aria-label="Completion" />
      </PlainProvider>,
    );
    screen.getByRole('tab', { name: 'One' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({
      width: '25%',
    });
  });
});

describe('interaction contracts', () => {
  it('restores focus when a dialog closes with Escape', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Edit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your name.</DialogDescription>
          <Input aria-label="Name" />
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Edit' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('supports typeahead and selection in a native-form select', async () => {
    render(
      <form>
        <Select defaultValue="design" name="department">
          <SelectTrigger aria-label="Department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
          </SelectContent>
        </Select>
      </form>,
    );
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{Enter}{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Engineering'));
  });
  it('filters combobox options and submits the selected value', async () => {
    const { container } = render(
      <form>
        <Combobox
          name="framework"
          aria-label="Framework"
          options={[
            { value: 'react', label: 'React' },
            { value: 'astro', label: 'Astro' },
          ]}
        />
      </form>,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Framework' }));
    await userEvent.type(screen.getByPlaceholderText('Search options...'), 'ast');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('combobox', { name: 'Framework' })).toHaveTextContent('Astro');
    expect(new FormData(container.querySelector('form')!).get('framework')).toBe('astro');
  });
  it('clears a controlled date instead of falling back to stale internal state', async () => {
    function Example() {
      const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 9, 14));
      return <DatePicker value={date} onValueChange={setDate} aria-label="Due date" />;
    }
    render(<Example />);
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveAccessibleDescription(
      'Oct 14, 2026',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Due date' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('Pick a date');
  });
  it('treats invalid dates as empty instead of throwing during rendering', () => {
    render(<DatePicker value={new Date('invalid')} aria-label="Due date" />);
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('Pick a date');
  });
  it('paginates, sorts, and filters records', async () => {
    const data = [
      { name: 'Cedar', amount: 3 },
      { name: 'Atlas', amount: 1 },
      { name: 'Birch', amount: 2 },
    ];
    const columns: DataTableColumn<(typeof data)[number]>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'amount', header: 'Amount' },
    ];
    render(<DataTable data={data} columns={columns} pageSize={2} caption="Projects" />);
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('cell', { name: 'Birch' })).toBeVisible();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search records...' }), 'Atlas');
    expect(screen.getByRole('cell', { name: 'Atlas' })).toBeVisible();
    expect(screen.queryByRole('cell', { name: 'Cedar' })).not.toBeInTheDocument();
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search records...' }));
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Atlas');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });
  it('disables pagination controls at boundaries', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} pageCount={1} onPageChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
  it('handles grouped column spans in headers and empty states', () => {
    const columns: DataTableColumn<{ name: string; amount: number }>[] = [
      {
        header: 'Project',
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'amount', header: 'Amount' },
        ],
      },
    ];
    const { container } = render(<DataTable data={[]} columns={columns} searchable={false} />);
    expect(screen.getByRole('columnheader', { name: 'Project' })).toHaveAttribute('colspan', '2');
    expect(container.querySelector('tbody td')).toHaveAttribute('colspan', '2');
  });
  it('keeps empty and malformed pagination bounded and unstyled', () => {
    render(<Pagination page={NaN} pageCount={Infinity} onPageChange={vi.fn()} unstyled />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' }).className).toBe('');
  });
  it('renders core components without a browser or stylesheet', () => {
    const html = renderToString(
      <PlainProvider dir="rtl" persist={false}>
        <Field label="Name">
          <Input name="name" />
        </Field>
        <Button>Start</Button>
      </PlainProvider>,
    );
    expect(html).toContain('data-ui="input"');
    expect(html).toContain('Start');
  });
});
