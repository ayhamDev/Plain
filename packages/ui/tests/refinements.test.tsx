import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { List, ListItemTitle } from '../src/ui/list';
import { Card, CardContent, Progress, Alert, AlertTitle } from '../src/ui/primitives';
import { Input, Textarea } from '../src/ui/forms';
import { NumberInput, MultiSelect } from '../src/ui/advanced';
import { DataTable, type DataTableColumn } from '../src/ui/data-table';
import {
  NavigationRail,
  SidebarProvider,
  SidebarHeader,
  SidebarTrigger,
  Stepper,
} from '../src/ui/sidebar';

const items = [
  { id: 'a', name: 'Design review' },
  { id: 'b', name: 'Release notes' },
  { id: 'c', name: 'Research' },
];
const listProps = {
  items,
  getItemKey: (item: (typeof items)[number]) => item.id,
  getItemLabel: (item: (typeof items)[number]) => item.name,
  renderItem: (item: (typeof items)[number]) => <ListItemTitle>{item.name}</ListItemTitle>,
};
const columns: DataTableColumn<(typeof items)[number]>[] = [
  { accessorKey: 'name', header: 'Name' },
];

describe('collection interaction modes', () => {
  it('forwards a native collection ref and propagates unstyled parts', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<List {...listProps} ref={ref} unstyled selectable />);
    expect(ref.current).toBe(container.querySelector('[data-ui="list"][data-slot="root"]'));
    expect(container.querySelector('.ui-list-mode-controls')).not.toBeInTheDocument();
    expect(screen.getByText('Design review')).toBeVisible();
  });
  it('has an explicit browse mode without checkbox semantics and enters/exits selection', async () => {
    const change = vi.fn();
    render(<List {...listProps} selectable onSelectedKeysChange={change} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Select' }));
    await userEvent.click(screen.getByText('Design review'));
    expect(change).toHaveBeenLastCalledWith(['a']);
    expect(screen.getByRole('checkbox', { name: 'Select row Design review' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(change).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('supports controlled keys and does not hijack nested row actions', async () => {
    const change = vi.fn(),
      action = vi.fn();
    const { rerender } = render(
      <List
        {...listProps}
        selectable
        defaultMode="selection"
        selectedKeys={[]}
        onSelectedKeysChange={change}
        renderItem={(item) => <button onClick={action}>{item.name}</button>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Design review' }));
    expect(action).toHaveBeenCalledOnce();
    expect(change).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row Design review' }));
    expect(change).toHaveBeenLastCalledWith(['a']);
    expect(screen.getByRole('checkbox', { name: 'Select row Design review' })).not.toBeChecked();
    rerender(
      <List
        {...listProps}
        selectable
        defaultMode="selection"
        selectedKeys={['a']}
        onSelectedKeysChange={change}
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Select row Design review' })).toBeChecked();
  });
  it('supports one selection, disabled records and custom empty/loading content', async () => {
    const { rerender } = render(
      <List
        {...listProps}
        selectable
        defaultMode="selection"
        selectionType="single"
        getItemDisabled={(item) => item.id === 'c'}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row Design review' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row Release notes' }));
    expect(screen.getByRole('checkbox', { name: 'Select row Design review' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select row Release notes' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select row Research' })).toBeDisabled();
    rerender(<List {...listProps} items={[]} renderEmpty={<p>Nothing in this folder</p>} />);
    expect(screen.getByText('Nothing in this folder')).toBeVisible();
    rerender(<List {...listProps} loading aria-label="Records" />);
    expect(screen.queryByText('Design review')).not.toBeInTheDocument();
  });
  it('independently hides table tools and renders all loaded rows when pagination is disabled', () => {
    render(
      <DataTable
        data={items}
        columns={columns}
        pageSize={1}
        pagination={false}
        searchable={false}
        filterable={false}
        sortable={false}
        columnControls={false}
        showToolbar={false}
      />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });
  it('supports table browse/selection transitions and selects all non-paginated rows', async () => {
    render(
      <DataTable
        data={items}
        columns={columns}
        getRowId={(row) => row.id}
        pageSize={1}
        pagination={false}
        selectable
        defaultMode="browse"
      />,
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Select' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select current page' }));
    expect(
      screen
        .getAllByRole('checkbox')
        .every((node) => node.getAttribute('data-state') === 'checked'),
    ).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('hides filter and sort UI without removing native column headers', () => {
    const { container } = render(
      <DataTable
        data={items}
        columns={columns}
        filterable={false}
        sortable={false}
        searchable={false}
        columnControls={false}
        filterFields={[{ id: 'name', label: 'Name', type: 'text' }]}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Filters' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sort' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(
      container.querySelector('[data-ui="data-table"][data-slot="toolbar"]'),
    ).not.toBeInTheDocument();
  });
});

describe('configurable visual primitives', () => {
  it('keeps native multi-select submission and accessible values in compact summary mode', async () => {
    render(
      <form data-testid="departments">
        <MultiSelect
          name="department"
          aria-label="Departments"
          selectionDisplay="summary"
          defaultValue={['design', 'engineering']}
          options={[
            { value: 'design', label: 'Design' },
            { value: 'engineering', label: 'Engineering' },
          ]}
        />
      </form>,
    );
    const control = screen.getByRole('combobox', { name: 'Departments' });
    expect(control).toHaveAccessibleDescription('Design, Engineering');
    expect(control).toHaveAttribute('placeholder', 'Design, Engineering');
    expect(
      new FormData(screen.getByTestId('departments') as HTMLFormElement).getAll('department'),
    ).toEqual(['design', 'engineering']);
    expect(screen.queryByRole('button', { name: 'Remove Design' })).not.toBeInTheDocument();
    await userEvent.click(control);
    await userEvent.keyboard('{Backspace}');
    expect(control).toHaveAccessibleDescription('Design');
    expect(
      new FormData(screen.getByTestId('departments') as HTMLFormElement).getAll('department'),
    ).toEqual(['design']);
  });
  it('exposes a single aggregate progressbar and readable segment values', () => {
    const { container } = render(
      <Progress
        aria-label="Storage"
        max={100}
        segments={[
          { id: 'docs', label: 'Documents', value: 24, color: '#2563eb' },
          { id: 'media', label: 'Media', value: 32, color: 'var(--ui-chart-2)' },
        ]}
        formatValue={(value) => `${value} GB`}
      />,
    );
    const progress = screen.getByRole('progressbar', { name: 'Storage' });
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(progress).toHaveAttribute('aria-valuenow', '56');
    expect(progress).toHaveAttribute('aria-valuetext', 'Documents: 24 GB; Media: 32 GB');
    expect(container.querySelector('.ui-progress-segment')).toHaveStyle({
      width: '24%',
      backgroundColor: '#2563eb',
    });
    expect(screen.getByText('32 GB')).toBeVisible();
  });
  it('scales over-capacity groups, ignores invalid allocations and can hide the legend', () => {
    const { container } = render(
      <Progress
        aria-label="Capacity"
        max={100}
        showLegend={false}
        segments={[
          { id: 'a', label: 'A', value: 100 },
          { id: 'b', label: 'B', value: 100 },
          { id: 'c', label: 'C', value: NaN },
        ]}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(container.querySelectorAll('.ui-progress-segment')[0]).toHaveStyle({ width: '50%' });
    expect(container.querySelectorAll('.ui-progress-segment')[2]).toHaveStyle({ width: '0%' });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
  it('keeps native card link semantics and state/size options', () => {
    render(
      <Card asChild variant="elevated" size="sm" selected interactive>
        <a href="/project">
          <CardContent>Project details</CardContent>
        </a>
      </Card>,
    );
    const card = screen.getByRole('link', { name: 'Project details' });
    expect(card).toHaveAttribute('href', '/project');
    expect(card).toHaveAttribute('data-variant', 'elevated');
    expect(card).toHaveAttribute('data-size', 'sm');
    expect(card).toHaveAttribute('data-selected');
  });
  it('keeps finite allocation proportions when their sum would overflow', () => {
    const { container } = render(
      <Progress
        aria-label="Large capacity"
        segments={[
          { id: 'a', label: 'A', value: Number.MAX_VALUE },
          { id: 'b', label: 'B', value: Number.MAX_VALUE },
        ]}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    for (const part of container.querySelectorAll('.ui-progress-segment'))
      expect(part).toHaveStyle({ width: '50%' });
  });
  it('propagates unstyled composition through Card parts', () => {
    const { container } = render(
      <Card unstyled>
        <CardContent>App-owned card</CardContent>
      </Card>,
    );
    expect(container.querySelector('[data-slot="content"]')).not.toHaveClass('ui-card-content');
    expect(screen.getByText('App-owned card')).toBeVisible();
  });
  it('retains native form values with contrast variants and hidden number controls', () => {
    render(
      <form data-testid="form">
        <Input variant="contrast" name="name" defaultValue="Design" />
        <Textarea variant="contrast" name="notes" defaultValue="Review" />
        <NumberInput variant="contrast" name="seats" defaultValue={5} showControls={false} />
      </form>,
    );
    expect(screen.queryByRole('button', { name: 'Increase value' })).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('seats')).toBe('5');
  });
  it('supports independent Alert action and dismiss slots', async () => {
    const dismiss = vi.fn(),
      action = vi.fn();
    render(
      <Alert
        variant="success"
        appearance="outlined"
        onDismiss={dismiss}
        action={<button onClick={action}>Undo</button>}
      >
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(action).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(dismiss).toHaveBeenCalledOnce();
  });
});

describe('navigation configuration', () => {
  it('keeps a persistent navigation rail independent of the sidebar collapse control', async () => {
    const change = vi.fn();
    render(
      <SidebarProvider>
        <NavigationRail
          aria-label="Workspaces"
          items={[
            { value: 'a', label: 'Projects', icon: <span>P</span> },
            { value: 'b', label: 'Inbox', icon: <span>I</span> },
          ]}
          onValueChange={change}
        />
        <SidebarTrigger />
      </SidebarProvider>,
    );
    const rail = screen.getByRole('navigation', { name: 'Workspaces' });
    await userEvent.click(within(rail).getByRole('button', { name: 'Inbox' }));
    expect(change).toHaveBeenLastCalledWith('b');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    expect(within(rail).getByRole('button', { name: 'Inbox' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
  it('preserves expanded sidebar input state instead of remounting it on collapse', async () => {
    render(
      <SidebarProvider>
        <SidebarHeader collapsedContent={<span>Mark</span>}>
          <input aria-label="Workspace" defaultValue="Original" />
        </SidebarHeader>
        <SidebarTrigger />
      </SidebarProvider>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Edited' } });
    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(screen.getByRole('textbox')).toHaveValue('Edited');
  });
  it('retains inactive Stepper content with keepMounted and keeps native form state', async () => {
    render(
      <Stepper
        keepMounted
        steps={[
          { value: 'one', label: 'Details' },
          { value: 'two', label: 'Team' },
        ]}
        renderContent={(step) => <input aria-label={step.label + ' notes'} />}
      />,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Details notes' }), 'Keep this');
    await userEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(screen.queryByRole('textbox', { name: 'Details notes' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('textbox', { name: 'Details notes' })).toHaveValue('Keep this');
  });
});
