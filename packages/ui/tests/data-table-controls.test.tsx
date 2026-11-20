import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  useDataTable,
  DataTableView,
  DataTableSearch,
  DataTableFilters,
  DataTableFieldFilter,
  DataTableSort,
  DataTableColumns,
  DataTableReset,
  DataTableActiveFilters,
  DataTablePagination,
  DataTableSelectionToggle,
  DataTableSelectionActions,
  emptyTableQuery,
  type DataTableColumn,
  type DataTableFilterField,
  type DataTableInstance,
  type DataTableQuery,
} from '../src/ui/data-table';
import { StyleProvider } from '../src/ui/styling';

type Row = { id: string; name: string; amount: number; status: string };
const data: Row[] = [
  { id: 'a', name: 'Alpha', amount: 10, status: 'Draft' },
  { id: 'b', name: 'Beta', amount: 20, status: 'Active' },
  { id: 'c', name: 'Gamma', amount: 30, status: 'Active' },
  { id: 'd', name: 'Delta', amount: 40, status: 'Done' },
];
const columns: DataTableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
];
const fields: DataTableFilterField<Row>[] = [
  { id: 'amount', label: 'Amount', type: 'number' },
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Draft', label: 'Draft' },
    ],
  },
];
let table: DataTableInstance<Row>;
function Fixture({
  query,
  change,
  searchRef,
  searchChange,
  columnsRef,
  cancelReset,
}: {
  query?: DataTableQuery;
  change?: (query: DataTableQuery) => void;
  searchRef?: React.Ref<HTMLInputElement>;
  searchChange?: React.ChangeEventHandler<HTMLInputElement>;
  columnsRef?: React.Ref<HTMLButtonElement>;
  cancelReset?: boolean;
}) {
  const [mode, setMode] = React.useState<'browse' | 'selection'>('browse');
  table = useDataTable({
    data,
    columns,
    filterFields: fields,
    pageSize: 2,
    getRowId: (row) => row.id,
    query,
    onQueryChange: change,
  });
  return (
    <>
      <form id="query-form" aria-label="Query form" />
      <header data-testid="external-tools">
        <DataTableSearch
          table={table}
          ref={searchRef}
          id="external-search"
          name="q"
          form="query-form"
          onChange={searchChange}
        />
        <DataTableFilters table={table} fields={fields} />
        <DataTableSort table={table} />
        <DataTableColumns table={table} ref={columnsRef} id="external-columns" />
        <DataTableReset
          table={table}
          onClick={(event) => {
            if (cancelReset) event.preventDefault();
          }}
        />
        <DataTableSelectionToggle table={table} mode={mode} onModeChange={setMode} />
      </header>
      <aside aria-label="Field filters">
        <DataTableFieldFilter table={table} field={fields[1]} />
      </aside>
      <section data-testid="active-filters">
        <DataTableActiveFilters table={table} fields={fields} />
      </section>
      <main>
        <DataTableView
          table={table}
          caption="Records"
          showToolbar={false}
          showPagination={false}
          selectable
          mode={mode}
          onModeChange={setMode}
        />
      </main>
      <aside>
        <DataTableSelectionActions table={table}>
          <button>Archive selected rows</button>
        </DataTableSelectionActions>
      </aside>
      <footer>
        <DataTablePagination
          table={table}
          selectable={mode === 'selection'}
          pageSizes={[2, 4, 8]}
        />
      </footer>
    </>
  );
}
const records = () => screen.getByRole('table', { name: 'Records' });

describe('independently placed DataTable controls', () => {
  it('shares search and pagination while the entire built-in toolbar and footer are hidden', async () => {
    const ref = React.createRef<HTMLInputElement>();
    const change = vi.fn();
    const { container } = render(<Fixture searchRef={ref} searchChange={change} />);
    expect(within(records()).getAllByRole('row')).toHaveLength(3);
    expect(container.querySelector('.ui-data-table .ui-table-toolbar')).toBeNull();
    expect(container.querySelector('.ui-data-table .ui-data-table-footer')).toBeNull();
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);
    expect(ref.current).toBe(screen.getByRole('searchbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(within(records()).getByText('Gamma')).toBeVisible();
    await userEvent.type(screen.getByRole('searchbox'), 'Beta');
    expect(change).toHaveBeenCalled();
    expect(table.state.pagination.pageIndex).toBe(0);
    expect(within(records()).getByText('Beta')).toBeVisible();
    expect(within(records()).queryByText('Alpha')).not.toBeInTheDocument();
    expect(
      new FormData(screen.getByRole('form', { name: 'Query form' }) as HTMLFormElement).get('q'),
    ).toBe('Beta');
  });

  it('links the external advanced filter editor, active chips and reset action', async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: /^Filters/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Add filter' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Filter value for Amount' }), {
      target: { value: '20' },
    });
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['b']);
    await userEvent.keyboard('{Escape}');
    const chips = within(screen.getByTestId('active-filters'));
    expect(chips.getByRole('button')).toHaveTextContent('Amount');
    await userEvent.click(chips.getByRole('button', { name: 'Remove filter' }));
    expect(table.getFilteredRowModel().rows).toHaveLength(4);
    expect(chips.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sorts from a detached button and reflects the result in native headers and rows', async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: /^Sort/ }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Add sort' }));
    await userEvent.click(screen.getByRole('option', { name: 'Amount' }));
    await userEvent.click(screen.getByRole('combobox', { name: /amount/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Descending' }));
    await userEvent.keyboard('{Escape}');
    expect(table.state.sorting).toEqual([{ id: 'amount', desc: true }]);
    expect(within(records()).getAllByRole('row')[1]).toHaveTextContent('Delta');
    expect(within(records()).getByRole('columnheader', { name: 'Amount' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('forwards the external column trigger ref and protects the last visible column', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Fixture columnsRef={ref} />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Columns' }));
    expect(ref.current).toHaveAttribute('id', 'external-columns');
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Amount' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Status' }));
    expect(table.getVisibleLeafColumns().map((column) => column.id)).toEqual(['name']);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Name' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('shares selection mode and selected IDs across external actions and pagination', async () => {
    render(<Fixture />);
    expect(within(records()).queryByRole('checkbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Select' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row a' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row c' }));
    expect(screen.getByRole('region', { name: 'Selected row actions' })).toHaveTextContent(
      '2 selected',
    );
    expect(table.getSelectedRowIds()).toEqual(['a', 'c']);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(table.getSelectedRowIds()).toEqual([]);
    expect(within(records()).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Selected row actions' })).not.toBeInTheDocument();
  });

  it('keeps controlled query proposals pending until the table owner commits them', async () => {
    const change = vi.fn();
    const { rerender } = render(<Fixture query={emptyTableQuery} change={change} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Beta' } });
    expect(change).toHaveBeenLastCalledWith({ ...emptyTableQuery, search: 'Beta' });
    expect(screen.getByRole('searchbox')).toHaveValue('');
    rerender(<Fixture query={{ ...emptyTableQuery, search: 'Beta' }} change={change} />);
    expect(screen.getByRole('searchbox')).toHaveValue('Beta');
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['b']);
  });

  it('cancels reset through its native handler and otherwise resets only the query', async () => {
    const { rerender } = render(<Fixture cancelReset />);
    act(() => {
      table.setGlobalFilter({ ...emptyTableQuery, search: 'Beta' });
      table.setSorting([{ id: 'amount', desc: true }]);
      table.getColumn('status')!.toggleVisibility(false);
    });
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('searchbox')).toHaveValue('Beta');
    rerender(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(table.state.sorting).toEqual([{ id: 'amount', desc: true }]);
    expect(table.getColumn('status')!.getIsVisible()).toBe(false);
  });

  it('lets a simple field filter clear the same query that an outside owner sets', async () => {
    render(<Fixture />);
    act(() =>
      table.setGlobalFilter({
        ...emptyTableQuery,
        filters: [{ id: 'status', field: 'status', operator: 'in', value: ['Active'] }],
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Status: Active' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(tableQueryFilters()).toEqual([]);
    expect(table.getFilteredRowModel().rows).toHaveLength(4);
  });

  it('keeps different table instances independent and supports unstyled/native slots and SSR', async () => {
    function Pair() {
      const first = useDataTable({ data, columns });
      const second = useDataTable({ data, columns });
      return (
        <StyleProvider
          styles={{
            'data-table.search': 'custom-search',
            'data-table.sort': 'header-sort',
            'data-table.sort-trigger': 'detached-sort',
          }}
        >
          <DataTableSearch table={first} aria-label="First search" unstyled />
          <DataTableSearch table={second} aria-label="Second search" />
          <DataTableSort table={first} aria-label="Detached sort" unstyled />
          <DataTableReset table={first} aria-label="Unstyled reset" alwaysVisible unstyled />
          <DataTableSelectionToggle
            table={first}
            aria-label="Unstyled selection"
            mode="browse"
            onModeChange={() => {}}
            unstyled
          />
          <aside aria-label="Unstyled filters">
            <StyleProvider unstyled>
              <DataTableFieldFilter table={first} field={fields[1]} />
            </StyleProvider>
          </aside>
          <DataTableView
            table={first}
            caption="First records"
            showToolbar={false}
            showPagination={false}
          />
          <DataTableView
            table={second}
            caption="Second records"
            showToolbar={false}
            showPagination={false}
          />
        </StyleProvider>
      );
    }
    render(<Pair />);
    expect(screen.getByRole('searchbox', { name: 'First search' })).toHaveClass('custom-search');
    expect(screen.getByRole('searchbox', { name: 'First search' })).not.toHaveClass(
      'ui-advanced-input',
    );
    expect(screen.getByRole('button', { name: 'Unstyled reset' })).not.toHaveClass(
      'ui-interactive',
    );
    expect(screen.getByRole('button', { name: 'Unstyled selection' })).not.toHaveClass(
      'ui-interactive',
    );
    expect(screen.getByRole('button', { name: 'Detached sort' })).toHaveClass('detached-sort');
    expect(screen.getByRole('button', { name: 'Detached sort' })).not.toHaveClass('header-sort');
    expect(
      within(screen.getByRole('table', { name: 'First records' })).getByRole('button', {
        name: 'Amount',
      }),
    ).toHaveClass('header-sort');
    await userEvent.type(screen.getByRole('searchbox', { name: 'First search' }), 'Beta');
    expect(
      within(screen.getByRole('table', { name: 'First records' })).queryByText('Alpha'),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'Second records' })).getByText('Alpha'),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Second search' })).toHaveValue('');
    await userEvent.click(
      within(screen.getByRole('complementary', { name: 'Unstyled filters' })).getByRole('button', {
        name: 'Status',
      }),
    );
    expect(screen.getByRole('dialog', { name: 'Status' })).not.toHaveClass(
      'ui-table-simple-filter',
    );
    await userEvent.keyboard('{Escape}');
    expect(renderToString(<Pair />)).toContain('type="search"');
  });
});

function tableQueryFilters() {
  return (table.state.globalFilter as DataTableQuery).filters;
}
